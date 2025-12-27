/**
 * Module de gestion des événements pour l'application de gestion des préférences Kink
 * Version complète avec historique, IndexedDB et partage
 */
import { CONFIG } from './config.js';
import { debounce } from './utils.js';

/**
 * Classe responsable de la gestion des événements
 */
export class EventManager {
    constructor(
        preferencesManager, 
        statsManager, 
        importExportManager, 
        imageGenerators, 
        kinkData, 
        historyManager = null,
        dbManager = null,
        shareManager = null
    ) {
        this.preferencesManager = preferencesManager;
        this.statsManager = statsManager;
        this.importExportManager = importExportManager;
        this.imageGenerators = imageGenerators;
        this.kinkData = kinkData;
        this.historyManager = historyManager;
        this.dbManager = dbManager;
        this.shareManager = shareManager;
        
        // Références liées pour add/removeEventListener
        this._boundHandleDocumentClick = this.handleDocumentClick.bind(this);
        this._boundOnFileChange = (e) => this.importExportManager.importResults(e.target);
        
        // Debounced update function
        this.debouncedUpdateInterface = debounce(() => {
            this.statsManager.updateInterface();
        }, CONFIG.debounceDelay);

        // Debounced history save (pour grouper les modifications rapides)
        this.debouncedHistorySave = debounce((itemName) => {
            if (this.historyManager && !this.historyManager.isRestoring) {
                this.saveToHistory(`Modification: ${itemName}`);
            }
        }, 500);

        // Debounced IndexedDB save
        this.debouncedSaveToIndexedDB = debounce(async () => {
            if (this.dbManager) {
                await this.preferencesManager.saveToIndexedDB(this.dbManager);
            }
        }, 1000);
    }

    /**
     * Initialisation des event listeners
     */
    initializeEventListeners() {
        // Supprimer d'abord tout listener existant
        this.removeExistingEventListeners();

        // Un seul écouteur global pour tous les clics
        document.addEventListener('click', this._boundHandleDocumentClick);

        // Un seul écouteur pour l'input file
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', this._boundOnFileChange);
        }

