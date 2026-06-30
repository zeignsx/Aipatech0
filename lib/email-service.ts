import { supabase } from "@/integrations/supabase/client";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export class EmailService {
  private static instance: EmailService;
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Use the Supabase Edge Function for sending emails
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: options.to,
          subject: options.subject,
          html: options.html,
          from: options.from || 'noreply@aipatechenergy.com',
          fromName: options.fromName || 'AIPATECH Energy',
          replyTo: options.replyTo || 'info@aipatechenergy.com',
        },
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Failed to send email' };
      }

      return { 
        success: true, 
        messageId: data.messageId 
      };
    } catch (error: any) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send bulk emails with rate limiting
  async sendBulkEmails(
    recipients: Array<{ email: string; data?: any }>,
    subject: string,
    htmlTemplate: (data: any) => string,
    options?: { from?: string; fromName?: string }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            const result = await this.sendEmail({
              to: recipient.email,
              subject,
              html: htmlTemplate(recipient.data || {}),
              from: options?.from,
              fromName: options?.fromName,
            });
            
            if (result.success) {
              results.success++;
            } else {
              results.failed++;
              results.errors.push(`Failed to send to ${recipient.email}: ${result.error}`);
            }
          } catch (error: any) {
            results.failed++;
            results.errors.push(`Error sending to ${recipient.email}: ${error.message}`);
          }
        })
      );
      
      // Add delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}