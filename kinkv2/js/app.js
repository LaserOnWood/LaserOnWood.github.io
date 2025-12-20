/**
 * Module principal de l'application de gestion des préférences Kink
 * Version modulaire - Amélioration de la maintenabilité et lisibilité
 * Modifié pour supporter les deux types de génération d'image
 */
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
        this.imageGeneratorByCategory = null;
        this.imageGeneratorByPreference = null;
        this.uiGenerator = null;
        this.customDataManager = new CustomDataManager();
        this.customUIManager = new CustomUIManager();
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
        const originalData = await DataLoader.loadKinkData();
        // Fusionner avec les données personnalisées
        this.kinkData = this.customDataManager.mergeWithOriginalData(originalData);
    }

    /**
     * Initialisation des managers
     */
    initializeManagers() {
        this.uiGenerator = new UIGenerator(this.kinkData);
        this.statsManager = new StatsManager(this.kinkData, this.preferencesManager);
        this.importExportManager = new ImportExportManager(this.preferencesManager, this.statsManager);
        
        // Initialisation des deux générateurs d'image
        this.imageGeneratorByCategory = new ImageGeneratorByCategory(this.preferencesManager, this.kinkData);
        this.imageGeneratorByPreference = new ImageGeneratorByPreference(this.preferencesManager, this.kinkData);
        
        this.eventManager = new EventManager(
            this.preferencesManager, 
            this.statsManager, 
            this.importExportManager,
            {
                byCategory: this.imageGeneratorByCategory,
                byPreference: this.imageGeneratorByPreference
            },
            this.kinkData
        );
    }

    /**
     * Génération de l'interface
     */
    generateInterface() {
        this.uiGenerator.generateInterface();
        this.statsManager.calculateCacheData();
        // Initialiser les boutons d'ajout d'item personnalisé
        UIGenerator.initializeCustomItemButtons(this.customUIManager);
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
        // Ajouter le bouton de personnalisation
        this.customUIManager.addCustomizationButton();
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