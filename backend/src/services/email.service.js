import { Resend } from 'resend';
import config from '../config/index.js';

class EmailService {
    constructor() {
        if (config.resend?.apiKey) {
            this.resend = new Resend(config.resend.apiKey);
            // Use Resend onboarding domain if using Gmail
            const configuredEmail = config.resend.fromEmail;
            const isPublicDomain = configuredEmail?.includes('gmail.com') || configuredEmail?.includes('yahoo.com') || configuredEmail?.includes('hotmail.com');

            this.fromEmail = (!configuredEmail || isPublicDomain)
                ? 'InsightAI <onboarding@resend.dev>'
                : configuredEmail;

            if (isPublicDomain) {
                console.warn(`[EmailService] Using onboarding domain for public email.`);
            }
        } else {
            console.warn('Resend key missing. Emails will be logged locally.');
        }
    }

    async sendEmail({ to, subject, html, text }) {
        if (!this.resend) {
            console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
            return { success: true, id: 'mock-id' };
        }

        try {
            const response = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>?/gm, ''),
            });

            if (response.error) {
                console.error('Resend API Error:', response.error);
                throw new Error(response.error.message || 'Failed to send email via Resend');
            }

            return { success: true, ...response };
        } catch (error) {
            console.error('Email Service Error:', error);
            throw error;
        }
    }

    async sendInvitationEmail(toEmail, inviterName, orgName, invitationLink) {
        const subject = `${inviterName} invited you to join ${orgName} on InsightAI`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to Join ${orgName}</title>
    <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #18181b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #000000; padding: 32px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .content { padding: 40px 32px; }
        .h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #18181b; }
        .text { font-size: 16px; line-height: 24px; color: #52525b; margin-bottom: 24px; }
        .button { display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; }
        .footer { padding: 32px; background-color: #fafafa; text-align: center; font-size: 14px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
        .badge { display: inline-block; background-color: #f4f4f5; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; color: #52525b; margin-top: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <span style="font-size: 24px;">✨</span> InsightAI
            </div>
        </div>
        <div class="content">
            <h1 class="h1">You've been invited!</h1>
            <p class="text">
                <strong>${inviterName}</strong> has invited you to join the <strong>${orgName}</strong> organization on InsightAI.
            </p>
            <p class="text">
                Collaboration is better together. Join your team to start sharing documents, knowledge, and AI insights.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${invitationLink}" class="button" style="color: #ffffff;">Accept Invitation</a>
            </div>
            <p class="text" style="font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <a href="${invitationLink}" style="color: #0d9488; word-break: break-all;">${invitationLink}</a>
            </p>
            <div style="text-align: center;">
                <span class="badge">Expires in 7 days</span>
            </div>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} InsightAI. All rights reserved.<br>
            If you didn't expect this invitation, you can safely ignore this email.
        </div>
    </div>
</body>
</html>
        `;

        return this.sendEmail({ to: toEmail, subject, html });
    }
}

export const emailService = new EmailService();
