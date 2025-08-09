// dataLoader.js - Chargement optimisé avec cache et validation robuste
import { CONFIG } from './config.js';
import appState from './state.js';

export class DataLoader {
  // Cache statique pour éviter les rechargements
  static cache = new Map();
  static loadPromises = new Map();

  static async loadKinkData(forceReload = false) {
    const cacheKey = CONFIG.PATHS.DATA_FILE;
    
    // Éviter les chargements multiples simultanés
    if (DataLoader.loadPromises.has(cacheKey)) {
      return DataLoader.loadPromises.get(cacheKey);
    }

    // Utiliser le cache si disponible et pas de rechargement forcé
    if (!forceReload && DataLoader.cache.has(cacheKey)) {
      const cachedData = DataLoader.cache.get(cacheKey);
      console.log('📦 Données chargées depuis le cache');
      appState.setKinkData(cachedData);
      return cachedData;
    }

    // Créer la promesse de chargement
    const loadPromise = DataLoader.performDataLoad(cacheKey);
    DataLoader.loadPromises.set(cacheKey, loadPromise);

    try {
      const data = await loadPromise;
      return data;
    } finally {
      // Nettoyer la promise de chargement
      DataLoader.loadPromises.delete(cacheKey);
    }
  }

  static async performDataLoad(cacheKey) {
    const startTime = performance.now();
    
    try {
      console.log('📊 Chargement des données depuis:', cacheKey);

      // Fetch avec timeout et retry
      const data = await DataLoader.fetchWithRetry(cacheKey);
      
      // Validation approfondie
      const validationResult = DataLoader.validateKinkData(data);
      if (!validationResult.isValid) {
        throw new Error(`Validation échouée: ${validationResult.errors.join(', ')}`);
      }

      // Optimiser les données avant mise en cache
      const optimizedData = DataLoader.optimizeData(data);
      
      // Mettre en cache
      DataLoader.cache.set(cacheKey, optimizedData);
      
      // Mettre à jour l'état
      appState.setKinkData(optimizedData);

      const loadTime = performance.now() - startTime;
      console.log(`✅ Données chargées et validées en ${loadTime.toFixed(2)}ms`);
      
      return optimizedData;
      
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      
      // Tentative de récupération depuis le cache si erreur réseau
      if (DataLoader.cache.has(cacheKey)) {
        console.warn('⚠️ Utilisation des données en cache suite à l\'erreur');
        return DataLoader.cache.get(cacheKey);
      }
      
      throw new Error(`${CONFIG.MESSAGES.LOADING_ERROR}: ${error.message}`);
    }
  }

