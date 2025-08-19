/**
 * Module de gestion des préférences pour l'application de gestion des préférences Kink
 */
import { CONFIG } from './config.js';

/**
 * Classe responsable de la gestion des préférences utilisateur
 */
export class PreferencesManager {
    constructor() {
        this.preferences = new Map();
    }

    /**
     * Obtenir l'état d'une préférence
     * @param {string} itemName - Nom de l'item
     * @returns {string} État de la préférence
     */
    getPreference(itemName) {
        return this.preferences.get(itemName) || 'none';
    }

    /**
     * Définir l'état d'une préférence
     * @param {string} itemName - Nom de l'item
     * @param {string} state - Nouvel état
     */
    setPreference(itemName, state) {
        if (state === 'none') {
            this.preferences.delete(itemName);
        } else {
            this.preferences.set(itemName, state);
        }
    }

    /**
     * Obtenir le prochain état dans le cycle
     * @param {string} currentState - État actuel
     * @returns {string} Prochain état
     */
    getNextState(currentState) {
        const currentIndex = CONFIG.preferenceStates.indexOf(currentState);
        const nextIndex = (currentIndex + 1) % CONFIG.preferenceStates.length;
        return CONFIG.preferenceStates[nextIndex];
    }

    /**
     * Réinitialiser toutes les préférences
     */
    resetAllPreferences() {
        this.preferences.clear();
    }

    /**
     * Appliquer des préférences importées
     * @param {Map} validPreferences - Préférences validées
     */
    applyImportedPreferences(validPreferences) {
        this.preferences = validPreferences;
    }

    /**
     * Générer les données d'export
     * @param {Array} preferenceTypes - Types de préférences disponibles
     * @returns {Object} Données d'export
     */
    generateExportData(preferenceTypes) {
        const preferences = Object.fromEntries(this.preferences);
        const selectedCount = this.preferences.size;

        const summary = {};
        if (preferenceTypes) {
            preferenceTypes.forEach(type => {
                summary[type.id] = Array.from(this.preferences.values()).filter(v => v === type.id).length;
            });
        }

        return {
            timestamp: new Date().toISOString(),
            totalSelected: selectedCount,
            preferences: preferences,
            summary: summary
        };
    }

    /**
     * Obtenir le nombre total de préférences sélectionnées
     * @returns {number} Nombre de préférences
     */
    getSelectedCount() {
        return this.preferences.size;
    }

    /**
     * Obtenir toutes les préférences
     * @returns {Map} Map des préférences
     */
    getAllPreferences() {
        return new Map(this.preferences);
    }
}

