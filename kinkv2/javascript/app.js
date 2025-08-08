// app.js - Point d'entrée principal optimisé
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
    this.managers = new Map();
    this.loadingElement = null;
    this.initPromise = null;
  }

  async init() {
    // Éviter les initialisations multiples
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._performInit();
    return this.initPromise;
  }

  async _performInit() {
    try {
      console.log('🚀 Initialisation de KinkList App...');
      
      // Afficher le loading
      this.showLoading(true);

      // Initialiser les gestionnaires dans l'ordre optimal
      await this.initializeManagers();

      // Charger les données en parallèle avec la préparation de l'UI
      const [data] = await Promise.all([
        this.loadData(),
        this.prepareUI()
      ]);

      // Générer l'interface avec les données
      this.generateUI();

      // Configurer les événements globaux
      this.setupGlobalEvents();

      // Initialisation terminée
      this.initialized = true;
      this.showLoading(false);

      console.log('✅ Application initialisée avec succès');
      this.managers.get('notification')?.showSuccess('Application chargée avec succès');

      return { success: true };

    } catch (error) {
      this.showLoading(false);
      console.error('❌ Erreur lors de l\'initialisation:', error);
      this.handleInitializationError(error);
      throw error;
    }
  }

  async initializeManagers() {
    console.log('📦 Initialisation des gestionnaires...');
    
    try {
      // Initialisation séquentielle des gestionnaires critiques
      const managers = [
        ['notification', NotificationManager],
        ['preferences', PreferencesManager],
        ['statistics', StatisticsManager]
      ];

      for (const [name, ManagerClass] of managers) {
        this.managers.set(name, new ManagerClass());
      }

      // ChartManager en dernier (dépend de Chart.js)
      this.managers.set('chart', new ChartManager());

      // Exposer globalement avec un proxy pour éviter les erreurs
      this.exposeManagersGlobally();

      console.log('✅ Gestionnaires initialisés');
    } catch (error) {
      console.error('❌ Erreur initialisation gestionnaires:', error);
      throw new Error('Échec initialisation des gestionnaires');
    }
  }

  exposeManagersGlobally() {
    // Utiliser des proxies pour éviter les erreurs si les managers ne sont pas prêts
    const createProxy = (managerName) => new Proxy({}, {
      get: (target, prop) => {
        const manager = this.managers.get(managerName);
        if (manager && typeof manager[prop] === 'function') {
          return manager[prop].bind(manager);
        }
        console.warn(`Méthode ${prop} non disponible sur ${managerName}`);
        return () => {};
      }
    });

    window.preferencesManager = createProxy('preferences');
    window.statisticsManager = createProxy('statistics');
    window.chartManager = createProxy('chart');
    window.notificationManager = createProxy('notification');
  }

  async loadData() {
    console.log('📊 Chargement des données...');
    
    try {
      const data = await DataLoader.loadKinkData();
      console.log('✅ Données chargées');
      return data;
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      this.managers.get('notification')?.notifyDataLoadError();
      throw new Error('Échec du chargement des données');
    }
  }

  prepareUI() {
    // Préparation du DOM et des styles
    return new Promise(resolve => {
      // Ajouter les styles nécessaires
      this.addRequiredStyles();
      
      // Préparer les éléments DOM critiques
      this.prepareDOM();
      
      // Attendre que le DOM soit stable
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }

  addRequiredStyles() {
    // Styles critiques pour éviter le FOUC (Flash of Unstyled Content)
    const criticalCSS = `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
      }
      
      .item {
        transition: all 0.2s ease;
      }
      
      .item:hover {
        transform: translateY(-1px);
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = criticalCSS;
    document.head.appendChild(styleElement);
  }

  prepareDOM() {
    // Créer les éléments DOM critiques s'ils n'existent pas
    const requiredElements = [
      { id: 'main-content', tag: 'div' },
      { id: 'categoriesAccordion', tag: 'div' }
    ];

    requiredElements.forEach(({ id, tag }) => {
      if (!document.getElementById(id)) {
        const element = document.createElement(tag);
        element.id = id;
        document.body.appendChild(element);
      }
    });
  }

  generateUI() {
    console.log('🎨 Génération de l\'interface...');
    
    try {
      // Génération de l'UI avec gestion d'erreur
      UIGenerator.generateInterface();
      console.log('✅ Interface générée');
    } catch (error) {
      console.error('❌ Erreur génération interface:', error);
      this.showFallbackUI();
    }
  }

  showFallbackUI() {
    const container = document.querySelector('.container') || document.body;
    const fallback = document.createElement('div');
    fallback.className = 'alert alert-warning m-3';
    fallback.innerHTML = `
      <h4><i class="fas fa-exclamation-triangle"></i> Interface simplifiée</h4>
      <p>L'interface complète n'a pas pu se charger. Mode de base activé.</p>
      <button class="btn btn-primary" onclick="location.reload()">
        <i class="fas fa-redo"></i> Recharger
      </button>
    `;
    container.appendChild(fallback);
  }

  setupGlobalEvents() {
    // Débounce pour les événements fréquents
    const debouncedResize = this.debounce(() => {
      this.handleResize();
    }, 250);

    // Événements optimisés
    window.addEventListener('resize', debouncedResize, { passive: true });
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this), { passive: true });
    
    // Gestion d'erreurs avec throttling
    const throttledErrorHandler = this.throttle((error) => {
      this.handleGlobalError(error);
    }, 1000);

    window.addEventListener('error', throttledErrorHandler);
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event);
    });

    // Fonctions globales avec validation
    this.setupGlobalFunctions();
  }

  setupGlobalFunctions() {
    const createSafeFunction = (fn, fallback) => {
      return (...args) => {
        try {
          return fn.apply(this, args);
        } catch (error) {
          console.error('Erreur fonction globale:', error);
          return fallback?.(...args);
        }
      };
    };

    window.exportResults = createSafeFunction(this.exportResults);
    window.importResults = createSafeFunction(this.importResults);
    window.toggleStatsView = createSafeFunction(this.toggleStatsView);
    window.exportToPDF = createSafeFunction(this.exportToPDF);
  }

  // Méthodes optimisées pour les fonctions globales
  async exportResults() {
    try {
      const notification = this.managers.get('notification');
      
      if (!this.initialized) {
        notification?.showWarning('Application en cours de chargement...');
        return;
      }

      const result = DataLoader.exportPreferences();
      
      if (result.success) {
        notification?.notifyExportSuccess(result.count);
      } else {
        notification?.showWarning(result.message);
      }
    } catch (error) {
      console.error('Erreur export:', error);
      this.managers.get('notification')?.notifyExportError();
    }
  }

  async importResults(input) {
    const file = input?.files?.[0];
    if (!file) return;

    try {
      const notification = this.managers.get('notification');
      
      // Validation rapide du fichier
      if (!file.name.endsWith('.json')) {
        notification?.showError('Veuillez sélectionner un fichier JSON');
        return;
      }

      const result = await DataLoader.importPreferences(file);
      
      if (result.success) {
        notification?.notifyImportSuccess(result.count);
        // Déclencher la mise à jour de l'UI
        this.refreshUI();
      } else {
        notification?.notifyImportError(result.message);
      }
    } catch (error) {
      console.error('Erreur import:', error);
      this.managers.get('notification')?.notifyImportError();
    } finally {
      // Toujours réinitialiser l'input
      if (input) input.value = '';
    }
  }

  toggleStatsView() {
    const statsManager = this.managers.get('statistics');
    if (statsManager && this.initialized) {
      statsManager.toggleStatsView();
    } else {
      console.warn('Gestionnaire de statistiques non disponible');
    }
  }

  async exportToPDF() {
    try {
      const chartManager = this.managers.get('chart');
      
      if (!chartManager) {
        throw new Error('Gestionnaire de graphiques non disponible');
      }

      const result = await chartManager.exportToPDF();
      
      const notification = this.managers.get('notification');
      if (result.success) {
        notification?.showSuccess(result.message);
      } else {
        notification?.showError(result.message);
      }
    } catch (error) {
      console.error('Erreur export PDF:', error);
      this.managers.get('notification')?.showError('Erreur lors de la génération du PDF');
    }
  }

  // Méthodes utilitaires optimisées
  refreshUI() {
    // Mise à jour optimisée de l'interface
    requestAnimationFrame(() => {
      try {
        const statsManager = this.managers.get('statistics');
        const prefsManager = this.managers.get('preferences');
        
        if (statsManager) statsManager.updateStats();
        if (prefsManager) UIGenerator.updateItemsFromState();
      } catch (error) {
        console.error('Erreur refresh UI:', error);
      }
    });
  }

  handleResize() {
    // Gestion optimisée du redimensionnement
    const chartManager = this.managers.get('chart');
    if (chartManager && appState.isDetailedView) {
      chartManager.updateChart();
    }
  }

  handleBeforeUnload(event) {
    // Sauvegarde rapide si nécessaire
    const preferences = appState.getAllPreferences();
    const hasChanges = Object.keys(preferences).length > 0;

    if (hasChanges) {
      // Optionnel: sauvegarder dans localStorage
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
      } catch (error) {
        console.warn('Impossible de sauvegarder:', error);
      }
    }
  }

  handleGlobalError(event) {
    console.error('Erreur globale:', event.error);
    
    const notification = this.managers.get('notification');
    if (notification && this.initialized) {
      notification.showError('Une erreur inattendue s\'est produite');
    }
  }

  handleUnhandledRejection(event) {
    console.error('Promise rejetée:', event.reason);
    event.preventDefault(); // Empêcher l'affichage d'erreur par défaut
    
    const notification = this.managers.get('notification');
    if (notification && this.initialized) {
      notification.showError('Erreur de traitement des données');
    }
  }

  handleInitializationError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger m-3';
    errorDiv.innerHTML = `
      <h4><i class="fas fa-exclamation-triangle"></i> Erreur de chargement</h4>
      <p>L'application n'a pas pu se charger correctement.</p>
      <details class="mt-2">
        <summary>Détails de l'erreur</summary>
        <pre class="mt-2 small">${this.escapeHtml(error.message)}</pre>
      </details>
      <div class="mt-3">
        <button class="btn btn-outline-danger me-2" onclick="location.reload()">
          <i class="fas fa-redo"></i> Recharger
        </button>
        <button class="btn btn-outline-secondary" onclick="window.kinkListApp?.debug()">
          <i class="fas fa-bug"></i> Debug
        </button>
      </div>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorDiv, container.firstChild);
  }

  showLoading(show = true) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      if (show) {
        loadingElement.classList.remove('d-none');
      } else {
        loadingElement.classList.add('d-none');
      }
    }
  }

  // Utilitaires de performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // Méthodes publiques
  getManager(name) {
    return this.managers.get(name);
  }

  isReady() {
    return this.initialized;
  }

  // Debug et développement
  debug() {
    return {
      initialized: this.initialized,
      managers: Object.fromEntries(this.managers),
      state: appState,
      config: CONFIG,
      performance: performance.getEntriesByType('navigation')[0]
    };
  }

  async reset() {
    try {
      appState.clearAllPreferences();
      this.refreshUI();
      this.managers.get('notification')?.showInfo('Application réinitialisée');
    } catch (error) {
      console.error('Erreur reset:', error);
    }
  }
}

// Instance unique avec protection
let appInstance = null;

function createApp() {
  if (appInstance) {
    return appInstance;
  }
  
  appInstance = new KinkListApp();
  return appInstance;
}

// Initialisation optimisée au chargement du DOM
const initializeApp = async () => {
  try {
    const app = createApp();
    await app.init();
    
    // Exposer globalement
    window.kinkListApp = app;
    
  } catch (error) {
    console.error('Échec de l\'initialisation:', error);
    
    // Interface d'erreur de fallback uniquement si aucune n'existe
    if (!document.querySelector('.alert-danger')) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-danger m-3';
      errorDiv.innerHTML = `
        <h4>Erreur critique</h4>
        <p>L'application n'a pas pu se charger. Veuillez rafraîchir la page.</p>
        <button class="btn btn-outline-danger" onclick="location.reload()">
          <i class="fas fa-redo"></i> Recharger
        </button>
      `;
      
      const container = document.querySelector('.container') || document.body;
      container.insertBefore(errorDiv, container.firstChild);
    }
  }
};

// Initialisation avec support de différents états de chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM déjà chargé
  setTimeout(initializeApp, 0);
}

// Export pour les modules
export default createApp();