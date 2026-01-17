import { emailService } from '../services/email.service.js';
import config from '../config/index.js';

// Contact form routes
export default async function contactRoutes(fastify) {
    // Submit contact form
    fastify.post('/submit', async (request, reply) => {
        const { name, email, message, subject, type = 'general' } = request.body;

        // Validate required fields
        if (!name || !email || !message) {
            return reply.status(400).send({
                error: 'Name, email, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return reply.status(400).send({
                error: 'Please provide a valid email address'
            });
        }

        // Determine email subject based on type
        const typeLabels = {
            'demo': '📅 Demo Request',
            'sales': '💼 Sales Inquiry',
            'support': '🛠️ Support Request',
            'general': '📧 Contact Form',
            'enterprise': '🏢 Enterprise Inquiry'
        };
        const emailSubject = subject || `${typeLabels[type] || typeLabels.general} from ${name}`;

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #18181b; border-bottom: 2px solid #e4e4e7; padding-bottom: 10px;">
                    ${typeLabels[type] || 'Contact Form'} Submission
                </h2>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 10px; background: #f4f4f5; font-weight: bold; width: 120px;">Name</td>
                        <td style="padding: 10px; background: #fafafa;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f4f4f5; font-weight: bold;">Email</td>
                        <td style="padding: 10px; background: #fafafa;">
                            <a href="mailto:${email}">${email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; background: #f4f4f5; font-weight: bold;">Type</td>
                        <td style="padding: 10px; background: #fafafa;">${type}</td>
                    </tr>
                </table>
                
                <h3 style="color: #18181b;">Message:</h3>
                <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
                    ${message}
                </div>
                
                <p style="color: #71717a; font-size: 12px; margin-top: 30px;">
                    Sent from InsightAI Contact Form • ${new Date().toISOString()}
                </p>
            </div>
        `;

        try {
            // Send email via EmailService (using standard SMTP logic)
            // Note: We send TO ourselves (from config), with replyTo set to the user's email mechanism 
            // is dependent on the transport, but for simplicity we send an email TO the admin.
            
            // Note 2: Direct Reply-To support might require updating sendEmail method to accept it.
            // For now, we put the user's email in the body prominent.
            
            // Use the "from" address as the target for contact forms (sending to admin)
            await emailService.sendEmail({
                to: config.smtp.from || 'admin@example.com', 
                subject: emailSubject,
                html: htmlContent
            });

            console.log(`📧 Contact email sent: ${type} from ${email}`);

            return {
                success: true,
                message: 'Your message has been sent. We\'ll get back to you soon!'
            };
        } catch (error) {
            console.error('❌ Failed to send contact email:', error);
            // Don't leak internal errors to client, but 500 is appropriate
            return reply.status(500).send({
                error: 'Failed to send message. Please try again later.'
            });
        }
    });

    // Health check for contact service
    fastify.get('/status', async () => {
        return {
            service: 'contact',
            smtpConfigured: !!(config.smtp && config.smtp.host),
            fromEmail: config.smtp.from
        };
    });
}
