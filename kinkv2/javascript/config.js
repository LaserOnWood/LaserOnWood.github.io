// config.js - Configuration centralisée
export const CONFIG = {
    // Stockage
    STORAGE_KEYS: {
      PREFERENCES: 'kink_preferences',
      SETTINGS: 'kink_settings'
    },
  
    // Interface utilisateur
    UI: {
      ANIMATION_DURATION: 300,
      TOAST_DURATION: 4000,
      CHART_HEIGHT: 300,
      MOBILE_BREAKPOINT: 768
    },
  
    // Validation
    VALIDATION: {
      MAX_FILE_SIZE: 1024 * 1024, // 1MB
      ALLOWED_EXTENSIONS: ['.json'],
      VALID_PREFERENCE_STATES: ['adore', 'aime', 'curiosité', 'dislike', 'non_strict']
    },
  
    // Chemins
    PATHS: {
      DATA_FILE: 'json/kink-data.json'
    },
  
    // Messages
    MESSAGES: {
      LOADING_ERROR: 'Erreur lors du chargement des données',
      IMPORT_SUCCESS: 'Préférences importées avec succès !',
      IMPORT_ERROR: 'Erreur lors de l\'importation',
      EXPORT_SUCCESS: 'Préférences exportées avec succès !',
      EXPORT_ERROR: 'Erreur lors de l\'exportation',
      INVALID_FILE: 'Fichier invalide',
      NO_PREFERENCES: 'Aucune préférence sélectionnée'
    }
  };
  
  // Types de préférences avec leurs couleurs par défaut
  export const PREFERENCE_TYPES = {
    adore: {
      name: "J'adore",
      color: "linear-gradient(135deg, #7d2e79, #7a3077)"
    },
    aime: {
      name: "J'aime", 
      color: "linear-gradient(135deg, #4CAF50, #45a049)"
    },
    curiosité: {
      name: "Curieux",
      color: "linear-gradient(135deg, #FF9800, #f57c00)"
    },
    dislike: {
      name: "Peu intéressé",
      color: "linear-gradient(135deg, #FF5722, #d84315)"
    },
    non_strict: {
      name: "Non Strict",
      color: "linear-gradient(135deg, #f44336, #d32f2f)"
    }
  };