// app.js - Point d'entrée principal de l'application
import { CONFIG } from './config.js';
import appState from './state.js';
import { DataLoader } from './dataLoader.js';
import { UIGenerator } from './uiGenerator.js';
import { PreferencesManager } from './preferencesManager.js';
import { StatisticsManager } from './statisticsManager.js';
import { ChartManager } from './chartManager.js';
import { NotificationManager } from './notificationManager.js';

class KinkListApp {
  constructor() {
    this.initialized = false;
    this.managers = {};
  }

  async init() {
    try {
      console.log('🚀 Initialisation de KinkList App...');

      // Initialiser les gestionnaires
      this.initializeManagers();

      // Charger les données
      await this.loadData();

      // Générer l'interface
      this.generateUI();

      // Configurer les événements globaux
      this.setupGlobalEvents();

      // Marquer comme initialisé
      this.initialized = true;

      console.log('✅ Application initialisée avec succès');
      this.managers.notification.showSuccess('Application chargée avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.managers.notification?.showError('Erreur lors du chargement de l\'application');
      throw error;
    }
  }

  initializeManagers() {
    console.log('📦 Initialisation des gestionnaires...');
    
    // Ordre d'initialisation important
    this.managers.notification = new NotificationManager();
    this.managers.preferences = new PreferencesManager();
    this.managers.statistics = new StatisticsManager();
    this.managers.chart = new ChartManager();

    // Exposer certains gestionnaires globalement pour l'HTML
    window.preferencesManager = this.managers.preferences;
    window.statisticsManager = this.managers.statistics;
    window.chartManager = this.managers.chart;
    window.notificationManager = this.managers.notification;
  }

  async loadData() {
    console.log('📊 Chargement des données...');
    
    try {
      await DataLoader.loadKinkData();
      console.log('✅ Données chargées');
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      this.managers.notification.notifyDataLoadError();
      throw error;
    }
  }

  generateUI() {
    console.log('🎨 Génération de l\'interface...');
    
    try {
      UIGenerator.generateInterface();
      console.log('✅ Interface générée');
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'interface:', error);
      throw error;
    }
  }

  setupGlobalEvents() {
    // Gestionnaire global pour les fonctions appelées depuis l'HTML
    this.setupGlobalFunctions();

    // Événements de fenêtre
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Gestion des erreurs globales
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  setupGlobalFunctions() {
    // Fonctions globales appelées depuis l'HTML
    window.exportResults = this.exportResults.bind(this);
    window.importResults = this.importResults.bind(this);
    window.toggleStatsView = this.toggleStatsView.bind(this);
  }

  // Méthodes appelées depuis l'HTML
  async exportResults() {
    try {
      const result = DataLoader.exportPreferences();
      
      if (result.success) {
        this.managers.notification.notifyExportSuccess(result.count);
      } else {
        this.managers.notification.showWarning(result.message);
      }
    } catch (error) {
      console.error('Erreur export:', error);
      this.managers.notification.notifyExportError();
    }
  }

  async importResults(input) {
    const file = input.files[0];
    if (!file) return;

    try {
      const result = await DataLoader.importPreferences(file);
      
      if (result.success) {
        this.managers.notification.notifyImportSuccess(result.count);
      } else {
        this.managers.notification.notifyImportError(result.message);
      }
    } catch (error) {
      console.error('Erreur import:', error);
      this.managers.notification.notifyImportError();
    }

    // Réinitialiser l'input
    input.value = '';
  }

  toggleStatsView() {
    this.managers.statistics.toggleStatsView();
  }

  // Gestionnaires d'événements
  handleBeforeUnload(event) {
    // Sauvegarder les données si nécessaire
    const preferences = appState.getAllPreferences();
    const hasUnsavedChanges = Object.keys(preferences).length > 0;

    if (hasUnsavedChanges) {
      // Optionnel: demander confirmation avant de quitter
      // event.preventDefault();
      // event.returnValue = '';
    }
  }

  handleGlobalError(event) {
    console.error('Erreur globale:', event.error);
    
    if (this.managers.notification) {
      this.managers.notification.showError('Une erreur inattendue s\'est produite');
    }
  }

  handleUnhandledRejection(event) {
    console.error('Promise rejetée:', event.reason);
    
    if (this.managers.notification) {
      this.managers.notification.showError('Erreur de traitement des données');
    }
  }

  // Méthodes utilitaires
  getAppState() {
    return appState;
  }

  getManager(name) {
    return this.managers[name];
  }

  isInitialized() {
    return this.initialized;
  }

  // Méthodes pour le développement/debug
  debug() {
    return {
      state: appState,
      managers: this.managers,
      config: CONFIG
    };
  }

  reset() {
    appState.clearAllPreferences();
    this.managers.notification.showInfo('Application réinitialisée');
  }
}

// Instance unique de l'application
const app = new KinkListApp();

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await app.init();
  } catch (error) {
    console.error('Échec de l\'initialisation de l\'application:', error);
    
    // Affichage d'erreur de fallback
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger m-3';
    errorDiv.innerHTML = `
      <h4>Erreur de chargement</h4>
      <p>L'application n'a pas pu se charger correctement.</p>
      <p>Veuillez rafraîchir la page ou contacter le support.</p>
      <button class="btn btn-outline-danger" onclick="location.reload()">
        <i class="fas fa-redo"></i> Recharger
      </button>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorDiv, container.firstChild);
  }
});

// Export de l'application pour usage global
window.kinkListApp = app;
export default app;