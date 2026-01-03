/**
 * Module de gestion de l'interface utilisateur pour la personnalisation
 * Génère les modales et contrôles pour ajouter/modifier des données personnalisées
 */

import { CustomDataManager } from './custom-data-manager.js';
import { ToastManager } from './core-utils.js';

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

        // Trouver le conteneur des boutons d'action
        const buttonContainer = document.querySelector('.text-center.mt-4 .d-flex.gap-3');
        if (!buttonContainer) return;

        const btn = document.createElement('button');
        btn.id = 'customizationBtn';
        btn.className = 'btn btn-outline-secondary';
        btn.innerHTML = '<i class="fas fa-cog"></i> Gérer les données personnalisées';
        btn.onclick = () => this.showManagementModal();
        
        buttonContainer.appendChild(btn);
    }

    /**
     * Affiche la modal de gestion des données personnalisées
     */
    showManagementModal() {
        const modalId = 'managementModal';
        let modal = document.getElementById(modalId);
        
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.setAttribute('tabindex', '-1');

        const stats = this.customDataManager.getStatistics();

        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-cog"></i> Gestion des données personnalisées
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info mb-4">
                            <i class="fas fa-info-circle"></i> 
                            <strong>Statistiques :</strong> ${stats.totalCustomCategories} catégorie(s) et ${stats.totalCustomItems} item(s) personnalisé(s)
                        </div>

                        <div class="d-grid gap-3">
                            <button class="btn btn-primary btn-lg" id="addCategoryBtn">
                                <i class="fas fa-plus-circle"></i> Ajouter une catégorie personnalisée
                            </button>

                            ${stats.totalCustomCategories > 0 ? `
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <strong>Catégories personnalisées existantes</strong>
                                    </div>
                                    <ul class="list-group list-group-flush">
                                        ${stats.categories.map(cat => `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <span>
                                                    <strong>${cat.name}</strong>
                                                    <small class="text-muted ms-2">(${cat.itemCount} items)</small>
                                                </span>
                                                <button class="btn btn-sm btn-outline-danger delete-category-btn" data-category-id="${cat.id}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}

                            <div class="accordion" id="advancedOptions">
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#importExportCollapse">
                                            <i class="fas fa-file-export me-2"></i> Import/Export des données personnalisées
                                        </button>
                                    </h2>
                                    <div id="importExportCollapse" class="accordion-collapse collapse" data-bs-parent="#advancedOptions">
                                        <div class="accordion-body">
                                            <div class="d-flex gap-2">
                                                <button class="btn btn-outline-primary flex-grow-1" id="exportCustomDataBtn">
                                                    <i class="fas fa-download"></i> Exporter
                                                </button>
                                                <button class="btn btn-outline-secondary flex-grow-1" id="importCustomDataBtn">
                                                    <i class="fas fa-upload"></i> Importer
                                                </button>
                                                <input type="file" id="importCustomDataFile" accept=".json" style="display: none;">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#dangerZoneCollapse">
                                            <i class="fas fa-exclamation-triangle me-2 text-danger"></i> Zone dangereuse
                                        </button>
                                    </h2>
                                    <div id="dangerZoneCollapse" class="accordion-collapse collapse" data-bs-parent="#advancedOptions">
                                        <div class="accordion-body">
                                            <button class="btn btn-danger w-100" id="clearAllCustomDataBtn">
                                                <i class="fas fa-trash"></i> Effacer toutes les données personnalisées
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            const bsModal = window.bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            this.showAddCategoryModal();
        });

        // Supprimer une catégorie
        modal.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.categoryId;
                if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
                    this.customDataManager.removeCategory(categoryId);
                    ToastManager.showToast('Catégorie supprimée', 'success');
                    const bsModal = window.bootstrap.Modal.getInstance(modal);
                    bsModal.hide();
                    setTimeout(() => window.location.reload(), 300);
                }
            });
        });

        // Export
        const exportBtn = document.getElementById('exportCustomDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = this.customDataManager.exportCustomData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `custom_data_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                ToastManager.showToast('Données exportées', 'success');
            });
        }

        // Import
        const importBtn = document.getElementById('importCustomDataBtn');
        const importFile = document.getElementById('importCustomDataFile');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    const success = this.customDataManager.importCustomData(text);
                    if (success) {
                        ToastManager.showToast('Données importées avec succès', 'success');
                        const bsModal = window.bootstrap.Modal.getInstance(modal);
                        bsModal.hide();
                        setTimeout(() => window.location.reload(), 300);
                    } else {
                        ToastManager.showToast('Erreur lors de l\'import', 'danger');
                    }
                } catch (error) {
                    ToastManager.showToast('Fichier invalide', 'danger');
                }
                importFile.value = '';
            });
        }

        // Clear all
        const clearBtn = document.getElementById('clearAllCustomDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('⚠️ ATTENTION : Cette action est irréversible !\n\nToutes vos catégories et items personnalisés seront définitivement supprimés.\n\nVoulez-vous continuer ?')) {
                    this.customDataManager.clearAllCustomData();
                    ToastManager.showToast('Toutes les données personnalisées ont été effacées', 'success');
                    const bsModal = window.bootstrap.Modal.getInstance(modal);
                    bsModal.hide();
                    setTimeout(() => window.location.reload(), 300);
                }
            });
        }

        const bsModal = new window.bootstrap.Modal(modal);
        bsModal.show();

        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    }
}
