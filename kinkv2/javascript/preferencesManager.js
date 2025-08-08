// preferencesManager.js - Gestion optimisée des préférences avec event delegation
import appState from './state.js';
import { CONFIG } from './config.js';

export class PreferencesManager {
  constructor() {
    this.validStates = ['none', ...CONFIG.VALIDATION.VALID_PREFERENCE_STATES];
    this.isInitialized = false;
    this.clickHandler = null;
    this.touchHandler = null;
    
    // Performance tracking
    this.performanceStats = {
      clicksProcessed: 0,
      lastClickTime: 0,
      averageProcessingTime: 0
    };
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    this.setupEventDelegation();
    this.setupStateListeners();
    this.isInitialized = true;
    
    console.log('✅ PreferencesManager initialisé avec event delegation');
  }

  setupEventDelegation() {
    // Event delegation optimisée pour les clics
    this.clickHandler = this.createOptimizedClickHandler();
    
    // Utiliser la capture pour intercepter avant la propagation
    document.addEventListener('click', this.clickHandler, {
      capture: true,
      passive: false
    });

    // Support tactile pour mobile
    if ('ontouchstart' in window) {
      this.touchHandler = this.createTouchHandler();
      document.addEventListener('touchend', this.touchHandler, {
        capture: true,
        passive: false
      });
    }
  }

  createOptimizedClickHandler() {
    // Debouncing pour éviter les double-clics accidentels
    let lastClickTime = 0;
    const DEBOUNCE_TIME = 150;
    
    return (event) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime;
      
      // Ignorer les clics trop rapprochés
      if (timeSinceLastClick < DEBOUNCE_TIME) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      
      lastClickTime = now;
      
      // Trouver l'item le plus proche avec event delegation
      const item = event.target.closest('.item[data-item]');
      if (item && this.isValidItem(item)) {
        const processed = this.handleItemClick(item, now);
        
        if (processed) {
          // Empêcher la propagation si traité
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };
  }

  createTouchHandler() {
    let touchStartTime = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartTime = Date.now();
    }, { passive: true });
    
