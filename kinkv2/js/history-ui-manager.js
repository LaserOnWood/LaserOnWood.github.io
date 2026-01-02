/**
 * Module de gestion de l'interface utilisateur pour l'historique
 * Gère les boutons, raccourcis clavier et modale d'historique
 */
import { ToastManager } from './core-utils.js';

export class HistoryUIManager {
    constructor(historyManager, preferencesManager, statsManager) {
        this.historyManager = historyManager;
        this.preferencesManager = preferencesManager;
        this.statsManager = statsManager;
        this.undoButton = null;
        this.redoButton = null;
        this.historyButton = null;
        
        // Lier les méthodes
        this._boundHandleKeyboard = this.handleKeyboardShortcuts.bind(this);
        this._boundUpdateUI = this.updateButtonStates.bind(this);
    }

    /**
     * Initialise l'interface utilisateur de l'historique
     */
    initialize() {
        this.createHistoryButtons();
        this.setupKeyboardShortcuts();
        this.setupHistoryListener();
        console.log('✅ Interface d\'historique initialisée');
    }

    /**
     * Crée les boutons d'historique dans l'interface
     */
    createHistoryButtons() {
        // Trouver le conteneur des boutons d'action
        const buttonContainer = document.querySelector('.d-flex.gap-3.justify-content-center.flex-wrap');
        
        if (!buttonContainer) {
            console.warn('⚠️ Conteneur de boutons non trouvé');
            return;
        }

        // Créer le groupe de boutons d'historique
        const historyGroup = document.createElement('div');
        historyGroup.className = 'btn-group';
        historyGroup.setAttribute('role', 'group');
        historyGroup.setAttribute('aria-label', 'Historique');

        // Bouton Undo
        this.undoButton = document.createElement('button');
        this.undoButton.className = 'btn btn-outline-secondary';
        this.undoButton.id = 'undoBtn';
        this.undoButton.innerHTML = '<i class="fas fa-undo"></i>';
        this.undoButton.title = 'Annuler (Ctrl+Z)';
        this.undoButton.disabled = true;
        this.undoButton.addEventListener('click', () => this.performUndo());

        // Bouton Redo
        this.redoButton = document.createElement('button');
        this.redoButton.className = 'btn btn-outline-secondary';
        this.redoButton.id = 'redoBtn';
        this.redoButton.innerHTML = '<i class="fas fa-redo"></i>';
        this.redoButton.title = 'Rétablir (Ctrl+Shift+Z)';
        this.redoButton.disabled = true;
        this.redoButton.addEventListener('click', () => this.performRedo());

        // Bouton d'historique complet
        this.historyButton = document.createElement('button');
        this.historyButton.className = 'btn btn-outline-info';
        this.historyButton.id = 'historyBtn';
        this.historyButton.innerHTML = '<i class="fas fa-history"></i>';
        this.historyButton.title = 'Voir l\'historique complet';
        this.historyButton.addEventListener('click', () => this.showHistoryModal());

        historyGroup.appendChild(this.undoButton);
        historyGroup.appendChild(this.redoButton);
        historyGroup.appendChild(this.historyButton);

        // Insérer au début du conteneur
        buttonContainer.insertBefore(historyGroup, buttonContainer.firstChild);
    }

    /**
     * Configure les raccourcis clavier
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this._boundHandleKeyboard);
    }

    /**
     * Gère les raccourcis clavier
     * @param {KeyboardEvent} e - Événement clavier
     */
    handleKeyboardShortcuts(e) {
        // Ctrl+Z pour Undo
        if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
            e.preventDefault();
            this.performUndo();
        }
        