  static async fetchWithRetry(url, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${maxRetries} de chargement`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-cache', // Force fresh data
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Tentative ${attempt} échouée:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1); // Backoff exponentiel
          console.log(`⏳ Nouvelle tentative dans ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  static validateKinkData(data) {
    const errors = [];
    const warnings = [];

    try {
      // Validation de base
      if (!data || typeof data !== 'object') {
        errors.push('Données manquantes ou format invalide');
        return { isValid: false, errors, warnings };
      }

      // Validation des propriétés requises
      const requiredProps = ['categories', 'preferenceTypes'];
      for (const prop of requiredProps) {
        if (!data[prop]) {
          errors.push(`Propriété '${prop}' manquante`);
        } else if (!Array.isArray(data[prop])) {
          errors.push(`Propriété '${prop}' doit être un tableau`);
        }
      }

      // Validation des catégories
      if (data.categories) {
        data.categories.forEach((category, index) => {
          const categoryPath = `categories[${index}]`;
          
          if (!DataLoader.validateCategory(category, categoryPath, errors, warnings)) {
            errors.push(`Catégorie ${index} invalide`);
          }
        });
      }

      // Validation des types de préférences
      if (data.preferenceTypes) {
        const seenIds = new Set();
        data.preferenceTypes.forEach((prefType, index) => {
          const result = DataLoader.validatePreferenceType(prefType, index, seenIds);
          errors.push(...result.errors);
          warnings.push(...result.warnings);
        });
      }

      // Validation de cohérence
      DataLoader.validateDataConsistency(data, errors, warnings);

    } catch (error) {
      errors.push(`Erreur de validation: ${error.message}`);
    }

    // Log des warnings
    if (warnings.length > 0) {
      console.warn('⚠️ Warnings de validation:', warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: DataLoader.getDataStats(data)
    };
  }

  static validateCategory(category, path, errors, warnings) {
    if (!category || typeof category !== 'object') {
      errors.push(`${path}: objet catégorie manquant`);
      return false;
    }

    // Propriétés requises
    const required = ['id', 'name', 'icon'];
    for (const prop of required) {
      if (!category[prop] || typeof category[prop] !== 'string') {
        errors.push(`${path}.${prop}: propriété manquante ou invalide`);
        return false;
      }
    }

    // Validation de l'ID (pas d'espaces, caractères spéciaux limités)
    if (!/^[a-zA-Z0-9_-]+$/.test(category.id)) {
      errors.push(`${path}.id: caractères invalides dans l'ID`);
    }

    // Validation des items ou sous-catégories
    if (category.hasSubcategories) {
      if (!Array.isArray(category.subcategories)) {
        errors.push(`${path}: sous-catégories attendues mais manquantes`);
        return false;
      }
      
      // Valider chaque sous-catégorie
      category.subcategories.forEach((subcat, subIndex) => {
        DataLoader.validateCategory(subcat, `${path}.subcategories[${subIndex}]`, errors, warnings);
      });
    } else {
      if (!Array.isArray(category.items)) {
        errors.push(`${path}: items attendus mais manquants`);
        return false;
      }
      
      // Valider les items
      DataLoader.validateItems(category.items, `${path}.items`, errors, warnings);
    }

    return true;
  }

  static validateItems(items, path, errors, warnings) {
    if (!Array.isArray(items)) {
      errors.push(`${path}: doit être un tableau`);
      return;
    }

    const seenNames = new Set();
    items.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      
      if (typeof item === 'string') {
        // Item simple
        if (!item.trim()) {
          errors.push(`${itemPath}: nom vide`);
          return;
        }
        
        if (seenNames.has(item)) {
          warnings.push(`${itemPath}: nom dupliqué '${item}'`);
        }
        seenNames.add(item);
        
      } else if (typeof item === 'object' && item !== null) {
        // Item avec description
        if (!item.name || typeof item.name !== 'string') {
          errors.push(`${itemPath}.name: nom manquant ou invalide`);
          return;
        }
        
        if (item.description && typeof item.description !== 'string') {
          warnings.push(`${itemPath}.description: description non-string`);
        }
        
        if (seenNames.has(item.name)) {
          warnings.push(`${itemPath}: nom dupliqué '${item.name}'`);
        }
        seenNames.add(item.name);
        
      } else {
        errors.push(`${itemPath}: format invalide`);
      }
    });
  }

  static validatePreferenceType(prefType, index, seenIds) {
    const errors = [];
    const warnings = [];
    const path = `preferenceTypes[${index}]`;

    if (!prefType || typeof prefType !== 'object') {
      errors.push(`${path}: objet manquant`);
      return { errors, warnings };
    }

    // Propriétés requises
    const required = ['id', 'name', 'color'];
    for (const prop of required) {
      if (!prefType[prop] || typeof prefType[prop] !== 'string') {
        errors.push(`${path}.${prop}: propriété manquante ou invalide`);
      }
    }

    // Validation de l'ID unique
    if (prefType.id) {
      if (seenIds.has(prefType.id)) {
        errors.push(`${path}.id: ID dupliqué '${prefType.id}'`);
      }
      seenIds.add(prefType.id);

      // Vérifier que l'ID est dans les états valides
      if (!CONFIG.VALIDATION.VALID_PREFERENCE_STATES.includes(prefType.id)) {
        warnings.push(`${path}.id: ID '${prefType.id}' non reconnu dans la config`);
      }
    }

    // Validation basique de la couleur
    if (prefType.color && !prefType.color.includes('gradient') && !prefType.color.startsWith('#')) {
      warnings.push(`${path}.color: format de couleur potentiellement invalide`);
    }

    return { errors, warnings };
  }

  static validateDataConsistency(data, errors, warnings) {
    // Vérifier que tous les états de préférence ont un type correspondant
    const preferenceTypeIds = new Set(data.preferenceTypes.map(pt => pt.id));
    const requiredStates = new Set(CONFIG.VALIDATION.VALID_PREFERENCE_STATES);

    for (const state of requiredStates) {
      if (!preferenceTypeIds.has(state)) {
        warnings.push(`Type de préférence manquant pour l'état: ${state}`);
      }
    }

    // Vérifier les IDs de catégories uniques
    const categoryIds = new Set();
    const collectCategoryIds = (categories) => {
      categories.forEach(cat => {
        if (categoryIds.has(cat.id)) {
          errors.push(`ID de catégorie dupliqué: ${cat.id}`);
        }
        categoryIds.add(cat.id);

        if (cat.subcategories) {
          collectCategoryIds(cat.subcategories);
        }
      });
    };

    if (data.categories) {
      collectCategoryIds(data.categories);
    }
  }

