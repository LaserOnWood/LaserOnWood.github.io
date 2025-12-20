/**
 * Module de gestion des modales pour l'application de gestion des préférences Kink
 */
import { escapeHtml } from './utils.js';

export class ModalManager {
    /**
     * Affiche une modale pour demander un pseudo avant la génération d'image
     * @param {Function} onConfirm - Callback appelé avec le pseudo (ou null si vide)
     * @returns {Promise<void>}
     */
    static showPseudoModal(onConfirm) {
        return new Promise((resolve) => {
            // Créer la modale
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = 'pseudoModal';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('aria-labelledby', 'pseudoModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            modal.setAttribute('data-bs-backdrop', 'static');
            modal.setAttribute('data-bs-keyboard', 'false');

            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="pseudoModalLabel">
                                <i class="fas fa-user-circle"></i> Personnaliser votre image
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-muted mb-3">
                                <i class="fas fa-info-circle"></i> 
                                Entrez un pseudo pour personnaliser le titre de votre image. 
                                <br><small>Laissez vide pour garder le titre par défaut.</small>
                            </p>
                            <div class="mb-3">
                                <label for="pseudoInput" class="form-label">
                                    <i class="fas fa-tag"></i> Votre pseudo (optionnel)
                                </label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    id="pseudoInput" 
                                    placeholder="Ex: MonPseudo"
                                    maxlength="30"
                                    autocomplete="off"
                                >
                                <small class="form-text text-muted">
                                    Maximum 30 caractères
                                </small>
                            </div>
                            <div class="alert alert-info mb-0">
                                <small>
                                    <strong>Aperçu du titre :</strong><br>
                                    <span id="titlePreview">Ma liste de Kink</span>
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i> Annuler
                            </button>
                            <button type="button" class="btn btn-primary" id="confirmPseudoBtn">
                                <i class="fas fa-check"></i> Générer l'image
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const pseudoInput = document.getElementById('pseudoInput');
            const titlePreview = document.getElementById('titlePreview');
            const confirmBtn = document.getElementById('confirmPseudoBtn');

            // Mise à jour de l'aperçu en temps réel
            pseudoInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value) {
                    titlePreview.textContent = `La liste de Kink de ${value}`;
                } else {
                    titlePreview.textContent = 'Ma liste de Kink';
                }
            });

            // Focus automatique sur l'input
            modal.addEventListener('shown.bs.modal', () => {
                pseudoInput.focus();
            });

            // Permettre de valider avec Entrée
            pseudoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmBtn.click();
                }
            });

            // Gestion de la confirmation
            confirmBtn.addEventListener('click', () => {
                const pseudo = pseudoInput.value.trim() || null;
                onConfirm(pseudo);
                
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
            });

            // Nettoyage après fermeture
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve();
            });

            // Afficher la modale
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        });
    }
}