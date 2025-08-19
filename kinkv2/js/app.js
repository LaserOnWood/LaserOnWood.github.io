/**
 * Module principal de l'application de gestion des préférences Kink
 * Version modulaire - Amélioration de la maintenabilité et lisibilité
 */
import { DataLoader } from './data-loader.js';
import { UIGenerator } from './ui-generator.js';
import { PreferencesManager } from './preferences-manager.js';
import { StatsManager } from './stats-manager.js';
import { EventManager } from './event-manager.js';
import { ImportExportManager } from './import-export-manager.js';
import { ImageGenerator } from './image-generator.js';
import { ToastManager } from './toast-manager.js';

/**
 * Classe principale de l'application
 */
export class KinkPreferencesApp {
    constructor() {
        this.kinkData = null;
        this.isInitialized = false;
        
        // Initialisation des managers
        this.preferencesManager = new PreferencesManager();
        this.statsManager = null;
        this.eventManager = null;
        this.importExportManager = null;
        this.imageGenerator = null;
        this.uiGenerator = null;
    }

    /**
     * Initialisation de l'application
     */
    async init() {
        try {
            if (this.isInitialized) {
                console.warn('⚠️ Application déjà initialisée');
                return;
            }

            console.log('🚀 Début de l\'initialisation...');

            // Chargement des données
            await this.loadKinkData();
            
            // Initialisation des managers
            this.initializeManagers();
            
            // Génération de l'interface
            this.generateInterface();
            
            // Initialisation des event listeners
            this.initializeEventListeners();
            
            // Mise à jour de l'interface
            this.updateInterface();

            this.isInitialized = true;
            console.log('✅ Initialisation terminée avec succès !');

            // Masquer le chargement
            this.hideLoadingIndicator();

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.handleError('Erreur lors de l\'initialisation', error);
            throw error;
        }
    }

    /**
     * Chargement des données JSON
     */
    async loadKinkData() {
        this.kinkData = await DataLoader.loadKinkData();
    }

    /**
     * Initialisation des managers
     */
    initializeManagers() {
        this.uiGenerator = new UIGenerator(this.kinkData);
        this.statsManager = new StatsManager(this.kinkData, this.preferencesManager);
        this.importExportManager = new ImportExportManager(this.preferencesManager, this.statsManager);
        this.imageGenerator = new ImageGenerator(this.preferencesManager, this.kinkData);
        this.eventManager = new EventManager(
            this.preferencesManager, 
            this.statsManager, 
            this.importExportManager,
            this.imageGenerator,
            this.kinkData
        );
    }

    /**
     * Génération de l'interface
     */
    generateInterface() {
        this.uiGenerator.generateInterface();
        this.statsManager.calculateCacheData();
    }

    /**
     * Initialisation des event listeners
     */
    initializeEventListeners() {
        this.eventManager.initializeEventListeners();
    }

    /**
     * Mise à jour complète de l'interface
     */
    updateInterface() {
        this.statsManager.updateInterface();
    }

    /**
     * Masquage de l'indicateur de chargement
     */
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

    /**
     * Gestion des erreurs
     * @param {string} message - Message d'erreur
     * @param {Error} error - Objet erreur
     */
    handleError(message, error) {
        console.error(message, error);
        ToastManager.showToast(message, 'danger');
    }

    /**
     * Nettoyage de l'application
     */
    cleanup() {
        if (this.eventManager) {
            this.eventManager.cleanup();
        }
        this.isInitialized = false;
    }
}

