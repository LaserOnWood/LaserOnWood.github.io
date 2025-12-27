/**
 * Module de partage sécurisé et chiffré pour l'application KinkList
 * Génère des liens temporaires avec chiffrement côté client
 */
import { ToastManager } from './toast-manager.js';

export class SecureShareManager {
    constructor(preferencesManager, kinkData) {
        this.preferencesManager = preferencesManager;
        this.kinkData = kinkData;
        this.shareEndpoint = 'https://kinklist.azarothis.fr/api/share'; // À adapter
        this.localShares = new Map(); // Pour simulation locale si pas d'API
    }

    /**
     * Génère un lien de partage sécurisé
     * @param {number} duration - Durée en heures (défaut: 24h)
     * @param {boolean} requirePassword - Nécessite un mot de passe
     * @returns {Promise<Object>}
     */
    async generateShareLink(duration = 24, requirePassword = false) {
        try {
            // Récupérer les préférences
            const preferences = this.preferencesManager.getAllPreferences();
            
            if (preferences.size === 0) {
                throw new Error('Aucune préférence à partager');
            }

            // Générer un mot de passe si nécessaire
            const password = requirePassword ? this.generatePassword() : null;

            // Préparer les données
            const shareData = {
                preferences: Object.fromEntries(preferences),
                timestamp: Date.now(),
                expiresAt: Date.now() + (duration * 3600000)
            };

            // Chiffrer les données
            const encryptedData = await this.encryptData(shareData, password);

            // Générer un ID unique
            const shareId = this.generateShareId();

            // Créer le lien de partage
            const shareInfo = {
                id: shareId,
                encryptedData: encryptedData,
                expiresAt: shareData.expiresAt,
                createdAt: Date.now(),
                duration: duration,
                hasPassword: requirePassword,
                password: password
            };

            // Sauvegarder (localement pour simulation, ou via API)
            await this.saveShare(shareInfo);

            // Générer l'URL
            const shareUrl = this.buildShareUrl(shareId, password);

            console.log('✅ Lien de partage généré:', shareId);

            return {
                success: true,
                shareId: shareId,
                shareUrl: shareUrl,
                password: password,
                expiresAt: new Date(shareData.expiresAt),
                duration: duration
            };

        } catch (error) {
            console.error('❌ Erreur lors de la génération du lien:', error);
            throw error;
        }
    }

    /**
     * Chiffre les données avec Web Crypto API
     * @param {Object} data - Données à chiffrer
     * @param {string} password - Mot de passe (optionnel)
     * @returns {Promise<string>}
     */
    async encryptData(data, password = null) {
        try {
            const dataString = JSON.stringify(data);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(dataString);

            // Utiliser le mot de passe fourni ou en générer un
            const key = password || this.generatePassword();

            // Dériver une clé de chiffrement
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                encoder.encode(key),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            // Salt aléatoire
            const salt = window.crypto.getRandomValues(new Uint8Array(16));

            // Dériver la clé AES
            const aesKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt']
            );

            // IV aléatoire
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Chiffrer
            const encryptedData = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                aesKey,
                dataBuffer
            );

            // Combiner salt + iv + données chiffrées
            const resultBuffer = new Uint8Array(
                salt.length + iv.length + encryptedData.byteLength
            );
            resultBuffer.set(salt, 0);
            resultBuffer.set(iv, salt.length);
            resultBuffer.set(new Uint8Array(encryptedData), salt.length + iv.length);

