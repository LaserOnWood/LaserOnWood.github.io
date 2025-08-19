/**
 * Module de chargement des données pour l'application de gestion des préférences Kink
 */
import { CONFIG, FALLBACK_DATA } from './config.js';

/**
 * Classe responsable du chargement des données JSON
 */
export class DataLoader {
    /**
     * Chargement des données JSON avec gestion d'erreur robuste
     * @returns {Promise<Object>} Données chargées
     */
    static async loadKinkData() {
        console.log(`🔍 Tentative de chargement depuis: ${CONFIG.jsonPath}`);
        
        try {
            const response = await fetch(CONFIG.jsonPath);
            console.log(`📡 Réponse reçue - Status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            console.log(`📋 Content-Type: ${contentType}`);
            
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('⚠️ Content-Type non JSON, tentative de parsing quand même...');
            }
            
            const jsonText = await response.text();
            console.log(`📄 Taille du JSON: ${jsonText.length} caractères`);
            console.log(`📄 Début du JSON: ${jsonText.substring(0, 100)}...`);
            
            const kinkData = JSON.parse(jsonText);
            console.log('✅ JSON parsé avec succès');
            console.log('📊 Structure des données:', {
                categories: kinkData.categories?.length || 0,
                preferenceTypes: kinkData.preferenceTypes?.length || 0
            });
            
            return kinkData;
            
        } catch (error) {
            console.error('❌ Erreur détaillée lors du chargement:', error);
            
            // Tentative de fallback avec des données de test
            if (error.message.includes('404') || error.message.includes('réseau')) {
                console.log('🔄 Tentative avec les données de fallback...');
                console.log('✅ Données de fallback chargées');
                return FALLBACK_DATA;
            }
            
            if (error.name === 'SyntaxError') {
                throw new Error(`JSON invalide: ${error.message}`);
            } else if (error.name === 'TypeError') {
                throw new Error(`Erreur réseau: Impossible d'accéder au fichier ${CONFIG.jsonPath}`);
            } else {
                throw new Error(`Impossible de charger les données: ${error.message}`);
            }
        }
    }

    /**
     * Validation des données importées
     * @param {Object} data - Données à valider
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

