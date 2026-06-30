import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const getEnv = (key: string): string | undefined => {
  const denoEnv = (globalThis as any).Deno?.env
  if (denoEnv?.get) {
    return denoEnv.get(key)
  }
  return typeof process !== 'undefined' ? process.env[key] : undefined
}

const SMTP_CONFIG = {
  hostname: getEnv('BREVO_SMTP_HOST') || 'smtp-relay.brevo.com',
  port: Number(getEnv('BREVO_SMTP_PORT')) || 587,
  username: getEnv('BREVO_SMTP_USER') || '',
  password: getEnv('BREVO_SMTP_PASSWORD') || '',
  fromEmail: getEnv('BREVO_FROM_EMAIL') || 'noreply@aipatechenergy.com',
  fromName: getEnv('BREVO_FROM_NAME') || 'AIPATECH Energy',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { to, subject, html, from, fromName, replyTo } = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: to, subject, html' 
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    console.log('Sending email to:', to)
    console.log('Subject:', subject)

    const client = new SmtpClient()

    // Connect to Brevo SMTP
    await client.connectTLS({
      hostname: SMTP_CONFIG.hostname,
      port: SMTP_CONFIG.port,
      username: SMTP_CONFIG.username,
      password: SMTP_CONFIG.password,
    })

    // Send email
    const result = await client.send({
      from: `${fromName || SMTP_CONFIG.fromName} <${from || SMTP_CONFIG.fromEmail}>`,
      to: to,
      subject: subject,
      content: html,
      html: true,
    })

    await client.close()

    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: result 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check SMTP configuration in Supabase secrets'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})