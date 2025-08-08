// state.js - Gestionnaire d'état optimisé avec performances améliorées
import { CONFIG } from './config.js';

class AppState {
  constructor() {
    this.preferences = new Map();
    this.kinkData = null;
    this.isDetailedView = false;
    this.listeners = new Map();
    this.currentChart = null;
    this.currentChartType = 'doughnut';
    
    // Cache pour les statistiques
    this.statsCache = null;
    this.statsCacheTime = 0;
    this.CACHE_DURATION = 1000; // 1 seconde

    // Batch des notifications pour éviter le spam
    this.pendingNotifications = new Set();
    this.notificationBatchTimeout = null;
    
    // Historique des changements pour undo/redo (optionnel)
    this.history = [];
    this.maxHistorySize = 50;
  }

  // ===== GESTION DES PRÉFÉRENCES OPTIMISÉE =====
  
  updatePreference(itemName, newState) {
    if (!itemName || typeof itemName !== 'string') {
      console.warn('Nom d\'item invalide:', itemName);
      return false;
    }

    const oldState = this.preferences.get(itemName) || 'none';
    
    // Pas de changement, pas de notification
    if (oldState === newState) {
      return false;
    }

    // Sauvegarder l'ancien état pour l'historique
    this.saveToHistory('updatePreference', { itemName, oldState, newState });

    // Mettre à jour
    if (newState === 'none' || !newState) {
      this.preferences.delete(itemName);
    } else {
      this.preferences.set(itemName, newState);
    }

    // Invalider le cache des stats
    this.invalidateStatsCache();

    // Notification batchée pour éviter le spam
    this.batchNotification('preferenceChanged', {
      itemName,
      oldState,
      newState,
      totalSelected: this.preferences.size
    });

    return true;
  }

  getPreference(itemName) {
    return this.preferences.get(itemName) || 'none';
  }

  getAllPreferences() {
    // Retourner un objet simple pour la compatibilité
    return Object.fromEntries(this.preferences);
  }

  getAllPreferencesMap() {
    // Version optimisée pour usage interne
    return new Map(this.preferences);
  }

  clearAllPreferences() {
    const oldPreferences = new Map(this.preferences);
    this.preferences.clear();
    this.invalidateStatsCache();
    
    this.saveToHistory('clearAll', { oldPreferences });
    this.notifyListeners('allPreferencesCleared');
  }

  importPreferences(newPreferences) {
    if (!newPreferences || typeof newPreferences !== 'object') {
      throw new Error('Préférences invalides');
    }

    // Sauvegarder l'état actuel
    const oldPreferences = new Map(this.preferences);

    // Validation et importation optimisées
    this.preferences.clear();
    let importedCount = 0;

    for (const [key, value] of Object.entries(newPreferences)) {
      if (this.isValidPreference(key, value)) {
        this.preferences.set(key, value);
        importedCount++;
      }
    }

    this.invalidateStatsCache();
    this.saveToHistory('import', { oldPreferences, importedCount });
    this.notifyListeners('preferencesImported', { 
      preferences: this.getAllPreferences(),
      count: importedCount
    });

    return importedCount;
  }

  isValidPreference(key, value) {
    return typeof key === 'string' && 
           key.length > 0 && 
           CONFIG.VALIDATION.VALID_PREFERENCE_STATES.includes(value);
  }

  // ===== GESTION DES DONNÉES =====
  