        console.log('🔗 Event listeners initialisés (une seule fois)');
    }

    /**
     * Suppression des event listeners existants
     */
    removeExistingEventListeners() {
        if (this._boundHandleDocumentClick) {
            document.removeEventListener('click', this._boundHandleDocumentClick);
        }

        const importFile = document.getElementById('importFile');
        if (importFile && this._boundOnFileChange) {
            importFile.removeEventListener('change', this._boundOnFileChange);
        }
    }

    /**
     * Gestionnaire des clics avec protection renforcée
     * @param {Event} e - Événement de clic
     */
    handleDocumentClick(e) {
        // Gestion des items de préférence
        const item = e.target.closest('.item');
        if (item) {
            e.preventDefault();
            e.stopPropagation();
            this.handleItemClick(item);
            return;
        }

        // Gestion du bouton export avec protection multiple
        if (e.target.closest('#exportBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔤 Clic détecté sur le bouton export');
            this.importExportManager.exportResults(this.kinkData.preferenceTypes);
            return;
        }

        // Gestion du bouton import
        if (e.target.closest('#importBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔥 Clic détecté sur le bouton import');
            const importFile = document.getElementById('importFile');
            if (importFile) {
                importFile.click();
            }
            return;
        }

        // Gestion du bouton de partage
        if (e.target.closest('#shareBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔗 Clic détecté sur le bouton partage');
            if (this.shareManager) {
                this.shareManager.showShareModal();
            }
            return;
        }

        // Gestion du bouton de questionnaire
        if (e.target.closest('#startQuizBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🧭 Clic détecté sur le bouton questionnaire');
            // Le quizManager est géré depuis app.js
            const event = new CustomEvent('startQuiz');
            document.dispatchEvent(event);
            return;
        }

        // Gestion du bouton de génération d'image par catégorie
        if (e.target.closest('#generateImageByCategoryBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖼️ Clic détecté sur le bouton de génération d\'image par catégorie');
            if (this.imageGenerators.byCategory) {
                this.imageGenerators.byCategory.generatePreferencesImage();
            }
            return;
        }

        // Gestion du bouton de génération d'image par préférence
        if (e.target.closest('#generateImageByPreferenceBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖼️ Clic détecté sur le bouton de génération d\'image par préférence');
            if (this.imageGenerators.byPreference) {
                this.imageGenerators.byPreference.generatePreferencesImage();
            }
            return;
        }

        // Ancien bouton unique (maintien de la compatibilité)
        if (e.target.closest('#generateImageBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖼️ Clic détecté sur l\'ancien bouton de génération d\'image');
            if (this.imageGenerators.byCategory) {
                this.imageGenerators.byCategory.generatePreferencesImage();
            }
            return;
        }

        // Gestion des clics sur les items dans la vue tableau
        const tableItemBtn = e.target.closest('.table-item-btn');
        if (tableItemBtn) {
            e.preventDefault();
            e.stopPropagation();
            const itemName = tableItemBtn.dataset.item;
            const itemElement = document.querySelector(`[data-item="${itemName}"]`);
            if (itemElement) {
                this.handleItemClick(itemElement);
            }
            return;
        }
    }

    /**
     * Gestion du clic sur un item
     * @param {HTMLElement} item - Élément item cliqué
     */
    handleItemClick(item) {
        const itemName = item.dataset.item;
        if (!itemName) return;

        const currentState = this.preferencesManager.getPreference(itemName);
        const newState = this.preferencesManager.getNextState(currentState);

        // Mise à jour de la préférence
        this.preferencesManager.setPreference(itemName, newState);

        // Mise à jour de l'état visuel
        this.updateItemVisualState(item, newState);

        // Mise à jour des stats avec debounce
        this.debouncedUpdateInterface();

        // Sauvegarder dans l'historique (avec debounce pour grouper les clics rapides)
        this.debouncedHistorySave(itemName);

        // Sauvegarder dans IndexedDB (avec debounce)
        this.debouncedSaveToIndexedDB();

        // Animation de feedback
        this.addFeedbackAnimation(item);
    }

    /**
     * Mise à jour de l'état visuel d'un item
     * @param {HTMLElement} item - Élément item
     * @param {string} newState - Nouvel état
     */
    updateItemVisualState(item, newState) {
        // Nettoyer toutes les classes d'état
        CONFIG.validImportStates.forEach(state => {
            item.classList.remove(state);
        });

        // Ajouter la nouvelle classe si nécessaire
        if (newState !== 'none') {
            item.classList.add(newState);
        }

        // Mettre à jour tous les éléments avec le même data-item (pour les vues multiples)
        const allItemElements = document.querySelectorAll(`[data-item="${item.dataset.item}"]`);
        allItemElements.forEach(el => {
            if (el !== item) {
                CONFIG.validImportStates.forEach(state => {
                    el.classList.remove(state);
                });
                if (newState !== 'none') {
                    el.classList.add(newState);
                }
            }
        });
    }

    /**
     * Ajoute une animation de feedback
     * @param {HTMLElement} item - Élément item
     */
    addFeedbackAnimation(item) {
        item.classList.add('state-changing');
        setTimeout(() => {
            item.classList.remove('state-changing');
        }, 400);
    }

    /**
     * Sauvegarde l'état actuel dans l'historique
     * @param {string} action - Description de l'action
     */
    saveToHistory(action) {
        if (this.historyManager && !this.historyManager.isRestoring) {
            const currentState = this.preferencesManager.getAllPreferences();
            this.historyManager.saveState(currentState, action);
        }
    }

    /**
     * Force une sauvegarde immédiate dans IndexedDB
     */
    async forceSaveToIndexedDB() {
        if (this.dbManager) {
            await this.preferencesManager.saveToIndexedDB(this.dbManager);
        }
    }

    /**
     * Nettoyage des event listeners
     */
    cleanup() {
        this.removeExistingEventListeners();
    }
}