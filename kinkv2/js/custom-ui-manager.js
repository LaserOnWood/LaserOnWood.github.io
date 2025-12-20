/**
 * Module de gestion de l'interface utilisateur pour la personnalisation
 * Génère les modales et contrôles pour ajouter/modifier des données personnalisées
 */

import { CustomDataManager } from './custom-data-manager.js';
import { ToastManager } from './toast-manager.js';

export class CustomUIManager {
    constructor() {
        this.customDataManager = new CustomDataManager();
        this.toastManager = ToastManager.getInstance();
    }

    /**
     * Crée et affiche la modale pour ajouter une nouvelle catégorie
     */
    showAddCategoryModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'addCategoryModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'addCategoryModalLabel');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addCategoryModalLabel">
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
                                <small class="form-text text-muted">Identifiant unique (sans espaces)</small>
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
                                <small class="form-text text-muted">
                                    <a href="https://fontawesome.com/icons" target="_blank">Voir les icônes disponibles</a>
                                </small>
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

        // Gestion de la mise à jour de l'icône
        const iconInput = document.getElementById('categoryIcon');
        const iconPreview = document.getElementById('iconPreview');
        
        iconInput.addEventListener('input', (e) => {
            try {
                iconPreview.innerHTML = `<i class="${e.target.value}"></i>`;
            } catch (error) {
                console.warn('Icône invalide');
            }
        });

