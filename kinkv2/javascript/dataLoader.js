// dataLoader.js - Chargement et validation des données
import { CONFIG } from './config.js';
import appState from './state.js';

export class DataLoader {
  static async loadKinkData() {
    try {
      const response = await fetch(CONFIG.PATHS.DATA_FILE);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validation basique des données
      if (!DataLoader.validateKinkData(data)) {
        throw new Error('Données invalides dans le fichier JSON');
      }

      console.log('Données chargées avec succès:', data);
      appState.setKinkData(data);
      
      return data;
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      throw new Error(CONFIG.MESSAGES.LOADING_ERROR);
    }
  }

  static validateKinkData(data) {
    if (!data || typeof data !== 'object') {
      console.error('Données manquantes ou invalides');
      return false;
    }

    if (!Array.isArray(data.categories)) {
      console.error('Propriété categories manquante ou invalide');
      return false;
    }

    if (!Array.isArray(data.preferenceTypes)) {
      console.error('Propriété preferenceTypes manquante ou invalide');
      return false;
    }

    // Validation des catégories
    for (const category of data.categories) {
      if (!category.id || !category.name || !category.icon) {
        console.error('Catégorie invalide:', category);
        return false;
      }

      // Vérifier les items ou sous-catégories
      if (category.hasSubcategories) {
        if (!Array.isArray(category.subcategories)) {
          console.error('Sous-catégories manquantes pour:', category.id);
          return false;
        }
      } else if (!Array.isArray(category.items)) {
        console.error('Items manquants pour la catégorie:', category.id);
        return false;
      }
    }

    // Validation des types de préférences
    for (const prefType of data.preferenceTypes) {
      if (!prefType.id || !prefType.name || !prefType.color) {
        console.error('Type de préférence invalide:', prefType);
        return false;
      }
    }

    return true;
  }

  static validateImportFile(file) {
    if (!file) {
      throw new Error('Aucun fichier sélectionné');
    }

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      throw new Error('Veuillez sélectionner un fichier JSON valide');
    }

    if (file.size > CONFIG.VALIDATION.MAX_FILE_SIZE) {
      throw new Error('Fichier trop volumineux (maximum 1MB)');
    }

    return true;
  }

  static async importPreferences(file) {
    try {
      DataLoader.validateImportFile(file);

      const fileContent = await DataLoader.readFileAsText(file);
      const data = JSON.parse(fileContent);

      if (!data || typeof data !== 'object') {
        throw new Error('Fichier JSON invalide');
      }

      if (!data.preferences || typeof data.preferences !== 'object') {
        throw new Error('Fichier invalide : aucune préférence trouvée');
      }

      // Importer dans l'état global
      appState.importPreferences(data.preferences);

      return {
        success: true,
        count: Object.keys(data.preferences).length,
        message: `${CONFIG.MESSAGES.IMPORT_SUCCESS} (${Object.keys(data.preferences).length} éléments)`
      };

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      return {
        success: false,
        message: error.message || CONFIG.MESSAGES.IMPORT_ERROR
      };
    }
  }

  static readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      
      reader.readAsText(file);
    });
  }

  static exportPreferences() {
    try {
      const preferences = appState.getAllPreferences();
      const selectedCount = Object.keys(preferences).length;

      if (selectedCount === 0) {
        return {
          success: false,
          message: CONFIG.MESSAGES.NO_PREFERENCES
        };
      }

      const stats = appState.getStats();
      const exportData = {
        timestamp: new Date().toISOString(),
        version: '2.0',
        totalSelected: selectedCount,
        preferences: preferences,
        summary: stats ? stats.preferenceStats : {}
      };

      // Créer et télécharger le fichier
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      
      const date = new Date().toISOString().split('T')[0];
      link.download = `Mes_preferences_${date}.json`;

      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Nettoyer l'URL
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 100);

      return {
        success: true,
        count: selectedCount,
        message: `${selectedCount} ${CONFIG.MESSAGES.EXPORT_SUCCESS}`
      };

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      return {
        success: false,
        message: CONFIG.MESSAGES.EXPORT_ERROR
      };
    }
  }
}