/**
 * Module de chargement des données pour l'application de gestion des préférences Kink
 */
import { CONFIG, FALLBACK_DATA } from './config.js';

/**
 * Classe responsable du chargement des données JSON
 */
export class DataLoader {
    /**
     * Charge le catalogue avec un délai explicite et une stratégie de reprise.
     * La dernière copie validée est réutilisée si la ressource réseau échoue.
     * @param {IndexedDBManager|null} dbManager Gestionnaire de stockage local
     * @returns {Promise<Object>} Catalogue utilisable
     */
    static async loadKinkData(dbManager = null) {
        console.log(`🔍 Chargement du catalogue depuis ${CONFIG.jsonPath}`);

        try {
            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), CONFIG.dataFetchTimeout);
            let response;

            try {
                response = await fetch(CONFIG.jsonPath, {
                    signal: controller.signal,
                    cache: 'no-cache',
                    headers: { Accept: 'application/json' }
                });
            } finally {
                window.clearTimeout(timeoutId);
            }

            if (!response.ok) {
                throw new Error(`Réponse HTTP ${response.status}`);
            }

            const kinkData = await response.json();
            this.validateKinkData(kinkData);

            if (dbManager) {
                await dbManager.setCache(CONFIG.dataCacheKey, kinkData, CONFIG.dataCacheTtl);
            }

            console.log(`✅ Catalogue réseau valide : ${kinkData.categories.length} catégories`);
            return kinkData;
        } catch (error) {
            const reason = error.name === 'AbortError'
                ? `Délai de ${CONFIG.dataFetchTimeout / 1000} secondes dépassé`
                : error.message;
            console.warn(`⚠️ Catalogue réseau indisponible : ${reason}`);

            const cachedData = dbManager ? await dbManager.getCache(CONFIG.dataCacheKey) : null;
            if (cachedData) {
                try {
                    this.validateKinkData(cachedData);
                    console.warn('↩️ Utilisation de la dernière copie validée du catalogue');
                    return cachedData;
                } catch (cacheError) {
                    console.warn('⚠️ Copie locale invalide, elle est ignorée.', cacheError);
                }
            }

            console.warn('⚠️ Aucune copie complète disponible, affichage du catalogue de secours.');
            return FALLBACK_DATA;
        }
    }

    /**
     * Valide les invariants minimaux du catalogue de référence.
     * @param {Object} data Catalogue à valider
     * @returns {true} Indique que le format est exploitable
     */
    static validateKinkData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Le catalogue n’est pas un objet JSON.');
        }
        if (!Array.isArray(data.categories) || data.categories.length === 0) {
            throw new Error('Le catalogue ne contient aucune catégorie.');
        }
        if (!Array.isArray(data.preferenceTypes) || data.preferenceTypes.length === 0) {
            throw new Error('Le catalogue ne contient aucun type de préférence.');
        }

        const categoryIds = new Set();
        for (const category of data.categories) {
            if (!category?.id || !category?.name || categoryIds.has(category.id)) {
                throw new Error('Une catégorie est invalide ou dupliquée.');
            }
            categoryIds.add(category.id);

            const groups = category.hasSubcategories ? category.subcategories : [category];
            if (!Array.isArray(groups)) {
                throw new Error(`Les éléments de ${category.id} sont invalides.`);
            }
            for (const group of groups) {
                if (!Array.isArray(group?.items)) {
                    throw new Error(`Les éléments de ${category.id} sont invalides.`);
                }
            }
        }
        return true;
    }

    /**
     * Validation des données importées.
     * @param {Object} data Données à valider
     * @returns {Map} Préférences validées
     */
    static validateImportData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Fichier JSON invalide');
        }
        if (!data.preferences || typeof data.preferences !== 'object') {
            throw new Error('Fichier invalide : aucune préférence trouvée');
        }

        const validPreferences = new Map();
        Object.entries(data.preferences).forEach(([key, value]) => {
            if (typeof key === 'string' && CONFIG.validImportStates.includes(value)) {
                validPreferences.set(key, value);
            }
        });
        return validPreferences;
    }
}
