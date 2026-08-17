import { DataLoader } from './data-loader.js';
import { UIGenerator } from './ui-generator.js';
import { PreferencesManager } from './preferences-manager.js';
import { StatsManager } from './stats-manager.js';
import { EventManager } from './event-manager.js';
import { ImportExportManager } from './import-export-manager.js';
import { LazyImageGenerator } from './lazy-image-generator.js';
import { ToastManager } from './core-utils.js';
import { CustomDataManager } from './custom-data-manager.js';
import { CustomUIManager } from './custom-ui-manager.js';
import { ModalManager } from './core-utils.js';
import { HistoryManager } from './history-manager.js';
import { HistoryUIManager } from './history-ui-manager.js';

// IMPORTS ESSENTIELS
import { IndexedDBManager } from './indexed-db-manager.js';
import { LazyShareManager, LazyQuizManager } from './lazy-feature-manager.js';
import { SearchManager } from './search-manager.js';

export class KinkPreferencesApp {
    constructor() {
        this.kinkData = null;
        this.isInitialized = false;
        this.enableLazyLoading = false;

        // Managers existants
        this.preferencesManager = new PreferencesManager();
        this.historyManager = new HistoryManager(50);
        this.customDataManager = new CustomDataManager();
        this.customUIManager = new CustomUIManager();

        // Managers à initialiser
        this.statsManager = null;
        this.eventManager = null;
        this.importExportManager = null;
        this.imageGeneratorByCategory = null;
        this.imageGeneratorByPreference = null;
        this.uiGenerator = null;
        this.historyUIManager = null;

        // MANAGERS ACTIFS
        this.dbManager = null;
        this.shareManager = null;
        this.quizManager = null;
        this.searchManager = null;
    }

    async init() {
        try {
            if (this.isInitialized) {
                console.warn('⚠️ Application déjà initialisée');
                return;
            }

            console.log('🚀 Début de l\'initialisation...');

            // Initialiser IndexedDB en premier
            this.dbManager = new IndexedDBManager();
            await this.dbManager.init();

            // Chargement des données
            await this.loadKinkData();

            // Charger les préférences depuis IndexedDB
            await this.preferencesManager.loadFromIndexedDB(this.dbManager);

            // Initialisation des managers
            this.initializeManagers();

            // Génération de l'interface
            this.generateInterface();

            // Initialisation des event listeners
            this.initializeEventListeners();

            // Mise à jour de l'interface
            this.updateInterface();

            // Sauvegarder l'état initial dans l'historique
            this.saveCurrentStateToHistory('État initial');

            // Vérifier les liens partagés
            await this.checkSharedLink();

            // Nettoyer le cache expiré
            await this.dbManager.cleanExpiredCache();

            this.isInitialized = true;
            console.log('✅ Initialisation terminée avec succès !');

            this.hideLoadingIndicator();

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.handleError('Erreur lors de l\'initialisation', error);
            throw error;
        }
    }

    async loadKinkData() {
        const originalData = await DataLoader.loadKinkData(this.dbManager);
        this.kinkData = this.customDataManager.mergeWithOriginalData(originalData);
    }

    initializeManagers() {
        this.uiGenerator = new UIGenerator(this.kinkData, this.preferencesManager);
        this.statsManager = new StatsManager(this.kinkData, this.preferencesManager);
        this.importExportManager = new ImportExportManager(this.preferencesManager, this.statsManager);
        this.imageGeneratorByCategory = new LazyImageGenerator('category', this.preferencesManager, this.kinkData);
        this.imageGeneratorByPreference = new LazyImageGenerator('preference', this.preferencesManager, this.kinkData);
        this.historyUIManager = new HistoryUIManager(this.historyManager, this.preferencesManager, this.statsManager);

        this.shareManager = new LazyShareManager(this.preferencesManager, this.kinkData);
        this.quizManager = new LazyQuizManager(this.kinkData, this.preferencesManager, this.statsManager);

        this.eventManager = new EventManager(this.preferencesManager, this.statsManager, this.importExportManager, { byCategory: this.imageGeneratorByCategory, byPreference: this.imageGeneratorByPreference},this.kinkData, this.historyManager, this.dbManager, this.shareManager);
        this.searchManager = new SearchManager(this.kinkData, this.uiGenerator);
    }

    generateInterface() {
        this.uiGenerator.generateInterface();
        this.statsManager.calculateCacheData();
        UIGenerator.initializeCustomItemButtons(this.customUIManager);
    }

    initializeEventListeners() {
        this.eventManager.initializeEventListeners();
        this.historyUIManager.initialize();
        this.searchManager.initialize();

        // Écouter l'événement de démarrage du quiz
        document.addEventListener('startQuiz', () => {
            console.log('🎯 Événement startQuiz reçu, lancement du questionnaire...');
            if (this.quizManager) {
                this.quizManager.startQuiz('discovery').catch((error) => {
                    this.handleError('Impossible de charger le questionnaire', error);
                });
            }
        });
    }

    updateInterface() {
        this.statsManager.updateInterface();
        this.customUIManager.addCustomizationButton();
    }

    saveCurrentStateToHistory(action) {
        const currentState = this.preferencesManager.getAllPreferences();
        this.historyManager.saveState(currentState, action);
    }

    async checkSharedLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');

        if (shareId) {
            const shareKey = window.location.hash.replace('#key=', '');

            try {
                const sharedData = await this.shareManager.loadFromShare(shareId, shareKey);

                if (sharedData && sharedData.preferences) {
                    const validPrefs = new Map(Object.entries(sharedData.preferences));
                    this.preferencesManager.applyImportedPreferences(validPrefs);
                    this.statsManager.updateInterface();

                    ToastManager.showToast('Préférences partagées chargées !', 'success');

                    // Nettoyer l'URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (error) {
                console.error('Erreur lors du chargement du partage:', error);
                ToastManager.showToast('Erreur lors du chargement du partage', 'danger');
            }
        }
    }

    hideLoadingIndicator() {
        const loading = document.getElementById('loading');
        const mainContent = document.getElementById('main-content');

        if (loading) {
            loading.classList.remove('show');
            loading.style.display = 'none';
        }

        if (mainContent) {
            mainContent.classList.remove('loading');
            mainContent.style.opacity = '1';
            mainContent.style.pointerEvents = 'auto';
        }
    }

    handleError(message, error) {
        console.error(message, error);
        ToastManager.showToast(message, 'danger');
    }

    cleanup() {
        if (this.eventManager) {
            this.eventManager.cleanup();
        }
        if (this.historyUIManager) {
            this.historyUIManager.cleanup();
        }
        if (this.searchManager) {
            this.searchManager.cleanup();
        }
        if (this.dbManager) {
            this.dbManager.close();
        }
        this.isInitialized = false;
    }
}
