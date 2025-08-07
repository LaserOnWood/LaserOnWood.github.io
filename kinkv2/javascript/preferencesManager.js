// preferencesManager.js - Gestion des préférences utilisateur
import appState from './state.js';
import { CONFIG } from './config.js';

export class PreferencesManager {
  constructor() {
    this.validStates = ['none', ...CONFIG.VALIDATION.VALID_PREFERENCE_STATES];
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Délégation d'événements pour les clics sur les items
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    // Écouter les changements d'état pour mettre à jour l'UI
    appState.addListener('preferenceChanged', this.onPreferenceChanged.bind(this));
    appState.addListener('preferencesImported', this.onPreferencesImported.bind(this));
    appState.addListener('allPreferencesCleared', this.onAllPreferencesCleared.bind(this));
  }

  handleDocumentClick(e) {
    const item = e.target.closest('.item');
    if (item) {
      this.handleItemClick(item);
    }
  }

  handleItemClick(item) {
    const itemName = item.dataset.item;
    if (!itemName) return;

    const currentState = appState.getPreference(itemName);
    const newState = this.getNextState(currentState);

    // Mettre à jour l'état global
    appState.updatePreference(itemName, newState);
  }

  getNextState(currentState) {
    const currentIndex = this.validStates.indexOf(currentState);
    return this.validStates[(currentIndex + 1) % this.validStates.length];
  }

  onPreferenceChanged({ itemName, newState }) {
    this.updateItemUI(itemName, newState);
  }

  onPreferencesImported() {
    this.updateAllItemsUI();
  }

  onAllPreferencesCleared() {
    this.clearAllItemsUI();
  }

  updateItemUI(itemName, newState) {
    const item = document.querySelector(`[data-item="${itemName}"]`);
    if (!item) return;

    // Nettoyer les anciennes classes d'état
    CONFIG.VALIDATION.VALID_PREFERENCE_STATES.forEach(cls => {
      item.classList.remove(cls);
    });

    // Ajouter la nouvelle classe si nécessaire
    if (newState && newState !== 'none') {
      item.classList.add(newState);
    }
  }

  updateAllItemsUI() {
    const preferences = appState.getAllPreferences();
    
    document.querySelectorAll('.item').forEach(item => {
      const itemName = item.dataset.item;
      const preference = preferences[itemName] || 'none';
      this.updateItemUI(itemName, preference);
    });
  }

  clearAllItemsUI() {
    document.querySelectorAll('.item').forEach(item => {
      CONFIG.VALIDATION.VALID_PREFERENCE_STATES.forEach(cls => {
        item.classList.remove(cls);
      });
    });
  }

  // Méthodes utilitaires
  getPreferenceCount(preferenceType) {
    const preferences = appState.getAllPreferences();
    return Object.values(preferences).filter(pref => pref === preferenceType).length;
  }

  getTotalSelectedCount() {
    return Object.keys(appState.getAllPreferences()).length;
  }

  exportPreferences() {
    return appState.getAllPreferences();
  }

  importPreferences(preferences) {
    try {
      appState.importPreferences(preferences);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  clearAllPreferences() {
    appState.clearAllPreferences();
  }

  getPreferenceStateName(preferenceId) {
    const kinkData = appState.getKinkData();
    if (!kinkData) return preferenceId;

    const prefType = kinkData.preferenceTypes.find(type => type.id === preferenceId);
    return prefType ? prefType.name : preferenceId;
  }
}