import { createClient } from '@/lib/supabase/client'

// VAPID public key - this is safe to expose (it's a public key)
// Generate your own at: https://vapidkeys.com/
// Or use: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export async function isPushSupported(): Promise<boolean> {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function getPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return await Notification.requestPermission()
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.error('VAPID public key not configured')
    return null
  }

  try {
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    // Save subscription to database
    await saveSubscriptionToServer(subscription)

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      // Remove from database first
      await removeSubscriptionFromServer(subscription.endpoint)
      // Then unsubscribe locally
      await subscription.unsubscribe()
    }

    return true
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error)
    return false
  }
}

async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const key = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')

  if (!key || !auth) {
    throw new Error('Invalid subscription keys')
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
      auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,endpoint'
    })

  if (error) {
    throw error
  }
}

async function removeSubscriptionFromServer(endpoint: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)
}

// Test function to send a test notification
export async function sendTestNotification(): Promise<void> {
  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification('Test fra samiske.no', {
      body: 'Push-varsler fungerer!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'test-notification',
    })
  }
}