        // Ctrl+Shift+Z ou Ctrl+Y pour Redo
        if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
            e.preventDefault();
            this.performRedo();
        }

        // Ctrl+H pour voir l'historique
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            this.showHistoryModal();
        }
    }

    /**
     * Configure l'écouteur pour mettre à jour l'UI
     */
    setupHistoryListener() {
        this.historyManager.addListener(this._boundUpdateUI);
    }

    /**
     * Met à jour l'état des boutons
     * @param {Object} info - Informations sur l'historique
     */
    updateButtonStates(info) {
        if (this.undoButton) {
            this.undoButton.disabled = !info.canUndo;
            this.undoButton.title = info.canUndo 
                ? `Annuler: ${info.previousAction} (Ctrl+Z)`
                : 'Annuler (Ctrl+Z)';
        }

        if (this.redoButton) {
            this.redoButton.disabled = !info.canRedo;
            this.redoButton.title = info.canRedo 
                ? `Rétablir: ${info.nextAction} (Ctrl+Shift+Z)`
                : 'Rétablir (Ctrl+Shift+Z)';
        }

        if (this.historyButton) {
            const badge = info.totalStates > 0 
                ? `<i class="fas fa-history"></i> <span class="badge bg-info">${info.totalStates}</span>`
                : '<i class="fas fa-history"></i>';
            this.historyButton.innerHTML = badge;
        }
    }

    /**
     * Effectue un undo
     */
    performUndo() {
        const previousState = this.historyManager.undo();
        
        if (previousState) {
            this.historyManager.setRestoring(true);
            this.applyState(previousState);
            this.historyManager.setRestoring(false);
            
            const info = this.historyManager.getHistoryInfo();
            ToastManager.showToast(`↶ Annulé: ${info.currentAction}`, 'info');
        }
    }

    /**
     * Effectue un redo
     */
    performRedo() {
        const nextState = this.historyManager.redo();
        
        if (nextState) {
            this.historyManager.setRestoring(true);
            this.applyState(nextState);
            this.historyManager.setRestoring(false);
            
            const info = this.historyManager.getHistoryInfo();
            ToastManager.showToast(`↷ Rétabli: ${info.currentAction}`, 'info');
        }
    }

    /**
     * Applique un état des préférences
     * @param {Map} state - État à appliquer
     */
    applyState(state) {
        // Réinitialiser toutes les préférences
        this.preferencesManager.resetAllPreferences();
        
        // Appliquer le nouvel état
        this.preferencesManager.applyImportedPreferences(state);
        
        // Mettre à jour l'interface
        this.updateAllItems(state);
        this.statsManager.updateInterface();
    }

    /**
     * Met à jour tous les items dans l'interface
     * @param {Map} preferences - Préférences à appliquer
     */
    updateAllItems(preferences) {
        const items = document.querySelectorAll('.item');
        const validStates = ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'];
        
        items.forEach(item => {
            const itemName = item.dataset.item;
            
            // Retirer toutes les classes d'état
            validStates.forEach(state => item.classList.remove(state));
            
            // Appliquer le nouvel état si présent
            if (itemName && preferences.has(itemName)) {
                const preference = preferences.get(itemName);
                if (preference !== 'none') {
                    item.classList.add(preference);
                }
            }
        });
    }

    /**
     * Affiche la modale d'historique complet
     */
    showHistoryModal() {
        const historyList = this.historyManager.getHistoryList();
        const stats = this.historyManager.getStatistics();
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'historyModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'historyModalLabel');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="historyModalLabel">
                            <i class="fas fa-history"></i> Historique des modifications
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                    </div>
                    <div class="modal-body">
                        ${this.generateHistoryContent(historyList, stats)}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" id="clearHistoryBtn">
                            <i class="fas fa-trash"></i> Effacer l'historique
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Gestionnaire pour effacer l'historique
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
                this.historyManager.clear();
                ToastManager.showToast('Historique effacé', 'success');
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
            }
        });

        // Gestionnaires pour les boutons de navigation
        modal.querySelectorAll('.goto-state-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetIndex = parseInt(e.currentTarget.dataset.index);
                const targetState = this.historyManager.goToState(targetIndex);
                
                if (targetState) {
                    this.historyManager.setRestoring(true);
                    this.applyState(targetState);
                    this.historyManager.setRestoring(false);
                    
                    ToastManager.showToast('État restauré', 'success');
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    bsModal.hide();
                }
            });
        });

        // Nettoyage après fermeture
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        // Afficher la modale
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Génère le contenu HTML de l'historique
     * @param {Array} historyList - Liste des états
     * @param {Object} stats - Statistiques
     * @returns {string}
     */
    generateHistoryContent(historyList, stats) {
        if (historyList.length === 0) {
            return `
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle"></i> 
                    Aucun historique disponible. Commencez à modifier vos préférences pour construire votre historique.
                </div>
            `;
        }

        let html = `
            <div class="alert alert-secondary mb-3">
                <h6 class="mb-2"><i class="fas fa-chart-bar"></i> Statistiques</h6>
                <small>
                    <strong>Actions totales:</strong> ${stats.totalActions}<br>
                    <strong>Moyenne d'items par état:</strong> ${stats.averageItemsPerState}<br>
                    <strong>Utilisation mémoire:</strong> ${stats.memoryUsage}<br>
                    <strong>Premier état:</strong> ${stats.oldestAction}<br>
                    <strong>Dernier état:</strong> ${stats.newestAction}
                </small>
            </div>

            <div class="list-group">
        `;

        // Inverser pour afficher du plus récent au plus ancien
        const reversedList = [...historyList].reverse();

        reversedList.forEach((state, reverseIndex) => {
            const actualIndex = historyList.length - 1 - reverseIndex;
            const isCurrent = state.isCurrent;
            const itemClass = isCurrent ? 'list-group-item-primary' : '';
            const badge = isCurrent ? '<span class="badge bg-primary">Actuel</span>' : '';
            const time = new Date(state.timestamp).toLocaleTimeString('fr-FR');
            
            html += `
                <div class="list-group-item ${itemClass}">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                <i class="fas fa-edit"></i> ${state.action}
                                ${badge}
                            </h6>
                            <small class="text-muted">
                                <i class="far fa-clock"></i> ${time} 
                                | <i class="fas fa-check-circle"></i> ${state.itemCount} préférences
                            </small>
                        </div>
                        <div>
                            ${!isCurrent ? `
                                <button class="btn btn-sm btn-outline-primary goto-state-btn" 
                                        data-index="${actualIndex}"
                                        title="Revenir à cet état">
                                    <i class="fas fa-undo"></i> Restaurer
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        return html;
    }

    /**
     * Nettoyage
     */
    cleanup() {
        document.removeEventListener('keydown', this._boundHandleKeyboard);
        this.historyManager.removeListener(this._boundUpdateUI);
    }
}