// Supabase Edge Function for sending SMS via Twilio
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Twilio credentials - set as secrets in Supabase Dashboard
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') // Your Twilio number

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface SmsQueueItem {
  id: string
  user_id: string
  phone_number: string
  message: string
  sms_type: string
}

// Send SMS via Twilio
async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return { success: false, error: 'Twilio not configured' }
  }

  // Format phone number (add +47 for Norwegian numbers if needed)
  let formattedPhone = to.replace(/\s/g, '')
  if (!formattedPhone.startsWith('+')) {
    // Assume Norwegian number
    if (formattedPhone.startsWith('00')) {
      formattedPhone = '+' + formattedPhone.substring(2)
    } else if (formattedPhone.startsWith('47')) {
      formattedPhone = '+' + formattedPhone
    } else {
      formattedPhone = '+47' + formattedPhone
    }
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: body,
        }),
      }
    )

    const data = await response.json()

    if (response.ok) {
      return { success: true, sid: data.sid }
    } else {
      return { success: false, error: data.message || 'Twilio API error' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
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

  // Check if Twilio is configured
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return new Response(JSON.stringify({
      error: 'Twilio not configured',
      message: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER secrets'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  // Parse request body
  let maxSms = 10
  try {
    const body = await req.json()
    if (body.max_sms) maxSms = Math.min(body.max_sms, 50)
  } catch {
    // Use defaults
  }

  // Fetch pending SMS
  const { data: messages, error: fetchError } = await supabase
    .from('sms_queue')
    .select('id, user_id, phone_number, message, sms_type')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(maxSms)

  if (fetchError) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch SMS queue',
      details: fetchError.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({
      message: 'No pending SMS',
      sent: 0,
      failed: 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Mark as sending
  const smsIds = messages.map(m => m.id)
  await supabase
    .from('sms_queue')
    .update({ status: 'sending' })
    .in('id', smsIds)

  // Send SMS
  let sent = 0
  let failed = 0

  for (const sms of messages) {
    const result = await sendSMS(sms.phone_number, sms.message)

    await supabase
      .from('sms_queue')
      .update({
        status: result.success ? 'sent' : 'failed',
        sent_at: result.success ? new Date().toISOString() : null,
        twilio_sid: result.sid || null,
        error_message: result.error || null,
      })
      .eq('id', sms.id)

    if (result.success) {
      sent++
      console.log(`✓ SMS sent to ${sms.phone_number}`)
    } else {
      failed++
      console.error(`✗ SMS failed to ${sms.phone_number}: ${result.error}`)
    }

    // Small delay between SMS
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return new Response(
    JSON.stringify({
      message: `Processed ${messages.length} SMS`,
      sent,
      failed,
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