  static getDataStats(data) {
    if (!data) return null;

    let totalItems = 0;
    let totalCategories = 0;
    let totalSubcategories = 0;

    const countItems = (categories) => {
      categories.forEach(cat => {
        totalCategories++;
        
        if (cat.hasSubcategories && cat.subcategories) {
          totalSubcategories += cat.subcategories.length;
          countItems(cat.subcategories);
        } else if (cat.items) {
          totalItems += cat.items.length;
        }
      });
    };

    if (data.categories) {
      countItems(data.categories);
    }

    return {
      totalItems,
      totalCategories,
      totalSubcategories,
      preferenceTypes: data.preferenceTypes?.length || 0,
      estimatedSize: JSON.stringify(data).length
    };
  }

  static optimizeData(data) {
    // Créer une copie pour éviter les modifications de l'original
    const optimized = JSON.parse(JSON.stringify(data));

    // Optimiser les chaînes (trim, normalisation)
    const optimizeStrings = (obj) => {
      if (typeof obj === 'string') {
        return obj.trim();
      } else if (Array.isArray(obj)) {
        return obj.map(optimizeStrings);
      } else if (obj && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = optimizeStrings(value);
        }
        return result;
      }
      return obj;
    };

    // Ajouter des index pour la performance
    const addIndexes = (categories, parentPath = '') => {
      categories.forEach((cat, index) => {
        cat._index = index;
        cat._path = parentPath ? `${parentPath}.${cat.id}` : cat.id;
        
        if (cat.subcategories) {
          addIndexes(cat.subcategories, cat._path);
        }
      });
    };

    if (optimized.categories) {
      addIndexes(optimized.categories);
    }

    // Pré-calculer des maps pour la recherche rapide
    optimized._categoryMap = new Map();
    optimized._itemMap = new Map();

