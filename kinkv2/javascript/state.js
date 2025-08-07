// state.js - Gestionnaire d'état centralisé
import { CONFIG } from './config.js';

class AppState {
  constructor() {
    this.preferences = {};
    this.kinkData = null;
    this.isDetailedView = false;
    this.listeners = new Map();
    this.currentChart = null;
    this.currentChartType = 'doughnut';
  }

  // Gestion des préférences
  updatePreference(itemName, newState) {
    const oldState = this.preferences[itemName];
    
    if (newState === 'none' || !newState) {
      delete this.preferences[itemName];
    } else {
      this.preferences[itemName] = newState;
    }

    this.notifyListeners('preferenceChanged', {
      itemName,
      oldState,
      newState,
      allPreferences: { ...this.preferences }
    });
  }

  getPreference(itemName) {
    return this.preferences[itemName] || 'none';
  }

  getAllPreferences() {
    return { ...this.preferences };
  }

  clearAllPreferences() {
    this.preferences = {};
    this.notifyListeners('allPreferencesCleared');
  }

  importPreferences(newPreferences) {
    if (!newPreferences || typeof newPreferences !== 'object') {
      throw new Error('Préférences invalides');
    }

    // Valider les préférences
    const validPreferences = {};
    Object.entries(newPreferences).forEach(([key, value]) => {
      if (typeof key === 'string' && CONFIG.VALIDATION.VALID_PREFERENCE_STATES.includes(value)) {
        validPreferences[key] = value;
      }
    });

    this.preferences = validPreferences;
    this.notifyListeners('preferencesImported', { preferences: validPreferences });
  }

  // Gestion des données
  setKinkData(data) {
    this.kinkData = data;
    this.notifyListeners('dataLoaded', { data });
  }

  getKinkData() {
    return this.kinkData;
  }

  // Gestion des vues
  toggleDetailedView() {
    this.isDetailedView = !this.isDetailedView;
    this.notifyListeners('viewToggled', { isDetailed: this.isDetailedView });
  }

  setDetailedView(isDetailed) {
    this.isDetailedView = isDetailed;
    this.notifyListeners('viewToggled', { isDetailed: this.isDetailedView });
  }

  // Gestion des graphiques
  setCurrentChart(chart, type = 'doughnut') {
    if (this.currentChart) {
      this.currentChart.destroy();
    }
    this.currentChart = chart;
    this.currentChartType = type;
  }

  getCurrentChart() {
    return this.currentChart;
  }

  // Système d'événements
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Retourner une fonction pour supprimer le listener
    return () => {
      this.removeListener(event, callback);
    };
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data = {}) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur dans le listener ${event}:`, error);
        }
      });
    }
  }

  // Statistiques calculées
  getStats() {
    if (!this.kinkData) return null;

    // Compter le total d'items
    let totalItems = 0;
    this.kinkData.categories.forEach(category => {
      if (category.hasSubcategories && category.subcategories) {
        category.subcategories.forEach(subcat => {
          totalItems += subcat.items ? subcat.items.length : 0;
        });
      } else if (category.items) {
        totalItems += category.items.length;
      }
    });

    const selectedItems = Object.keys(this.preferences).length;

    // Statistiques par type de préférence
    const stats = {};
    this.kinkData.preferenceTypes.forEach(type => {
      stats[type.id] = {
        count: 0,
        percentage: 0,
        name: type.name,
        color: type.color
      };
    });

    // Compter les préférences
    Object.values(this.preferences).forEach(pref => {
      if (stats[pref]) {
        stats[pref].count++;
      }
    });

    // Calculer les pourcentages
    if (selectedItems > 0) {
      Object.keys(stats).forEach(key => {
        stats[key].percentage = ((stats[key].count / selectedItems) * 100).toFixed(1);
      });
    }

    // Statistiques par catégorie
    const categoryStats = {};
    this.kinkData.categories.forEach(category => {
      categoryStats[category.id] = {
        name: category.name,
        selected: 0,
        total: 0,
        percentage: 0
      };

      if (category.hasSubcategories && category.subcategories) {
        category.subcategories.forEach(subcat => {
          if (subcat.items) {
            categoryStats[category.id].total += subcat.items.length;
            subcat.items.forEach(item => {
              const itemName = typeof item === 'string' ? item : item.name;
              if (this.preferences[itemName]) {
                categoryStats[category.id].selected++;
              }
            });
          }
        });
      } else if (category.items) {
        categoryStats[category.id].total = category.items.length;
        category.items.forEach(item => {
          const itemName = typeof item === 'string' ? item : item.name;
          if (this.preferences[itemName]) {
            categoryStats[category.id].selected++;
          }
        });
      }

      if (categoryStats[category.id].total > 0) {
        categoryStats[category.id].percentage = 
          ((categoryStats[category.id].selected / categoryStats[category.id].total) * 100).toFixed(1);
      }
    });

    return {
      totalItems,
      selectedItems,
      completionPercentage: ((selectedItems / totalItems) * 100).toFixed(1),
      preferenceStats: stats,
      categoryStats
    };
  }
}

// Instance singleton
export const appState = new AppState();
export default appState;