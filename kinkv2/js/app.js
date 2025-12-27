import { DataLoader } from './data-loader.js';
import { UIGenerator } from './ui-generator.js';
import { PreferencesManager } from './preferences-manager.js';
import { StatsManager } from './stats-manager.js';
import { EventManager } from './event-manager.js';
import { ImportExportManager } from './import-export-manager.js';
import { ImageGeneratorByCategory } from './image-generator-categories.js';
import { ImageGeneratorByPreference } from './image-generator-preferences.js';
import { ToastManager } from './toast-manager.js';
import { CustomDataManager } from './custom-data-manager.js';
import { CustomUIManager } from './custom-ui-manager.js';
import { ModalManager } from './modal-manager.js';
import { HistoryManager } from './history-manager.js';
import { HistoryUIManager } from './history-ui-manager.js';

// NOUVEAUX IMPORTS
import { ViewManager } from './view-manager.js';
import { IndexedDBManager } from './indexed-db-manager.js';
import { SecureShareManager } from './secure-share-manager.js';
import { LazyLoadingManager } from './lazy-loading-manager.js';
import { GuidedQuizManager } from './guided-quiz-manager.js';

export class KinkPreferencesApp {
    constructor() {
        this.kinkData = null;
        this.isInitialized = false;
        this.enableLazyLoading = true; // Toggle lazy loading
        
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
        
        // NOUVEAUX MANAGERS
        this.dbManager = null;
        this.viewManager = null;
        this.shareManager = null;
        this.lazyLoadingManager = null;
        this.quizManager = null;
    }

    async init() {
        try {
            if (this.isInitialized) {
                console.warn('⚠️ Application déjà initialisée');
                return;
            }

            console.log('🚀 Début de l\'initialisation...');

            // NOUVEAU: Initialiser IndexedDB en premier
            this.dbManager = new IndexedDBManager();
            await this.dbManager.init();

            // Chargement des données
            await this.loadKinkData();
            
            // NOUVEAU: Charger les préférences depuis IndexedDB
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
            
            // NOUVEAU: Vérifier les liens partagés
            await this.checkSharedLink();
            
            // NOUVEAU: Nettoyer le cache expiré
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
        const originalData = await DataLoader.loadKinkData();
        this.kinkData = this.customDataManager.mergeWithOriginalData(originalData);
    }

    initializeManagers() {
        this.uiGenerator = new UIGenerator(this.kinkData);
        this.statsManager = new StatsManager(this.kinkData, this.preferencesManager);
        this.importExportManager = new ImportExportManager(this.preferencesManager, this.statsManager);
        this.imageGeneratorByCategory = new ImageGeneratorByCategory(this.preferencesManager, this.kinkData);
        this.imageGeneratorByPreference = new ImageGeneratorByPreference(this.preferencesManager, this.kinkData);
        this.historyUIManager = new HistoryUIManager(this.historyManager, this.preferencesManager, this.statsManager);
        
        this.viewManager = new ViewManager(this.kinkData, this.preferencesManager);
        this.shareManager = new SecureShareManager(this.preferencesManager, this.kinkData);
        this.lazyLoadingManager = new LazyLoadingManager(this.kinkData, this.uiGenerator, this.preferencesManager, this.statsManager);

        // Doute
        this.statsManager.setLazyLoadingManager(this.lazyLoadingManager);

        this.quizManager = new GuidedQuizManager(this.kinkData, this.preferencesManager, this.statsManager);
        
        this.eventManager = new EventManager(this.preferencesManager, this.statsManager, this.importExportManager, { byCategory: this.imageGeneratorByCategory, byPreference: this.imageGeneratorByPreference},this.kinkData, this.historyManager, this.dbManager, this.shareManager);
    }

    generateInterface() {
        // NOUVEAU: Choisir entre lazy loading ou génération normale
        if (this.enableLazyLoading) {
            this.lazyLoadingManager.initialize();
        } else {
            this.uiGenerator.generateInterface();
        }
        
        this.statsManager.calculateCacheData();
        UIGenerator.initializeCustomItemButtons(this.customUIManager);
    }

    initializeEventListeners() {
        this.eventManager.initializeEventListeners();
        this.historyUIManager.initialize();
        this.viewManager.initialize(); // NOUVEAU
    }

    updateInterface() {
        this.statsManager.updateInterface();
        this.customUIManager.addCustomizationButton();
    }

    saveCurrentStateToHistory(action) {
        const currentState = this.preferencesManager.getAllPreferences();
        this.historyManager.saveState(currentState, action);
    }
    
    // NOUVELLE MÉTHODE: Vérifier les liens partagés
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
        if (this.lazyLoadingManager) {
            this.lazyLoadingManager.disconnect();
        }
        if (this.dbManager) {
            this.dbManager.close();
        }
        this.isInitialized = false;
    }
}