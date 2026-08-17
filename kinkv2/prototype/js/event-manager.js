/**
 * Module de gestion des événements pour l'application de gestion des préférences Kink
 * Version complète avec historique, IndexedDB et partage
 */
import { CONFIG } from './config.js';
import { debounce } from './core-utils.js';

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
        this._boundOnFileChange = async (e) => {
            const imported = await this.importExportManager.importResults(e.target);
            if (imported) {
                this.preferencesManager.saveToLocalStorage();
                await this.forceSaveToIndexedDB();
            }
        };
        this._boundFlushPendingSave = this.flushPendingSave.bind(this);

        // Les compteurs mis en cache évitent un parcours complet du catalogue à chaque clic.
        this.debouncedUpdateInterface = debounce((categoryId) => {
            this.statsManager.updateStats();
            this.statsManager.updateCategoryCounter(categoryId);
        }, CONFIG.debounceDelay);

        // Debounced history save (pour grouper les modifications rapides)
        this.debouncedHistorySave = debounce((itemName) => {
            if (this.historyManager && !this.historyManager.isRestoring) {
                this.saveToHistory(`Modification: ${itemName}`);
            }
        }, 500);

        // L’écriture complète dans IndexedDB est regroupée, mais la copie locale
        // de secours est synchronisée immédiatement à chaque modification.
        this.debouncedSaveToIndexedDB = debounce(() => {
            this.forceSaveToIndexedDB().catch((error) => {
                console.error('Erreur de sauvegarde différée:', error);
            });
        }, CONFIG.indexedDbSaveDelay);
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

        window.addEventListener('pagehide', this._boundFlushPendingSave);
        document.addEventListener('visibilitychange', this._boundFlushPendingSave);

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

        window.removeEventListener('pagehide', this._boundFlushPendingSave);
        document.removeEventListener('visibilitychange', this._boundFlushPendingSave);
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
                this.shareManager.showShareModal().catch((error) => {
                    console.error('Erreur de chargement du partage:', error);
                });
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
            this.runImageGeneration(this.imageGenerators.byCategory);
            return;
        }

        // Gestion du bouton de génération d'image par préférence
        if (e.target.closest('#generateImageByPreferenceBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖼️ Clic détecté sur le bouton de génération d\'image par préférence');
            this.runImageGeneration(this.imageGenerators.byPreference);
            return;
        }

        // Ancien bouton unique (maintien de la compatibilité)
        if (e.target.closest('#generateImageBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖼️ Clic détecté sur l\'ancien bouton de génération d\'image');
            this.runImageGeneration(this.imageGenerators.byCategory);
            return;
        }

        // Gestion des clics sur les items dans la vue tableau
        const tableItemBtn = e.target.closest('.table-item-btn');
        if (tableItemBtn) {
            e.preventDefault();
            e.stopPropagation();
            const itemName = tableItemBtn.dataset.item;
            const itemElement = document.querySelector(this.getItemSelector(itemName));
            if (itemElement) {
                this.handleItemClick(itemElement);
            }
            return;
        }
    }

    runImageGeneration(generator) {
        if (!generator) return;
        generator.generatePreferencesImage().catch((error) => {
            console.error('Erreur de génération d’image:', error);
        });
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

        // Mise à jour de l'état visuel et des compteurs concernés.
        this.updateItemVisualState(item, newState);
        this.statsManager.applyPreferenceChange({
            categoryId: item.dataset.category,
            previousState: currentState,
            newState
        });
        this.debouncedUpdateInterface(item.dataset.category);

        // Sauvegarder dans l'historique (avec debounce pour grouper les clics rapides)
        this.debouncedHistorySave(itemName);

        // Copie de secours immédiate contre une fermeture ou mise en veille rapide.
        this.preferencesManager.saveToLocalStorage();

        // Sauvegarde durable regroupée dans IndexedDB.
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
        const allItemElements = document.querySelectorAll(this.getItemSelector(item.dataset.item));
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
     * Produit un sélecteur fiable pour les noms d’items personnalisés.
     * @param {string} itemName Nom affiché de l’item
     * @returns {string} Sélecteur CSS échappé
     */
    getItemSelector(itemName) {
        const escapedName = window.CSS?.escape
            ? window.CSS.escape(itemName)
            : String(itemName).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `[data-item="${escapedName}"]`;
    }

    /**
     * Vide immédiatement la sauvegarde regroupée avant une mise en arrière-plan.
     * localStorage assure une copie synchrone même si IndexedDB n’a plus le temps de finir.
     */
    flushPendingSave(event = null) {
        if (document.visibilityState && document.visibilityState !== 'hidden' && event?.type === 'visibilitychange') {
            return;
        }
        this.preferencesManager.saveToLocalStorage();
        this.forceSaveToIndexedDB().catch((error) => {
            console.warn('Sauvegarde IndexedDB interrompue, copie locale conservée.', error);
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
        this.flushPendingSave();
        this.removeExistingEventListeners();
    }
}