    const buildMaps = (categories) => {
      categories.forEach(cat => {
        optimized._categoryMap.set(cat.id, cat);
        
        if (cat.items) {
          cat.items.forEach(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            optimized._itemMap.set(itemName, {
              item,
              category: cat,
              categoryId: cat.id
            });
          });
        }
        
        if (cat.subcategories) {
          buildMaps(cat.subcategories);
        }
      });
    };

    if (optimized.categories) {
      buildMaps(optimized.categories);
    }

    return optimizeStrings(optimized);
  }

  // ===== IMPORT/EXPORT OPTIMISÉ =====

  static validateImportFile(file) {
    const errors = [];

    if (!file) {
      errors.push('Aucun fichier sélectionné');
    } else {
      // Validation du type
      const validTypes = ['application/json', 'text/json'];
      const hasValidType = validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.json');
      
      if (!hasValidType) {
        errors.push('Format de fichier invalide. Seuls les fichiers JSON sont acceptés.');
      }

      // Validation de la taille
      if (file.size > CONFIG.VALIDATION.MAX_FILE_SIZE) {
        const maxSizeMB = CONFIG.VALIDATION.MAX_FILE_SIZE / (1024 * 1024);
        errors.push(`Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB`);
      }

      if (file.size === 0) {
        errors.push('Le fichier est vide');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async importPreferences(file) {
    const startTime = performance.now();
    
    try {
      // Validation du fichier
      const fileValidation = DataLoader.validateImportFile(file);
      if (!fileValidation.isValid) {
        throw new Error(fileValidation.errors.join(', '));
      }

      console.log(`📥 Import du fichier: ${file.name} (${file.size} bytes)`);

      // Lecture du fichier avec timeout
      const fileContent = await DataLoader.readFileWithTimeout(file, 10000);
      
      // Parse JSON avec gestion d'erreur détaillée
      let data;
      try {
        data = JSON.parse(fileContent);
      } catch (jsonError) {
        throw new Error(`Format JSON invalide: ${jsonError.message}`);
      }

      // Validation de la structure
      const structureValidation = DataLoader.validateImportStructure(data);
      if (!structureValidation.isValid) {
        throw new Error(structureValidation.errors.join(', '));
      }

      // Nettoyage et validation des préférences
      const cleanPreferences = DataLoader.cleanImportedPreferences(data.preferences);
      
      // Import dans l'état
      const importedCount = appState.importPreferences(cleanPreferences);

      const duration = performance.now() - startTime;
      console.log(`✅ Import terminé en ${duration.toFixed(2)}ms`);

      return {
        success: true,
        count: importedCount,
        message: `${importedCount} préférence(s) importée(s) avec succès`,
        metadata: data.timestamp ? { 
          exportDate: new Date(data.timestamp).toLocaleString() 
        } : null
      };

    } catch (error) {
      console.error('❌ Erreur import:', error);
      return {
        success: false,
        message: error.message || CONFIG.MESSAGES.IMPORT_ERROR,
        error: error.message
      };
    }
  }

  static readFileWithTimeout(file, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      let resolved = false;

      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Timeout lors de la lecture du fichier'));
        }
      }, timeout);

      reader.onload = (e) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(e.target.result);
        }
      };

      reader.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          reject(new Error('Erreur lors de la lecture du fichier'));
        }
      };

      reader.readAsText(file);
    });
  }

  static validateImportStructure(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      errors.push('Structure de données invalide');
      return { isValid: false, errors };
    }

    if (!data.preferences || typeof data.preferences !== 'object') {
      errors.push('Section "preferences" manquante ou invalide');
    }

    // Validation optionnelle de la version
    if (data.version && typeof data.version !== 'string') {
      errors.push('Version invalide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static cleanImportedPreferences(preferences) {
    const cleaned = {};
    let cleanedCount = 0;

    for (const [key, value] of Object.entries(preferences)) {
      // Validation de la clé
      if (typeof key === 'string' && key.trim().length > 0) {
        const cleanKey = key.trim();
        
        // Validation de la valeur
        if (CONFIG.VALIDATION.VALID_PREFERENCE_STATES.includes(value)) {
          cleaned[cleanKey] = value;
          cleanedCount++;
        } else {
          console.warn(`Préférence ignorée: ${key} = ${value} (valeur invalide)`);
        }
      } else {
        console.warn(`Préférence ignorée: clé invalide "${key}"`);
      }
    }

    console.log(`🧹 ${cleanedCount} préférences nettoyées sur ${Object.keys(preferences).length}`);
    return cleaned;
  }

  static exportPreferences() {
    const startTime = performance.now();
    
    try {
      const preferences = appState.getAllPreferences();
      const selectedCount = Object.keys(preferences).length;

      if (selectedCount === 0) {
        return {
          success: false,
          message: CONFIG.MESSAGES.NO_PREFERENCES,
          count: 0
        };
      }

      const stats = appState.getStats();
      const timestamp = new Date().toISOString();
      
      const exportData = {
        version: '2.1',
        timestamp,
        generator: 'KinkList Optimized',
        totalSelected: selectedCount,
        preferences,
        summary: stats ? {
          completion: stats.completionPercentage,
          breakdown: stats.preferenceStats
        } : {},
        metadata: {
          exportDate: new Date().toLocaleString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };

      // Génération du fichier optimisée
      const result = DataLoader.generateDownloadFile(exportData, timestamp);
      
      const duration = performance.now() - startTime;
      console.log(`📤 Export généré en ${duration.toFixed(2)}ms`);

      return {
        success: true,
        count: selectedCount,
        message: `${selectedCount} préférence(s) exportée(s)`,
        filename: result.filename,
        size: result.size
      };

    } catch (error) {
      console.error('❌ Erreur export:', error);
      return {
        success: false,
        message: CONFIG.MESSAGES.EXPORT_ERROR,
        error: error.message
      };
    }
  }

  static generateDownloadFile(exportData, timestamp) {
    // JSON formaté pour lisibilité
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { 
      type: 'application/json;charset=utf-8' 
    });

    // Génération du nom de fichier optimisé
    const date = timestamp.split('T')[0];
    const filename = `preferences_kinkv2_${date}.json`;

    // Création du lien de téléchargement
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    // Déclenchement du téléchargement
    document.body.appendChild(link);
    link.click();

    // Nettoyage asynchrone
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    return {
      filename,
      size: blob.size,
      url
    };
  }

  // ===== UTILITAIRES =====

  static clearCache() {
    DataLoader.cache.clear();
    DataLoader.loadPromises.clear();
    console.log('🧹 Cache DataLoader vidé');
  }

  static getCacheStats() {
    return {
      cacheSize: DataLoader.cache.size,
      loadingPromises: DataLoader.loadPromises.size,
      memoryUsage: JSON.stringify(Array.from(DataLoader.cache.values())).length
    };
  }

  static preloadData() {
    // Préchargement des données en arrière-plan
    return DataLoader.loadKinkData().catch(error => {
      console.warn('Préchargement échoué:', error);
    });
  }
}