  setKinkData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Données Kink invalides');
    }

    this.kinkData = Object.freeze(data); // Immutable pour éviter les modifications accidentelles
    this.invalidateStatsCache();
    this.notifyListeners('dataLoaded', { data });
  }

  getKinkData() {
    return this.kinkData;
  }

  // ===== GESTION DES VUES =====
  
  toggleDetailedView() {
    this.isDetailedView = !this.isDetailedView;
    this.notifyListeners('viewToggled', { isDetailed: this.isDetailedView });
    return this.isDetailedView;
  }

  setDetailedView(isDetailed) {
    if (this.isDetailedView !== isDetailed) {
      this.isDetailedView = isDetailed;
      this.notifyListeners('viewToggled', { isDetailed: this.isDetailedView });
    }
  }

  // ===== GESTION DES GRAPHIQUES =====
  
  setCurrentChart(chart, type = 'doughnut') {
    // Nettoyer l'ancien graphique
    if (this.currentChart && this.currentChart.destroy) {
      try {
        this.currentChart.destroy();
      } catch (error) {
        console.warn('Erreur destruction graphique:', error);
      }
    }
    
    this.currentChart = chart;
    this.currentChartType = type;
  }

  getCurrentChart() {
    return this.currentChart;
  }

  getCurrentChartType() {
    return this.currentChartType;
  }

  // ===== SYSTÈME D'ÉVÉNEMENTS OPTIMISÉ =====
  
  addListener(event, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback doit être une fonction');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);

    // Retourner une fonction de nettoyage
    return () => this.removeListener(event, callback);
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      
      // Nettoyer les sets vides
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  notifyListeners(event, data = {}) {
    if (!this.listeners.has(event)) return;

    const listeners = this.listeners.get(event);
    const promises = [];

    for (const callback of listeners) {
      try {
        const result = callback(data);
        if (result instanceof Promise) {
          promises.push(result.catch(error => {
            console.error(`Erreur listener async ${event}:`, error);
          }));
        }
      } catch (error) {
        console.error(`Erreur listener ${event}:`, error);
      }
    }

    // Attendre les callbacks asynchrones si nécessaire
    if (promises.length > 0) {
      Promise.allSettled(promises).then(results => {
        const errors = results.filter(r => r.status === 'rejected');
        if (errors.length > 0) {
          console.warn(`${errors.length} listeners ont échoué pour l'événement ${event}`);
        }
      });
    }
  }

  // Notification batchée pour les événements fréquents
  batchNotification(event, data) {
    this.pendingNotifications.add({ event, data });

    if (this.notificationBatchTimeout) {
      clearTimeout(this.notificationBatchTimeout);
    }

    this.notificationBatchTimeout = setTimeout(() => {
      this.processBatchedNotifications();
    }, 50); // 50ms de debounce
  }

  processBatchedNotifications() {
    const notifications = Array.from(this.pendingNotifications);
    this.pendingNotifications.clear();

    // Grouper par type d'événement
    const eventGroups = new Map();
    notifications.forEach(({ event, data }) => {
      if (!eventGroups.has(event)) {
        eventGroups.set(event, []);
      }
      eventGroups.get(event).push(data);
    });

    // Envoyer les notifications groupées
    eventGroups.forEach((dataArray, event) => {
      if (dataArray.length === 1) {
        this.notifyListeners(event, dataArray[0]);
      } else {
        this.notifyListeners(event, { batch: dataArray });
      }
    });
  }

  // ===== STATISTIQUES AVEC CACHE =====
  
  getStats() {
    const now = Date.now();
    
    // Utiliser le cache si valide
    if (this.statsCache && (now - this.statsCacheTime < this.CACHE_DURATION)) {
      return this.statsCache;
    }

    // Recalculer les statistiques
    const stats = this.calculateStats();
    
    // Mettre en cache
    this.statsCache = stats;
    this.statsCacheTime = now;
    
    return stats;
  }

  calculateStats() {
    if (!this.kinkData) return null;

    const startTime = performance.now();

    // Compter le total d'items de manière optimisée
    let totalItems = 0;
    const categoryStats = new Map();

    for (const category of this.kinkData.categories) {
      const categoryStat = {
        name: category.name,
        selected: 0,
        total: 0,
        percentage: 0
      };

      if (category.hasSubcategories && category.subcategories) {
        for (const subcat of category.subcategories) {
          if (subcat.items) {
            categoryStat.total += subcat.items.length;
            totalItems += subcat.items.length;

            for (const item of subcat.items) {
              const itemName = typeof item === 'string' ? item : item.name;
              if (this.preferences.has(itemName)) {
                categoryStat.selected++;
              }
            }
          }
        }
      } else if (category.items) {
        categoryStat.total = category.items.length;
        totalItems += category.items.length;

        for (const item of category.items) {
          const itemName = typeof item === 'string' ? item : item.name;
          if (this.preferences.has(itemName)) {
            categoryStat.selected++;
          }
        }
      }

      // Calculer le pourcentage
      if (categoryStat.total > 0) {
        categoryStat.percentage = ((categoryStat.selected / categoryStat.total) * 100).toFixed(1);
      }

      categoryStats.set(category.id, categoryStat);
    }

    const selectedItems = this.preferences.size;

    // Statistiques par type de préférence
    const preferenceStats = new Map();
    
    // Initialiser avec les types de préférences
    for (const type of this.kinkData.preferenceTypes) {
      preferenceStats.set(type.id, {
        count: 0,
        percentage: 0,
        name: type.name,
        color: type.color
      });
    }

    // Compter les préférences
    for (const preference of this.preferences.values()) {
      if (preferenceStats.has(preference)) {
        preferenceStats.get(preference).count++;
      }
    }

    // Calculer les pourcentages
    if (selectedItems > 0) {
      for (const stat of preferenceStats.values()) {
        stat.percentage = ((stat.count / selectedItems) * 100).toFixed(1);
      }
    }

    const endTime = performance.now();
    console.log(`📊 Statistiques calculées en ${(endTime - startTime).toFixed(2)}ms`);

    return {
      totalItems,
      selectedItems,
      completionPercentage: totalItems > 0 ? ((selectedItems / totalItems) * 100).toFixed(1) : '0',
      preferenceStats: Object.fromEntries(preferenceStats),
      categoryStats: Object.fromEntries(categoryStats),
      calculationTime: endTime - startTime
    };
  }

  invalidateStatsCache() {
    this.statsCache = null;
    this.statsCacheTime = 0;
  }

  // ===== HISTORIQUE POUR UNDO/REDO =====
  
  saveToHistory(action, data) {
    if (this.history.length >= this.maxHistorySize) {
      this.history.shift(); // Supprimer le plus ancien
    }

    this.history.push({
      action,
      data,
      timestamp: Date.now(),
      preferencesSize: this.preferences.size
    });
  }

  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  // ===== MÉTHODES UTILITAIRES =====
  
  // Export optimisé pour la sérialisation
  serialize() {
    return {
      preferences: this.getAllPreferences(),
      isDetailedView: this.isDetailedView,
      currentChartType: this.currentChartType,
      timestamp: Date.now()
    };
  }

  // Import depuis sérialisation
  deserialize(data) {
    if (data.preferences) {
      this.importPreferences(data.preferences);
    }
    
    if (typeof data.isDetailedView === 'boolean') {
      this.isDetailedView = data.isDetailedView;
    }
    
    if (data.currentChartType) {
      this.currentChartType = data.currentChartType;
    }
  }

  // Statistiques de performance de l'état
  getPerformanceStats() {
    return {
      preferencesCount: this.preferences.size,
      listenersCount: Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0),
      historySize: this.history.length,
      cacheValid: this.statsCache !== null,
      cacheAge: Date.now() - this.statsCacheTime
    };
  }

  // Nettoyage pour éviter les fuites mémoire
  destroy() {
    // Nettoyer les listeners
    this.listeners.clear();
    
    // Nettoyer les timeouts
    if (this.notificationBatchTimeout) {
      clearTimeout(this.notificationBatchTimeout);
    }
    
    // Nettoyer le graphique
    if (this.currentChart && this.currentChart.destroy) {
      this.currentChart.destroy();
    }
    
    // Vider les caches
    this.preferences.clear();
    this.invalidateStatsCache();
    this.history = [];
    this.pendingNotifications.clear();
  }

  // ===== MÉTHODES DE DEBUG =====
  
  debug() {
    return {
      state: {
        preferences: this.getAllPreferences(),
        preferencesCount: this.preferences.size,
        isDetailedView: this.isDetailedView,
        currentChartType: this.currentChartType
      },
      performance: this.getPerformanceStats(),
      cache: {
        statsCache: !!this.statsCache,
        cacheAge: Date.now() - this.statsCacheTime,
        cacheDuration: this.CACHE_DURATION
      },
      listeners: Object.fromEntries(
        Array.from(this.listeners.entries()).map(([event, listeners]) => [
          event, 
          listeners.size
        ])
      ),
      history: this.history.map(h => ({
        action: h.action,
        timestamp: h.timestamp,
        preferencesSize: h.preferencesSize
      }))
    };
  }

  validate() {
    const issues = [];
    
    // Vérifier la cohérence des données
    if (this.preferences.size !== Object.keys(this.getAllPreferences()).length) {
      issues.push('Incohérence entre Map et Object des préférences');
    }
    
    // Vérifier les préférences invalides
    for (const [key, value] of this.preferences) {
      if (!this.isValidPreference(key, value)) {
        issues.push(`Préférence invalide: ${key} = ${value}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Instance singleton avec protection
let instance = null;

export function createAppState() {
  if (!instance) {
    instance = new AppState();
  }
  return instance;
}

// Export de l'instance par défaut
export const appState = createAppState();
export default appState;

// Export de la classe pour les tests
export { AppState };