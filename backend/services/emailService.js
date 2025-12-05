// backend/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        // Configuration SMTP depuis les variables d'environnement
        const emailConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        };

        // Créer le transporter seulement si les identifiants sont fournis
        if (emailConfig.auth.user && emailConfig.auth.pass) {
            this.transporter = nodemailer.createTransport(emailConfig);
            console.log('✓ Service email SMTP initialisé');
        } else {
            console.warn('⚠ Configuration SMTP manquante. Les emails ne seront pas envoyés.');
        }
    }

    async sendContactEmail(name, email, subject, message) {
        if (!this.transporter) {
            console.warn('Email non configuré. Message de contact non envoyé.');
            console.log(`Message de contact de ${name} (${email}): ${subject}`);
            return {
                success: false,
                message: 'Service email non configuré'
            };
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            console.error('ADMIN_EMAIL non défini dans .env');
            throw new Error('Adresse email administrateur non configurée');
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: adminEmail,
            replyTo: email,
            subject: `[FitTrack Contact] ${subject}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            line-height: 1.6; 
                            color: #333; 
                        }
                        .container { 
                            max-width: 600px; 
                            margin: 0 auto; 
                            padding: 20px; 
                        }
                        .header { 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white; 
                            padding: 20px; 
                            border-radius: 5px 5px 0 0; 
                        }
                        .content { 
                            background-color: #f9fafb; 
                            padding: 20px; 
                            border: 1px solid #e5e7eb; 
                        }
                        .message-box { 
                            background-color: white; 
                            padding: 15px; 
                            border-radius: 5px; 
                            margin: 10px 0; 
                            border-left: 4px solid #667eea; 
                        }
                        .footer { 
                            margin-top: 20px; 
                            padding-top: 20px; 
                            border-top: 1px solid #e5e7eb; 
                            font-size: 12px; 
                            color: #6b7280; 
                        }
                        .info { 
                            background-color: #eff6ff; 
                            padding: 10px; 
                            border-radius: 5px; 
                            margin: 10px 0; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>💪 Nouveau message de contact - FitTrack</h1>
                        </div>
                        <div class="content">
                            <p>Bonjour,</p>
                            <p>Vous avez reçu un nouveau message via le formulaire de contact de FitTrack.</p>
                            
                            <div class="info">
                                <h3 style="margin-top: 0;">Informations de l'expéditeur</h3>
                                <ul style="margin: 10px 0;">
                                    <li><strong>Nom:</strong> ${name}</li>
                                    <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
                                    <li><strong>Sujet:</strong> ${subject}</li>
                                </ul>
                            </div>
                            
                            <div class="message-box">
                                <h3 style="margin-top: 0;">Message:</h3>
                                <p>${message.replace(/\n/g, '<br>')}</p>
                            </div>
                            
                            <p style="margin-top: 20px;">
                                <small>💡 <strong>Astuce:</strong> Vous pouvez répondre directement à cet email 
                                pour contacter ${name}.</small>
                            </p>
                        </div>
                        <div class="footer">
                            <p>Cet email a été envoyé automatiquement par FitTrack.</p>
                            <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Nouveau message de contact - FitTrack

Expéditeur: ${name}
Email: ${email}
Sujet: ${subject}

Message:
${message}

---
Cet email a été envoyé automatiquement par FitTrack.
Date: ${new Date().toLocaleString('fr-FR')}
            `.trim(),
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✓ Email de contact envoyé à ${adminEmail} de la part de ${email}`);
            return {
                success: true,
                message: 'Email envoyé avec succès'
            };
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de contact:', error);
            throw error;
        }
    }

    async sendAccountDeletionEmail(userEmail, userName, deletionUrl) {
        if (!this.transporter) {
            console.warn('Email non configuré. Demande de suppression de compte non envoyée.');
            console.log(`Demande de suppression de compte pour ${userEmail}. URL: ${deletionUrl}`);
            return {
                success: false,
                message: 'Service email non configuré'
            };
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            console.error('ADMIN_EMAIL non défini dans .env');
            throw new Error('Adresse email administrateur non configurée');
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: adminEmail,
            subject: `[FitTrack] Demande de suppression de compte: ${userEmail}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            line-height: 1.6; 
                            color: #333; 
                        }
                        .container { 
                            max-width: 600px; 
                            margin: 0 auto; 
                            padding: 20px; 
                        }
                        .header { 
                            background-color: #ef4444;
                            color: white; 
                            padding: 20px; 
                            border-radius: 5px 5px 0 0; 
                        }
                        .content { 
                            background-color: #f9fafb; 
                            padding: 20px; 
                            border: 1px solid #e5e7eb; 
                        }
                        .warning { 
                            background-color: #fef2f2; 
                            padding: 15px; 
                            border-radius: 5px; 
                            margin: 10px 0; 
                            border-left: 4px solid #ef4444; 
                        }
                        .button { 
                            display: inline-block; 
                            padding: 12px 24px; 
                            background-color: #ef4444; 
                            color: white; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            margin: 10px 0; 
                        }
                        .footer { 
                            margin-top: 20px; 
                            padding-top: 20px; 
                            border-top: 1px solid #e5e7eb; 
                            font-size: 12px; 
                            color: #6b7280; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🗑️ Demande de suppression de compte - FitTrack</h1>
                        </div>
                        <div class="content">
                            <p>Bonjour,</p>
                            <p>Un utilisateur a demandé la suppression de son compte sur FitTrack.</p>
                            
                            <div class="warning">
                                <strong>⚠️ Attention:</strong> Cette action est irréversible et supprimera 
                                toutes les données associées au compte (séances, historique, modèles).
                            </div>
                            
                            <h3>Informations de l'utilisateur</h3>
                            <ul>
                                <li><strong>Email:</strong> ${userEmail}</li>
                                <li><strong>Nom:</strong> ${userName || 'Non renseigné'}</li>
                            </ul>
                            
                            <p style="margin: 30px 0;">
                                <a href="${deletionUrl}" class="button">Supprimer le compte</a>
                            </p>
                            
                            <p style="margin-top: 20px;">
                                <small>💡 <strong>Astuce:</strong> Si le lien ne fonctionne pas, copiez-collez 
                                cette URL dans votre navigateur:</small><br>
                                <code style="word-break: break-all; color: #6b7280; font-size: 12px;">${deletionUrl}</code>
                            </p>
                        </div>
                        <div class="footer">
                            <p>Cet email a été envoyé automatiquement par FitTrack.</p>
                            <p>Date: ${new Date().toLocaleString('fr-FR')}</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Demande de suppression de compte - FitTrack

Un utilisateur a demandé la suppression de son compte.

⚠️ ATTENTION: Cette action est irréversible et supprimera toutes les données associées.

Informations de l'utilisateur:
- Email: ${userEmail}
- Nom: ${userName || 'Non renseigné'}

URL de suppression:
${deletionUrl}

---
Cet email a été envoyé automatiquement par FitTrack.
Date: ${new Date().toLocaleString('fr-FR')}
            `.trim(),
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✓ Email de suppression de compte envoyé à ${adminEmail} pour ${userEmail}`);
            return {
                success: true,
                message: 'Email envoyé avec succès'
            };
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de suppression:', error);
            throw error;
        }
    }
}

// Export une instance unique (singleton)
module.exports = new EmailService();
