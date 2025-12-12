// Supabase Edge Function for sending Web Push notifications
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// VAPID keys - these should be set as secrets in Supabase
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:noreply@samiske.no'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface PushQueueItem {
  id: string
  user_id: string
  title: string
  body: string
  url: string
  tag: string
}

interface PushSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

// Web Push implementation using web-push-libs concept
async function sendWebPush(
  subscription: PushSubscription,
  payload: { title: string; body: string; url: string; tag: string }
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, error: 'VAPID keys not configured' }
  }

  try {
    // Import the web-push library for Deno
    const webpush = await import("https://esm.sh/web-push@3.6.7")

    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    )

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check if subscription is invalid (410 Gone or 404)
    if (errorMessage.includes('410') || errorMessage.includes('404')) {
      return { success: false, error: 'subscription_expired' }
    }

    return { success: false, error: errorMessage }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verify authorization
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  // Parse request body
  let maxNotifications = 20
  try {
    const body = await req.json()
    if (body.max_notifications) maxNotifications = Math.min(body.max_notifications, 100)
  } catch {
    // Use defaults
  }

  // Fetch pending push notifications
  const { data: notifications, error: fetchError } = await supabase
    .from('push_queue')
    .select('id, user_id, title, body, url, tag')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(maxNotifications)

  if (fetchError) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch notifications',
      details: fetchError.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!notifications || notifications.length === 0) {
    return new Response(JSON.stringify({
      message: 'No pending push notifications',
      sent: 0,
      failed: 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Mark as sending
  const notificationIds = notifications.map(n => n.id)
  await supabase
    .from('push_queue')
    .update({ status: 'sending' })
    .in('id', notificationIds)

  // Group by user_id for efficiency
  const byUser = new Map<string, PushQueueItem[]>()
  for (const notification of notifications) {
    const existing = byUser.get(notification.user_id) || []
    existing.push(notification)
    byUser.set(notification.user_id, existing)
  }

  let sent = 0
  let failed = 0
  const expiredSubscriptions: string[] = []

  // Process each user's notifications
  for (const [userId, userNotifications] of byUser) {
    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
      // No subscriptions, mark all as failed
      for (const notification of userNotifications) {
        await supabase
          .from('push_queue')
          .update({
            status: 'failed',
            error_message: 'No push subscriptions'
          })
          .eq('id', notification.id)
        failed++
      }
      continue
    }

    // Send to all subscriptions
    for (const notification of userNotifications) {
      let sentToAny = false

      for (const subscription of subscriptions) {
        const result = await sendWebPush(subscription, {
          title: notification.title,
          body: notification.body,
          url: notification.url,
          tag: notification.tag,
        })

        if (result.success) {
          sentToAny = true
        } else if (result.error === 'subscription_expired') {
          expiredSubscriptions.push(subscription.endpoint)
        }
      }

      // Update status
      await supabase
        .from('push_queue')
        .update({
          status: sentToAny ? 'sent' : 'failed',
          sent_at: sentToAny ? new Date().toISOString() : null,
          error_message: sentToAny ? null : 'Failed to send to any subscription'
        })
        .eq('id', notification.id)

      if (sentToAny) {
        sent++
      } else {
        failed++
      }
    }
  }

  // Clean up expired subscriptions
  if (expiredSubscriptions.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredSubscriptions)
  }

  return new Response(
    JSON.stringify({
      message: `Processed ${notifications.length} push notifications`,
      sent,
      failed,
      expired_subscriptions_removed: expiredSubscriptions.length,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
})
