/**
 * Module de gestion des préférences pour l'application de gestion des préférences Kink
 * Version mise à jour avec support IndexedDB
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

    /**
     * Sauvegarder dans IndexedDB
     * @param {IndexedDBManager} dbManager - Gestionnaire IndexedDB
     * @returns {Promise<boolean>}
     */
    async saveToIndexedDB(dbManager) {
        if (!dbManager) {
            console.warn('⚠️ Pas de gestionnaire IndexedDB disponible');
            return false;
        }

        try {
            const prefsObject = Object.fromEntries(this.preferences);
            await dbManager.savePreferences(prefsObject);
            console.log('✅ Préférences sauvegardées dans IndexedDB');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde dans IndexedDB:', error);
            return false;
        }
    }

    /**
     * Charger depuis IndexedDB
     * @param {IndexedDBManager} dbManager - Gestionnaire IndexedDB
     * @returns {Promise<boolean>}
     */
    async loadFromIndexedDB(dbManager) {
        if (!dbManager) {
            console.warn('⚠️ Pas de gestionnaire IndexedDB disponible');
            return false;
        }

        try {
            const prefsObject = await dbManager.loadPreferences();
            
            if (prefsObject) {
                this.preferences = new Map(Object.entries(prefsObject));
                console.log(`✅ ${this.preferences.size} préférences chargées depuis IndexedDB`);
                return true;
            } else {
                console.log('ℹ️ Aucune préférence trouvée dans IndexedDB');
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement depuis IndexedDB:', error);
            return false;
        }
    }

    /**
     * Sauvegarder dans localStorage (fallback)
     */
    saveToLocalStorage() {
        try {
            const prefsObject = Object.fromEntries(this.preferences);
            localStorage.setItem('kinkv2_preferences', JSON.stringify(prefsObject));
            console.log('✅ Préférences sauvegardées dans localStorage (fallback)');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde dans localStorage:', error);
            return false;
        }
    }

    /**
     * Charger depuis localStorage (fallback)
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('kinkv2_preferences');
            if (stored) {
                const prefsObject = JSON.parse(stored);
                this.preferences = new Map(Object.entries(prefsObject));
                console.log(`✅ ${this.preferences.size} préférences chargées depuis localStorage`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Erreur lors du chargement depuis localStorage:', error);
            return false;
        }
    }

    /**
     * Sauvegarde automatique (utilise IndexedDB si disponible, sinon localStorage)
     * @param {IndexedDBManager} dbManager - Gestionnaire IndexedDB (optionnel)
     * @returns {Promise<boolean>}
     */
    async autoSave(dbManager = null) {
        if (dbManager) {
            const success = await this.saveToIndexedDB(dbManager);
            if (success) return true;
        }
        
        // Fallback vers localStorage
        return this.saveToLocalStorage();
    }

    /**
     * Chargement automatique (essaie IndexedDB puis localStorage)
     * @param {IndexedDBManager} dbManager - Gestionnaire IndexedDB (optionnel)
     * @returns {Promise<boolean>}
     */
    async autoLoad(dbManager = null) {
        if (dbManager) {
            const success = await this.loadFromIndexedDB(dbManager);
            if (success) return true;
        }
        
        // Fallback vers localStorage
        return this.loadFromLocalStorage();
    }

    /**
     * Obtenir des statistiques sur les préférences
     * @returns {Object}
     */
    getStatistics() {
        const stats = {
            total: this.preferences.size,
            byType: {}
        };

        // Compter par type
        this.preferences.forEach(type => {
            if (!stats.byType[type]) {
                stats.byType[type] = 0;
            }
            stats.byType[type]++;
        });

        return stats;
    }

    /**
     * Filtrer les préférences par type
     * @param {string} type - Type de préférence
     * @returns {Array} Items avec ce type
     */
    getPreferencesByType(type) {
        const items = [];
        this.preferences.forEach((value, key) => {
            if (value === type) {
                items.push(key);
            }
        });
        return items;
    }

    /**
     * Vérifier si un item a une préférence définie
     * @param {string} itemName - Nom de l'item
     * @returns {boolean}
     */
    hasPreference(itemName) {
        return this.preferences.has(itemName);
    }

    /**
     * Supprimer une préférence spécifique
     * @param {string} itemName - Nom de l'item
     * @returns {boolean}
     */
    removePreference(itemName) {
        return this.preferences.delete(itemName);
    }

    /**
     * Importer des préférences en fusionnant avec les existantes
     * @param {Map|Object} newPreferences - Nouvelles préférences
     * @param {boolean} overwrite - Écraser les préférences existantes
     */
    mergePreferences(newPreferences, overwrite = false) {
        const prefsToMerge = newPreferences instanceof Map 
            ? newPreferences 
            : new Map(Object.entries(newPreferences));

        prefsToMerge.forEach((value, key) => {
            if (overwrite || !this.preferences.has(key)) {
                this.preferences.set(key, value);
            }
        });
    }

    /**
     * Exporter uniquement les préférences d'une catégorie
     * @param {string} categoryId - ID de la catégorie
     * @param {Array} categoryItems - Items de la catégorie
     * @returns {Object}
     */
    exportCategoryPreferences(categoryId, categoryItems) {
        const categoryPrefs = {};
        
        categoryItems.forEach(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            if (this.preferences.has(itemName)) {
                categoryPrefs[itemName] = this.preferences.get(itemName);
            }
        });

        return {
            categoryId,
            timestamp: new Date().toISOString(),
            preferences: categoryPrefs,
            count: Object.keys(categoryPrefs).length
        };
    }
}