        // Gestion du bouton de sauvegarde
        document.getElementById('saveCategoryBtn').addEventListener('click', () => {
            const id = document.getElementById('categoryId').value.trim();
            const name = document.getElementById('categoryName').value.trim();
            const icon = document.getElementById('categoryIcon').value.trim();
            const description = document.getElementById('categoryDescription').value.trim();

            if (!id || !name || !icon) {
                this.toastManager.show('Veuillez remplir tous les champs obligatoires', 'error');
                return;
            }

            if (id.includes(' ')) {
                this.toastManager.show('L\'ID ne doit pas contenir d\'espaces', 'error');
                return;
            }

            const success = this.customDataManager.addCategory({
                id,
                name,
                icon,
                description
            });

            if (success) {
                this.toastManager.show('Catégorie personnalisée ajoutée avec succès !', 'success');
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                modal.remove();
                window.location.reload(); // Recharger pour voir les changements
            } else {
                this.toastManager.show('Erreur lors de l\'ajout de la catégorie', 'error');
            }
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Crée et affiche la modale pour ajouter un item personnalisé
     * @param {string} categoryId - ID de la catégorie
     * @param {boolean} isCustomCategory - Si c'est une catégorie personnalisée
     */
    showAddItemModal(categoryId, isCustomCategory = false) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'addItemModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'addItemModalLabel');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addItemModalLabel">
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

        // Gestion du bouton de sauvegarde
        document.getElementById('saveItemBtn').addEventListener('click', () => {
            const name = document.getElementById('itemName').value.trim();
            const description = document.getElementById('itemDescription').value.trim();

            if (!name) {
                this.toastManager.show('Veuillez entrer un nom pour l\'item', 'error');
                return;
            }

            let success;
            if (isCustomCategory) {
                success = this.customDataManager.addItemToCategory(categoryId, {
                    name,
                    description
                });
            } else {
                success = this.customDataManager.addItemToExistingCategory(categoryId, {
                    name,
                    description
                });
            }

            if (success) {
                this.toastManager.show('Item personnalisé ajouté avec succès !', 'success');
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                modal.remove();
                window.location.reload(); // Recharger pour voir les changements
            } else {
                this.toastManager.show('Erreur lors de l\'ajout de l\'item', 'error');
            }
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Crée et affiche la modale de gestion des données personnalisées
     */
    showCustomDataManagementModal() {
        const stats = this.customDataManager.getStatistics();
        const customCategories = this.customDataManager.getCustomCategories();

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'customDataManagementModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'customDataManagementModalLabel');
        modal.setAttribute('aria-hidden', 'true');

        let categoriesHTML = '';
        if (customCategories.length === 0) {
            categoriesHTML = '<p class="text-muted text-center">Aucune donnée personnalisée pour le moment.</p>';
        } else {
            categoriesHTML = customCategories.map(cat => `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <i class="${cat.icon}"></i> <strong>${cat.name}</strong>
                            <small class="text-muted">(${cat.items.length} item${cat.items.length > 1 ? 's' : ''})</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-danger delete-category-btn" data-category-id="${cat.id}">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${cat.description || 'Pas de description'}</p>
                        <div class="list-group">
                            ${cat.items.map(item => `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${item.name}</strong>
                                        ${item.description ? `<br><small class="text-muted">${item.description}</small>` : ''}
                                    </div>
                                    <button type="button" class="btn btn-sm btn-warning delete-item-btn" 
                                            data-category-id="${cat.id}" data-item-name="${item.name}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="customDataManagementModalLabel">
                            <i class="fas fa-cog"></i> Gestion des données personnalisées
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info mb-4">
                            <strong>Statistiques :</strong><br>
                            Catégories personnalisées : <strong>${stats.totalCustomCategories}</strong><br>
                            Items personnalisés : <strong>${stats.totalCustomItems}</strong>
                        </div>

                        <div class="mb-4">
                            <h6>Vos données personnalisées :</h6>
                            ${categoriesHTML}
                        </div>

                        <div class="border-top pt-3">
                            <h6>Actions :</h6>
                            <div class="d-flex gap-2 flex-wrap">
                                <button type="button" class="btn btn-sm btn-primary" id="exportCustomDataBtn">
                                    <i class="fas fa-download"></i> Exporter les données
                                </button>
                                <button type="button" class="btn btn-sm btn-info" id="importCustomDataBtn">
                                    <i class="fas fa-upload"></i> Importer les données
                                </button>
                                <button type="button" class="btn btn-sm btn-danger" id="clearAllCustomDataBtn">
                                    <i class="fas fa-trash"></i> Tout effacer
                                </button>
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

        // Gestion des boutons de suppression de catégorie
        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.categoryId;
                if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
                    this.customDataManager.removeCategory(categoryId);
                    this.toastManager.show('Catégorie supprimée', 'success');
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    bsModal.hide();
                    modal.remove();
                    window.location.reload();
                }
            });
        });

        // Gestion des boutons de suppression d'item
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.categoryId;
                const itemName = e.currentTarget.dataset.itemName;
                if (confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) {
                    this.customDataManager.removeItem(categoryId, itemName);
                    this.toastManager.show('Item supprimé', 'success');
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    bsModal.hide();
                    modal.remove();
                    window.location.reload();
                }
            });
        });

        // Gestion de l'export
        document.getElementById('exportCustomDataBtn').addEventListener('click', () => {
            const data = this.customDataManager.exportCustomData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kinkv2-custom-data.json';
            a.click();
            URL.revokeObjectURL(url);
            this.toastManager.show('Données exportées', 'success');
        });

        // Gestion de l'import
        document.getElementById('importCustomDataBtn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const success = this.customDataManager.importCustomData(event.target.result);
                            if (success) {
                                this.toastManager.show('Données importées avec succès', 'success');
                                const bsModal = bootstrap.Modal.getInstance(modal);
                                bsModal.hide();
                                modal.remove();
                                window.location.reload();
                            } else {
                                this.toastManager.show('Erreur lors de l\'import', 'error');
                            }
                        } catch (error) {
                            this.toastManager.show('Fichier JSON invalide', 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            });
            input.click();
        });

        // Gestion de la suppression totale
        document.getElementById('clearAllCustomDataBtn').addEventListener('click', () => {
            if (confirm('Êtes-vous absolument sûr ? Cette action est irréversible.')) {
                this.customDataManager.clearAllCustomData();
                this.toastManager.show('Toutes les données personnalisées ont été supprimées', 'success');
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                modal.remove();
                window.location.reload();
            }
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Ajoute un bouton de personnalisation dans l'interface
     */
    addCustomizationButton() {
        // Chercher le conteneur des boutons d'action
        const buttonContainer = document.querySelector('.d-flex.gap-3.justify-content-center');
        
        if (buttonContainer) {
            const customBtn = document.createElement('button');
            customBtn.className = 'btn btn-outline-info';
            customBtn.innerHTML = '<i class="fas fa-star"></i> Personnaliser';
            customBtn.addEventListener('click', () => {
                this.showCustomizationMenu();
            });
            
            buttonContainer.appendChild(customBtn);
        }
    }

    /**
     * Affiche un menu de personnalisation
     */
    showCustomizationMenu() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'customizationMenuModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-star"></i> Menu de personnalisation
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        <div class="list-group">
                            <button type="button" class="list-group-item list-group-item-action" id="addCategoryMenuBtn">
                                <i class="fas fa-plus-circle"></i> Ajouter une catégorie
                                <small class="d-block text-muted">Créer une nouvelle catégorie personnalisée</small>
                            </button>
                            <button type="button" class="list-group-item list-group-item-action" id="manageDataMenuBtn">
                                <i class="fas fa-cog"></i> Gérer mes données
                                <small class="d-block text-muted">Voir, modifier ou supprimer vos données</small>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('addCategoryMenuBtn').addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            modal.remove();
            this.showAddCategoryModal();
        });

        document.getElementById('manageDataMenuBtn').addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            modal.remove();
            this.showCustomDataManagementModal();
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}