    return (event) => {
      const touchDuration = Date.now() - touchStartTime;
      
      // Ignorer les touches trop longues (probable scroll/drag)
      if (touchDuration > 500) return;
      
      const item = event.target.closest('.item[data-item]');
      if (item && this.isValidItem(item)) {
        this.handleItemClick(item, Date.now());
        event.preventDefault();
      }
    };
  }

  isValidItem(item) {
    // Vérifications rapides de validité
    return item && 
           item.dataset.item && 
           !item.classList.contains('disabled') &&
           !item.hasAttribute('data-loading');
  }

  handleItemClick(item, clickTime) {
    const startTime = performance.now();
    
    try {
      const itemName = item.dataset.item;
      if (!itemName) return false;

      // Marquer comme en cours de traitement pour éviter double-clic
      item.setAttribute('data-loading', 'true');

      const currentState = appState.getPreference(itemName);
      const newState = this.getNextState(currentState);

      // Animation visuelle immédiate pour feedback utilisateur
      this.addClickFeedback(item);

      // Mettre à jour l'état
      const success = appState.updatePreference(itemName, newState);
      
      if (success) {
        this.updatePerformanceStats(startTime, clickTime);
      }

      return success;

    } catch (error) {
      console.error('Erreur traitement clic:', error);
      return false;
    } finally {
      // Toujours retirer le flag de loading
      setTimeout(() => {
        item.removeAttribute('data-loading');
      }, 100);
    }
  }

  addClickFeedback(item) {
    // Animation de feedback rapide
    item.style.transform = 'scale(0.95)';
    item.style.transition = 'transform 0.1s ease';
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        item.style.transform = '';
        item.style.transition = '';
      });
    });
  }

  getNextState(currentState) {
    const currentIndex = this.validStates.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % this.validStates.length;
    return this.validStates[nextIndex];
  }

  setupStateListeners() {
    // Listeners optimisés avec cleanup automatique
    const listeners = [
      appState.addListener('preferenceChanged', this.onPreferenceChanged.bind(this)),
      appState.addListener('preferencesImported', this.onPreferencesImported.bind(this)),
      appState.addListener('allPreferencesCleared', this.onAllPreferencesCleared.bind(this))
    ];

    // Stocker pour cleanup
    this.stateListeners = listeners;
  }

  onPreferenceChanged({ itemName, newState, batch }) {
    if (batch) {
      // Traiter les changements en batch pour performance
      this.processBatchedChanges(batch);
    } else {
      this.updateItemUI(itemName, newState);
    }
  }

  processBatchedChanges(changes) {
    // Batching des mises à jour DOM pour performance
    requestAnimationFrame(() => {
      changes.forEach(change => {
        this.updateItemUI(change.itemName, change.newState);
      });
    });
  }

  onPreferencesImported({ count }) {
    console.log(`📥 ${count} préférences importées`);
    this.updateAllItemsUI();
  }

  onAllPreferencesCleared() {
    console.log('🧹 Toutes les préférences effacées');
    this.clearAllItemsUI();
  }

  updateItemUI(itemName, newState) {
    if (!itemName) return;
    
    // Utiliser le cache DOM si disponible
    const item = this.findItemElement(itemName);
    if (!item) return;

    // Optimisation: ne modifier que si changement réel
    const hasStateClass = CONFIG.VALIDATION.VALID_PREFERENCE_STATES.some(cls => 
      item.classList.contains(cls)
    );
    
    const shouldHaveStateClass = newState && newState !== 'none';
    
    if (hasStateClass === shouldHaveStateClass && 
        (!shouldHaveStateClass || item.classList.contains(newState))) {
      return; // Pas de changement nécessaire
    }

    // Appliquer les changements
    this.applyStateToItem(item, newState);
  }

  findItemElement(itemName) {
    // Cache des éléments récemment utilisés
    if (!this.itemCache) {
      this.itemCache = new Map();
    }
    
    if (this.itemCache.has(itemName)) {
      const cached = this.itemCache.get(itemName);
      if (cached && document.contains(cached)) {
        return cached;
      }
      this.itemCache.delete(itemName);
    }
    
    const item = document.querySelector(`[data-item="${this.escapeSelector(itemName)}"]`);
    if (item) {
      this.itemCache.set(itemName, item);
      
      // Limiter la taille du cache
      if (this.itemCache.size > 100) {
        const firstKey = this.itemCache.keys().next().value;
        this.itemCache.delete(firstKey);
      }
    }
    
    return item;
  }

  applyStateToItem(item, newState) {
    // Batch DOM modifications
    const classesToRemove = CONFIG.VALIDATION.VALID_PREFERENCE_STATES.filter(cls => 
      item.classList.contains(cls)
    );
    
    // Removal en une fois
    if (classesToRemove.length > 0) {
      item.classList.remove(...classesToRemove);
    }
    
    // Addition si nécessaire
    if (newState && newState !== 'none') {
      item.classList.add(newState);
    }
  }

  updateAllItemsUI() {
    const preferences = appState.getAllPreferencesMap();
    
    // Utiliser querySelectorAll une seule fois puis itérer
    const items = document.querySelectorAll('.item[data-item]');
    
    // Batch toutes les modifications
    requestAnimationFrame(() => {
      items.forEach(item => {
        const itemName = item.dataset.item;
        const preference = preferences.get(itemName) || 'none';
        this.applyStateToItem(item, preference);
      });
    });
  }

  clearAllItemsUI() {
    const items = document.querySelectorAll('.item[data-item]');
    
    requestAnimationFrame(() => {
      const stateClasses = CONFIG.VALIDATION.VALID_PREFERENCE_STATES;
      items.forEach(item => {
        item.classList.remove(...stateClasses);
      });
    });
  }

  // ===== MÉTHODES UTILITAIRES OPTIMISÉES =====

  getPreferenceCount(preferenceType) {
    const stats = appState.getStats();
    return stats?.preferenceStats?.[preferenceType]?.count || 0;
  }

  getTotalSelectedCount() {
    return appState.getAllPreferencesMap().size;
  }

  exportPreferences() {
    return appState.getAllPreferences();
  }

  async importPreferences(preferences) {
    try {
      const count = appState.importPreferences(preferences);
      return { 
        success: true, 
        count,
        message: `${count} préférences importées avec succès` 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        message: 'Erreur lors de l\'importation'
      };
    }
  }

  clearAllPreferences() {
    appState.clearAllPreferences();
    this.clearItemCache();
  }

  getPreferenceStateName(preferenceId) {
    const kinkData = appState.getKinkData();
    if (!kinkData) return preferenceId;

    const prefType = kinkData.preferenceTypes.find(type => type.id === preferenceId);
    return prefType?.name || preferenceId;
  }

  // ===== PERFORMANCE ET DEBUG =====

  updatePerformanceStats(startTime, clickTime) {
    const processingTime = performance.now() - startTime;
    this.performanceStats.clicksProcessed++;
    this.performanceStats.lastClickTime = clickTime;
    
    // Moyenne mobile des temps de traitement
    const oldAvg = this.performanceStats.averageProcessingTime;
    const count = this.performanceStats.clicksProcessed;
    this.performanceStats.averageProcessingTime = 
      (oldAvg * (count - 1) + processingTime) / count;
  }

  getPerformanceStats() {
    return {
      ...this.performanceStats,
      cacheSize: this.itemCache?.size || 0,
      listenersActive: this.stateListeners?.length || 0,
      isInitialized: this.isInitialized
    };
  }

  // ===== UTILITAIRES =====

  escapeSelector(str) {
    // Échapper les caractères spéciaux pour les sélecteurs CSS
    return str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
  }

  clearItemCache() {
    if (this.itemCache) {
      this.itemCache.clear();
    }
  }

  // ===== MÉTHODES DE DIAGNOSTIC =====

  diagnose() {
    const items = document.querySelectorAll('.item[data-item]');
    const preferences = appState.getAllPreferences();
    
    let syncIssues = 0;
    let orphanedPreferences = 0;
    let itemsWithoutPreferences = 0;

    // Vérifier la synchronisation UI/État
    items.forEach(item => {
      const itemName = item.dataset.item;
      const statePreference = preferences[itemName];
      const hasStateClass = CONFIG.VALIDATION.VALID_PREFERENCE_STATES.some(cls => 
        item.classList.contains(cls)
      );

      if ((statePreference && !hasStateClass) || (!statePreference && hasStateClass)) {
        syncIssues++;
      }
    });

    // Vérifier les préférences orphelines
    Object.keys(preferences).forEach(prefName => {
      const item = document.querySelector(`[data-item="${this.escapeSelector(prefName)}"]`);
      if (!item) {
        orphanedPreferences++;
      }
    });

    itemsWithoutPreferences = items.length - Object.keys(preferences).length;

    return {
      totalItems: items.length,
      totalPreferences: Object.keys(preferences).length,
      syncIssues,
      orphanedPreferences,
      itemsWithoutPreferences,
      performance: this.getPerformanceStats()
    };
  }

  // ===== NETTOYAGE =====

  destroy() {
    // Nettoyer les event listeners
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, { capture: true });
    }
    
    if (this.touchHandler) {
      document.removeEventListener('touchend', this.touchHandler, { capture: true });
    }

    // Nettoyer les state listeners
    if (this.stateListeners) {
      this.stateListeners.forEach(unsubscribe => unsubscribe());
    }

    // Vider les caches
    this.clearItemCache();
    
    this.isInitialized = false;
    console.log('🧹 PreferencesManager nettoyé');
  }
}