// Supabase Edge Function for sending emails from the queue
// Supports SMTP (cPanel/webhotell) - no external service needed!

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

// Environment variables - sett disse i Supabase Dashboard
const SMTP_HOST = Deno.env.get('SMTP_HOST') // f.eks. mail.dittdomene.no
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '465')
const SMTP_USER = Deno.env.get('SMTP_USER') // f.eks. noreply@samiske.no
const SMTP_PASS = Deno.env.get('SMTP_PASS') // passordet til e-postkontoen
const SMTP_FROM = Deno.env.get('SMTP_FROM') || 'samiske.no <noreply@samiske.no>'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface EmailQueueItem {
  id: string
  recipient_email: string
  recipient_name: string | null
  subject: string
  body_html: string
  body_text: string | null
  email_type: string
}

// Send email via SMTP (cPanel)
async function sendEmailSMTP(email: EmailQueueItem): Promise<{ success: boolean; error?: string }> {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return { success: false, error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS' }
  }

  try {
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true, // SSL/TLS - standard for port 465
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    })

    await client.send({
      from: SMTP_FROM,
      to: email.recipient_email,
      subject: email.subject,
      content: email.body_text || '',
      html: email.body_html,
    })

    await client.close()

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMTP error',
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

  // Only allow POST requests
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

  // Initialize Supabase client with service role
  const supabase = createClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!
  )

  // Parse request body for options
  let maxEmails = 10
  let emailType: string | null = null
  let generateDigest = false

  try {
    const body = await req.json()
    if (body.max_emails) maxEmails = Math.min(body.max_emails, 50)
    if (body.email_type) emailType = body.email_type
    if (body.generate_digest) generateDigest = body.generate_digest
  } catch {
    // Use defaults
  }

  // Generate digest emails if requested
  if (generateDigest) {
    const digestType = emailType === 'weekly_digest' ? 'weekly' : 'daily'
    const { data: digestCount, error: digestError } = await supabase.rpc(
      digestType === 'weekly' ? 'generate_weekly_digest' : 'generate_daily_digest'
    )

    if (digestError) {
      return new Response(JSON.stringify({
        error: 'Failed to generate digest',
        details: digestError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      message: `Generated ${digestCount} ${digestType} digest emails`,
      digest_count: digestCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fetch pending emails from queue
  let query = supabase
    .from('email_queue')
    .select('id, recipient_email, recipient_name, subject, body_html, body_text, email_type')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(maxEmails)

  if (emailType) {
    query = query.eq('email_type', emailType)
  }

  const { data: emails, error: fetchError } = await query

  if (fetchError) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch emails',
      details: fetchError.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!emails || emails.length === 0) {
    return new Response(JSON.stringify({
      message: 'No pending emails',
      sent: 0,
      failed: 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Mark emails as 'sending'
  const emailIds = emails.map(e => e.id)
  await supabase
    .from('email_queue')
    .update({ status: 'sending' })
    .in('id', emailIds)

  // Send emails
  let sent = 0
  let failed = 0
  const results: { id: string; success: boolean; error?: string }[] = []

  for (const email of emails) {
    const result = await sendEmailSMTP(email)

    // Update status in database
    await supabase.rpc('mark_email_sent', {
      email_id: email.id,
      success: result.success,
      error_msg: result.error || null,
    })

    if (result.success) {
      sent++
      console.log(`✓ Sent email to ${email.recipient_email}`)
    } else {
      failed++
      console.error(`✗ Failed to send to ${email.recipient_email}: ${result.error}`)
    }

    results.push({
      id: email.id,
      success: result.success,
      error: result.error,
    })

    // Small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return new Response(
    JSON.stringify({
      message: `Processed ${emails.length} emails`,
      sent,
      failed,
      results,
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
