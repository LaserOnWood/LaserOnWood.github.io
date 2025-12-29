/**
 * Module de gestion de l'interface utilisateur pour la personnalisation
 * Génère les modales et contrôles pour ajouter/modifier des données personnalisées
 */

import { CustomDataManager } from './custom-data-manager.js';
import { ToastManager } from './toast-manager.js';

export class CustomUIManager {
    constructor() {
        this.customDataManager = new CustomDataManager();
    }

    /**
     * Crée et affiche la modale pour ajouter une nouvelle catégorie
     */
    showAddCategoryModal() {
        const modalId = 'addCategoryModal';
        let modal = document.getElementById(modalId);
        
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-plus-circle"></i> Ajouter une catégorie personnalisée
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addCategoryForm">
                            <div class="mb-3">
                                <label for="categoryId" class="form-label">ID de la catégorie</label>
                                <input type="text" class="form-control" id="categoryId" required 
                                       placeholder="ex: mesPreferences">
                            </div>
                            <div class="mb-3">
                                <label for="categoryName" class="form-label">Nom de la catégorie</label>
                                <input type="text" class="form-control" id="categoryName" required 
                                       placeholder="ex: Mes Préférences">
                            </div>
                            <div class="mb-3">
                                <label for="categoryIcon" class="form-label">Icône Font Awesome</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="categoryIcon" required 
                                           placeholder="ex: fas fa-heart">
                                    <span class="input-group-text" id="iconPreview">
                                        <i class="fas fa-heart"></i>
                                    </span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="categoryDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="categoryDescription" rows="3" 
                                          placeholder="Description de la catégorie..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" id="saveCategoryBtn">
                            <i class="fas fa-save"></i> Ajouter la catégorie
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const iconInput = document.getElementById('categoryIcon');
        const iconPreview = document.getElementById('iconPreview');
        
        iconInput.addEventListener('input', (e) => {
            iconPreview.innerHTML = `<i class="${e.target.value}"></i>`;
        });

        document.getElementById('saveCategoryBtn').addEventListener('click', () => {
            const id = document.getElementById('categoryId').value.trim();
            const name = document.getElementById('categoryName').value.trim();
            const icon = document.getElementById('categoryIcon').value.trim();
            const description = document.getElementById('categoryDescription').value.trim();

            if (!id || !name || !icon) {
                ToastManager.showToast('Veuillez remplir tous les champs obligatoires', 'danger');
                return;
            }

            const success = this.customDataManager.addCategory({ id, name, icon, description });

            if (success) {
                ToastManager.showToast('Catégorie personnalisée ajoutée !', 'success');
                const bsModal = window.bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                setTimeout(() => window.location.reload(), 300);
            } else {
                ToastManager.showToast('Erreur lors de l\'ajout', 'danger');
            }
        });

        const bsModal = new window.bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Crée et affiche la modale pour ajouter un item personnalisé
     */
    showAddItemModal(categoryId, isCustomCategory = false) {
        const modalId = 'addItemModal';
        let modal = document.getElementById(modalId);
        
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-plus"></i> Ajouter un item personnalisé
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addItemForm">
                            <div class="mb-3">
                                <label for="itemName" class="form-label">Nom de l'item</label>
                                <input type="text" class="form-control" id="itemName" required 
                                       placeholder="ex: Mon préférence">
                            </div>
                            <div class="mb-3">
                                <label for="itemDescription" class="form-label">Description</label>
                                <textarea class="form-control" id="itemDescription" rows="3" 
                                          placeholder="Description de l'item..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" id="saveItemBtn">
                            <i class="fas fa-save"></i> Ajouter l'item
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('saveItemBtn').addEventListener('click', () => {
            const name = document.getElementById('itemName').value.trim();
            const description = document.getElementById('itemDescription').value.trim();

            if (!name) {
                ToastManager.showToast('Veuillez entrer un nom', 'danger');
                return;
            }

            let success;
            if (isCustomCategory) {
                success = this.customDataManager.addItemToCategory(categoryId, { name, description });
            } else {
                success = this.customDataManager.addItemToExistingCategory(categoryId, { name, description });
            }

            if (success) {
                ToastManager.showToast('Item personnalisé ajouté !', 'success');
                const bsModal = window.bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
                setTimeout(() => window.location.reload(), 300);
            } else {
                ToastManager.showToast('Erreur lors de l\'ajout', 'danger');
            }
        });

        const bsModal = new window.bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Ajoute le bouton de personnalisation à l'interface
     */
    addCustomizationButton() {
        if (document.getElementById('customizationBtn')) return;

        const container = document.querySelector('.stats');
        if (!container) return;

        const btn = document.createElement('button');
        btn.id = 'customizationBtn';
        btn.className = 'btn btn-sm btn-outline-primary mt-3 w-100';
        btn.innerHTML = '<i class="fas fa-cog"></i> Gérer les données personnalisées';
        btn.onclick = () => this.showAddCategoryModal();
        
        container.appendChild(btn);
    }
}
