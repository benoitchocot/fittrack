// backend/routes/users.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const emailService = require('../services/emailService');
const db = require('../db');
const auth = require('../middleware/auth');

// Stockage temporaire des tokens de suppression (en production, utiliser Redis ou DB)
const deletionTokens = new Map();

/**
 * POST /api/users/me/request-deletion
 * Demande de suppression de compte (envoie email à l'admin)
 */
router.post('/me/request-deletion', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Récupérer l'utilisateur depuis la base de données SQLite
        db.get("SELECT * FROM users WHERE id = ?", [userId], async (err, user) => {
            if (err) {
                console.error('Erreur DB:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la recherche de l\'utilisateur'
                });
            }

            if (!user) {
                return res.status(404).json({
                    error: 'Utilisateur non trouvé'
                });
            }

            try {
                // Générer un token unique pour la suppression
                const deletionToken = crypto.randomBytes(32).toString('hex');
                
                // Stocker le token avec expiration (24 heures)
                const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
                deletionTokens.set(`${userId}-${deletionToken}`, {
                    userId,
                    userEmail: user.email,
                    expiresAt
                });

                // URL de suppression (frontend)
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
                const deletionUrl = `${frontendUrl}/admin/delete-account/${userId}/${deletionToken}`;

                // Envoyer l'email à l'admin
                const userName = user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.firstName || user.email;
                
                await emailService.sendAccountDeletionEmail(
                    user.email,
                    userName,
                    deletionUrl
                );

                res.json({
                    success: true,
                    message: 'Demande de suppression envoyée à l\'administrateur. Vous recevrez une confirmation une fois que votre compte aura été supprimé.'
                });
            } catch (error) {
                console.error('Erreur lors de l\'envoi de l\'email:', error);
                res.status(500).json({
                    error: 'Erreur lors de l\'envoi de la demande de suppression.'
                });
            }
        });
    } catch (error) {
        console.error('Erreur lors de la demande de suppression:', error);
        res.status(500).json({
            error: 'Erreur lors de l\'envoi de la demande de suppression.'
        });
    }
});

/**
 * DELETE /api/users/delete/:userId/:token
 * Suppression effective du compte (appelé depuis l'email de l'admin)
 */
router.delete('/delete/:userId/:token', async (req, res) => {
    try {
        const { userId, token } = req.params;
        const tokenKey = `${userId}-${token}`;

        // Vérifier le token
        const tokenData = deletionTokens.get(tokenKey);
        if (!tokenData) {
            return res.status(404).json({
                error: 'Token de suppression invalide ou expiré'
            });
        }

        // Vérifier l'expiration
        if (Date.now() > tokenData.expiresAt) {
            deletionTokens.delete(tokenKey);
            return res.status(410).json({
                error: 'Token de suppression expiré'
            });
        }

        // Supprimer l'utilisateur de la base de données SQLite
        db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
            if (err) {
                console.error('Erreur lors de la suppression:', err);
                return res.status(500).json({
                    error: 'Erreur lors de la suppression du compte'
                });
            }

            // Supprimer le token
            deletionTokens.delete(tokenKey);

            console.log(`✓ Compte supprimé: ${tokenData.userEmail} (${userId})`);

            res.json({
                success: true,
                message: 'Compte supprimé avec succès'
            });
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        res.status(500).json({
            error: 'Erreur lors de la suppression du compte.'
        });
    }
});

/**
 * GET /api/users/delete/:userId/:token
 * Vérifier si le token de suppression est valide
 */
router.get('/delete/:userId/:token', async (req, res) => {
    try {
        const { userId, token } = req.params;
        const tokenKey = `${userId}-${token}`;

        // Vérifier le token
        const tokenData = deletionTokens.get(tokenKey);
        if (!tokenData) {
            return res.status(404).json({
                valid: false,
                error: 'Token invalide'
            });
        }

        // Vérifier l'expiration
        if (Date.now() > tokenData.expiresAt) {
            deletionTokens.delete(tokenKey);
            return res.status(410).json({
                valid: false,
                error: 'Token expiré'
            });
        }

        res.json({
            valid: true,
            userEmail: tokenData.userEmail
        });
    } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        res.status(500).json({
            valid: false,
            error: 'Erreur serveur'
        });
    }
});

module.exports = router;
