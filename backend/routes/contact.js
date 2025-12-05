// backend/routes/contact.js
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

/**
 * POST /api/contact
 * Envoie un message de contact par email
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation des champs
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                error: 'Tous les champs sont requis'
            });
        }

        // Validation basique de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Adresse email invalide'
            });
        }

        // Envoyer l'email
        await emailService.sendContactEmail(name, email, subject, message);

        res.json({
            success: true,
            message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message de contact:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.'
        });
    }
});

module.exports = router;