            // Convertir en base64
            return this.arrayBufferToBase64(resultBuffer);

        } catch (error) {
            console.error('Erreur de chiffrement:', error);
            throw new Error('Impossible de chiffrer les données');
        }
    }

    /**
     * Déchiffre les données
     * @param {string} encryptedBase64 - Données chiffrées en base64
     * @param {string} password - Mot de passe
     * @returns {Promise<Object>}
     */
    async decryptData(encryptedBase64, password) {
        try {
            // Convertir base64 en ArrayBuffer
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedBase64);
            const encryptedArray = new Uint8Array(encryptedBuffer);

            // Extraire salt, iv et données
            const salt = encryptedArray.slice(0, 16);
            const iv = encryptedArray.slice(16, 28);
            const data = encryptedArray.slice(28);

            const encoder = new TextEncoder();

            // Dériver la clé de déchiffrement
            const keyMaterial = await window.crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            const aesKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );

            // Déchiffrer
            const decryptedData = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                aesKey,
                data
            );

            // Convertir en string et parser JSON
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(decryptedData);
            return JSON.parse(jsonString);

        } catch (error) {
            console.error('Erreur de déchiffrement:', error);
            throw new Error('Mot de passe incorrect ou données corrompues');
        }
    }

    /**
     * Génère un ID de partage unique
     * @returns {string}
     */
    generateShareId() {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Génère un mot de passe aléatoire
     * @param {number} length - Longueur du mot de passe
     * @returns {string}
     */
    generatePassword(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => chars[byte % chars.length]).join('');
    }

    /**
     * Construit l'URL de partage
     * @param {string} shareId - ID du partage
     * @param {string} password - Mot de passe (optionnel)
     * @returns {string}
     */
    buildShareUrl(shareId, password = null) {
        const baseUrl = window.location.origin + window.location.pathname;
        let url = `${baseUrl}?share=${shareId}`;
        
        if (password) {
            // Encoder le mot de passe dans l'URL (fragment, pas query)
            url += `#key=${encodeURIComponent(password)}`;
        }
        
        return url;
    }

    /**
     * Sauvegarde le partage (simulation locale)
     * @param {Object} shareInfo - Informations du partage
     * @returns {Promise<boolean>}
     */
    async saveShare(shareInfo) {
        // Version locale (simulation)
        this.localShares.set(shareInfo.id, shareInfo);
        
        // Sauvegarder dans localStorage pour persistance
        const shares = JSON.parse(localStorage.getItem('kinkv2_shares') || '{}');
        shares[shareInfo.id] = shareInfo;
        localStorage.setItem('kinkv2_shares', JSON.stringify(shares));

        // TODO: Implémenter l'appel API si backend disponible
        /*
        const response = await fetch(this.shareEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shareInfo)
        });
        return response.ok;
        */

        return true;
    }

    /**
     * Charge un partage
     * @param {string} shareId - ID du partage
     * @returns {Promise<Object|null>}
     */
    async loadShare(shareId) {
        // Version locale
        const shares = JSON.parse(localStorage.getItem('kinkv2_shares') || '{}');
        const shareInfo = shares[shareId];

        if (!shareInfo) {
            return null;
        }

        // Vérifier l'expiration
        if (Date.now() > shareInfo.expiresAt) {
            console.log('⚠️ Partage expiré');
            await this.deleteShare(shareId);
            return null;
        }

        return shareInfo;

        // TODO: Implémenter l'appel API si backend disponible
        /*
        const response = await fetch(`${this.shareEndpoint}/${shareId}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
        */
    }

    /**
     * Supprime un partage
     * @param {string} shareId - ID du partage
     * @returns {Promise<boolean>}
     */
    async deleteShare(shareId) {
        const shares = JSON.parse(localStorage.getItem('kinkv2_shares') || '{}');
        delete shares[shareId];
        localStorage.setItem('kinkv2_shares', JSON.stringify(shares));
        
        this.localShares.delete(shareId);
        return true;
    }

    /**
     * Nettoie les partages expirés
     * @returns {Promise<number>} Nombre de partages supprimés
     */
    async cleanExpiredShares() {
        const shares = JSON.parse(localStorage.getItem('kinkv2_shares') || '{}');
        let count = 0;
        const now = Date.now();

        for (const [id, share] of Object.entries(shares)) {
            if (now > share.expiresAt) {
                delete shares[id];
                this.localShares.delete(id);
                count++;
            }
        }

        if (count > 0) {
            localStorage.setItem('kinkv2_shares', JSON.stringify(shares));
            console.log(`🧹 ${count} partages expirés nettoyés`);
        }

        return count;
    }

    /**
     * Affiche la modale de partage
     */
    async showShareModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'shareModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-share-alt"></i> Partager mes préférences
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-lock"></i> 
                            <strong>Partage sécurisé</strong><br>
                            Vos préférences seront chiffrées et le lien expirera automatiquement.
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Durée de validité</label>
                            <select class="form-select" id="shareDuration">
                                <option value="1">1 heure</option>
                                <option value="6">6 heures</option>
                                <option value="24" selected>24 heures (recommandé)</option>
                                <option value="72">3 jours</option>
                                <option value="168">1 semaine</option>
                            </select>
                        </div>

                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="requirePassword">
                            <label class="form-check-label" for="requirePassword">
                                Protéger par mot de passe
                            </label>
                        </div>

                        <div id="shareResult" class="d-none">
                            <div class="alert alert-success">
                                <i class="fas fa-check-circle"></i> Lien généré avec succès !
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Lien de partage</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="shareUrl" readonly>
                                    <button class="btn btn-outline-primary" id="copyUrlBtn">
                                        <i class="fas fa-copy"></i> Copier
                                    </button>
                                </div>
                                <small class="text-muted">
                                    Expire le : <span id="expiryDate"></span>
                                </small>
                            </div>

                            <div id="passwordDisplay" class="d-none">
                                <div class="alert alert-warning">
                                    <strong><i class="fas fa-key"></i> Mot de passe :</strong>
                                    <div class="d-flex align-items-center gap-2 mt-2">
                                        <code class="flex-grow-1" id="sharePassword"></code>
                                        <button class="btn btn-sm btn-warning" id="copyPasswordBtn">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                    <small class="d-block mt-2">
                                        ⚠️ Partagez ce mot de passe séparément du lien !
                                    </small>
                                </div>
                            </div>

                            <div class="d-flex gap-2">
                                <button class="btn btn-success" id="shareViaEmailBtn">
                                    <i class="fas fa-envelope"></i> Partager par email
                                </button>
                                <button class="btn btn-info" id="shareQRBtn">
                                    <i class="fas fa-qrcode"></i> QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        <button type="button" class="btn btn-primary" id="generateShareBtn">
                            <i class="fas fa-link"></i> Générer le lien
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('generateShareBtn').addEventListener('click', async () => {
            const duration = parseInt(document.getElementById('shareDuration').value);
            const requirePassword = document.getElementById('requirePassword').checked;

            try {
                const btn = document.getElementById('generateShareBtn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';

                const result = await this.generateShareLink(duration, requirePassword);

                // Afficher les résultats
                document.getElementById('shareResult').classList.remove('d-none');
                document.getElementById('shareUrl').value = result.shareUrl;
                document.getElementById('expiryDate').textContent = 
                    result.expiresAt.toLocaleString('fr-FR');

                if (result.password) {
                    document.getElementById('passwordDisplay').classList.remove('d-none');
                    document.getElementById('sharePassword').textContent = result.password;
                }

                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-check"></i> Généré';

            } catch (error) {
                ToastManager.showToast('Erreur lors de la génération du lien', 'danger');
            }
        });

        // Copier l'URL
        document.getElementById('copyUrlBtn').addEventListener('click', () => {
            const url = document.getElementById('shareUrl').value;
            navigator.clipboard.writeText(url);
            ToastManager.showToast('Lien copié !', 'success');
        });

        // Copier le mot de passe
        const copyPasswordBtn = document.getElementById('copyPasswordBtn');
        if (copyPasswordBtn) {
            copyPasswordBtn.addEventListener('click', () => {
                const password = document.getElementById('sharePassword').textContent;
                navigator.clipboard.writeText(password);
                ToastManager.showToast('Mot de passe copié !', 'success');
            });
        }

        // Partager par email
        document.getElementById('shareViaEmailBtn').addEventListener('click', () => {
            const url = document.getElementById('shareUrl').value;
            const subject = encodeURIComponent('Partage de préférences KinkList');
            const body = encodeURIComponent(`Voici le lien pour voir mes préférences :\n\n${url}\n\nCe lien est temporaire et sécurisé.`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        });

        // Nettoyage
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        // Afficher la modale
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Charge les préférences depuis un lien partagé
     * @param {string} shareId - ID du partage
     * @param {string} password - Mot de passe (optionnel)
     * @returns {Promise<Object|null>}
     */
    async loadFromShare(shareId, password = null) {
        try {
            // Charger le partage
            const shareInfo = await this.loadShare(shareId);

            if (!shareInfo) {
                throw new Error('Partage introuvable ou expiré');
            }

            // Déchiffrer
            const decryptedData = await this.decryptData(
                shareInfo.encryptedData,
                password || shareInfo.password
            );

            console.log('✅ Partage chargé avec succès');
            return decryptedData;

        } catch (error) {
            console.error('❌ Erreur lors du chargement du partage:', error);
            throw error;
        }
    }

    /**
     * Utilitaires de conversion
     */
    arrayBufferToBase64(buffer) {
        const binary = String.fromCharCode(...new Uint8Array(buffer));
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}