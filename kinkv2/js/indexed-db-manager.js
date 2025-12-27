/**
 * Module de gestion du stockage IndexedDB pour l'application KinkList
 * Remplace localStorage pour de meilleures performances et plus de capacité
 */

export class IndexedDBManager {
    constructor() {
        this.dbName = 'KinkListDB';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            preferences: 'preferences',
            customData: 'customData',
            history: 'history',
            settings: 'settings',
            cache: 'cache'
        };
    }

    /**
     * Initialise la base de données
     * @returns {Promise<boolean>}
     */
    async init() {
        try {
            this.db = await this.openDatabase();
            console.log('✅ IndexedDB initialisée avec succès');
            
            // Migration depuis localStorage si nécessaire
            await this.migrateFromLocalStorage();
            
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation d\'IndexedDB:', error);
            return false;
        }
    }

    /**
     * Ouvre la base de données
     * @returns {Promise<IDBDatabase>}
     */
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Impossible d\'ouvrir IndexedDB'));
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Créer les object stores s'ils n'existent pas
                if (!db.objectStoreNames.contains(this.stores.preferences)) {
                    const prefStore = db.createObjectStore(this.stores.preferences, { keyPath: 'id' });
                    prefStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.stores.customData)) {
                    db.createObjectStore(this.stores.customData, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(this.stores.history)) {
                    const histStore = db.createObjectStore(this.stores.history, { keyPath: 'id', autoIncrement: true });
                    histStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains(this.stores.cache)) {
                    const cacheStore = db.createObjectStore(this.stores.cache, { keyPath: 'key' });
                    cacheStore.createIndex('expiry', 'expiry', { unique: false });
                }

                console.log('🔨 Schéma de base de données créé/mis à jour');
            };
        });
    }

    /**
     * Migre les données depuis localStorage
     */
    async migrateFromLocalStorage() {
        try {
            // Migrer les préférences
            const oldPreferences = localStorage.getItem('kinkv2_preferences');
            if (oldPreferences) {
                const prefs = JSON.parse(oldPreferences);
                await this.savePreferences(prefs);
                console.log('📦 Préférences migrées depuis localStorage');
            }

            // Migrer les données personnalisées
            const oldCustomData = localStorage.getItem('kinkv2_custom_data');
            if (oldCustomData) {
                const customData = JSON.parse(oldCustomData);
                await this.set(this.stores.customData, 'categories', customData);
                console.log('📦 Données personnalisées migrées');
            }

            // Migrer les paramètres
            const oldView = localStorage.getItem('kinkv2_preferred_view');
            if (oldView) {
                await this.setSetting('preferred_view', oldView);
                console.log('📦 Vue préférée migrée');
            }

            console.log('✅ Migration depuis localStorage terminée');
        } catch (error) {
            console.warn('⚠️ Erreur lors de la migration:', error);
        }
    }

    /**
     * Sauvegarde les préférences
     * @param {Object} preferences - Préférences à sauvegarder
     * @returns {Promise<boolean>}
     */
    async savePreferences(preferences) {
        try {
            const data = {
                id: 'current',
                preferences: preferences,
                timestamp: Date.now()
            };

            await this.set(this.stores.preferences, 'current', data);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des préférences:', error);
            return false;
        }
    }

    /**
     * Charge les préférences
     * @returns {Promise<Object|null>}
     */
    async loadPreferences() {
        try {
            const data = await this.get(this.stores.preferences, 'current');
            return data ? data.preferences : null;
        } catch (error) {
            console.error('Erreur lors du chargement des préférences:', error);
            return null;
        }
    }

    /**
     * Sauvegarde l'historique
     * @param {Array} history - Historique à sauvegarder
     * @returns {Promise<boolean>}
     */
    async saveHistory(history) {
        try {
            // Supprimer l'ancien historique
            await this.clearStore(this.stores.history);

            // Sauvegarder le nouvel historique
            const transaction = this.db.transaction([this.stores.history], 'readwrite');
            const store = transaction.objectStore(this.stores.history);

            for (const state of history) {
                await new Promise((resolve, reject) => {
                    const request = store.add(state);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'historique:', error);
            return false;
        }
    }

    /**
     * Charge l'historique
     * @returns {Promise<Array>}
     */
    async loadHistory() {
        try {
            return await this.getAll(this.stores.history);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            return [];
        }
    }

    /**
     * Sauvegarde un paramètre
     * @param {string} key - Clé du paramètre
     * @param {*} value - Valeur du paramètre
     * @returns {Promise<boolean>}
     */
    async setSetting(key, value) {
        try {
            await this.set(this.stores.settings, key, { key, value, timestamp: Date.now() });
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du paramètre:', error);
            return false;
        }
    }

    /**
     * Charge un paramètre
     * @param {string} key - Clé du paramètre
     * @returns {Promise<*>}
     */
    async getSetting(key) {
        try {
            const data = await this.get(this.stores.settings, key);
            return data ? data.value : null;
        } catch (error) {
            console.error('Erreur lors du chargement du paramètre:', error);
            return null;
        }
    }

    /**
     * Sauvegarde une valeur dans le cache avec expiration
     * @param {string} key - Clé
     * @param {*} value - Valeur
     * @param {number} ttl - Durée de vie en millisecondes
     * @returns {Promise<boolean>}
     */
    async setCache(key, value, ttl = 3600000) {
        try {
            const data = {
                key,
                value,
                expiry: Date.now() + ttl,
                timestamp: Date.now()
            };

            await this.set(this.stores.cache, key, data);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du cache:', error);
            return false;
        }
    }

    /**
     * Récupère une valeur du cache
     * @param {string} key - Clé
     * @returns {Promise<*>}
     */
    async getCache(key) {
        try {
            const data = await this.get(this.stores.cache, key);
            
            if (!data) return null;

            // Vérifier l'expiration
            if (data.expiry < Date.now()) {
                await this.delete(this.stores.cache, key);
                return null;
            }

            return data.value;
        } catch (error) {
            console.error('Erreur lors de la lecture du cache:', error);
            return null;
        }
    }

    /**
     * Nettoie le cache expiré
     * @returns {Promise<number>} Nombre d'entrées supprimées
     */
    async cleanExpiredCache() {
        try {
            const transaction = this.db.transaction([this.stores.cache], 'readwrite');
            const store = transaction.objectStore(this.stores.cache);
            const index = store.index('expiry');
            
            const range = IDBKeyRange.upperBound(Date.now());
            const request = index.openCursor(range);
            
            let count = 0;

            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        count++;
                        cursor.continue();
                    } else {
                        console.log(`🧹 ${count} entrées de cache expirées nettoyées`);
                        resolve(count);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Erreur lors du nettoyage du cache:', error);
            return 0;
        }
    }

    /**
     * Méthode générique pour sauvegarder une valeur
     * @param {string} storeName - Nom du store
     * @param {string} key - Clé
     * @param {*} value - Valeur
     * @returns {Promise<void>}
     */
    set(storeName, key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.put(value);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Méthode générique pour récupérer une valeur
     * @param {string} storeName - Nom du store
     * @param {string} key - Clé
     * @returns {Promise<*>}
     */
    get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Récupère toutes les valeurs d'un store
     * @param {string} storeName - Nom du store
     * @returns {Promise<Array>}
     */
    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Supprime une valeur
     * @param {string} storeName - Nom du store
     * @param {string} key - Clé
     * @returns {Promise<void>}
     */
    delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Vide un store
     * @param {string} storeName - Nom du store
     * @returns {Promise<void>}
     */
    clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtient des statistiques sur la base de données
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        try {
            const stats = {
                stores: {}
            };

            for (const [name, storeName] of Object.entries(this.stores)) {
                const count = await this.getStoreCount(storeName);
                const size = await this.estimateStoreSize(storeName);
                
                stats.stores[name] = {
                    count,
                    size: `${(size / 1024).toFixed(2)} KB`
                };
            }

            // Taille totale estimée
            const totalSize = Object.values(stats.stores).reduce((sum, store) => {
                return sum + parseFloat(store.size);
            }, 0);

            stats.totalSize = `${totalSize.toFixed(2)} KB`;
            stats.totalRecords = Object.values(stats.stores).reduce((sum, store) => sum + store.count, 0);

            return stats;
        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
            return null;
        }
    }

    /**
     * Compte les enregistrements dans un store
     * @param {string} storeName - Nom du store
     * @returns {Promise<number>}
     */
    getStoreCount(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Estime la taille d'un store
     * @param {string} storeName - Nom du store
     * @returns {Promise<number>}
     */
    async estimateStoreSize(storeName) {
        try {
            const data = await this.getAll(storeName);
            const json = JSON.stringify(data);
            return new Blob([json]).size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Exporte toutes les données
     * @returns {Promise<Object>}
     */
    async exportAll() {
        try {
            const exportData = {
                version: this.dbVersion,
                timestamp: new Date().toISOString(),
                data: {}
            };

            for (const [name, storeName] of Object.entries(this.stores)) {
                exportData.data[name] = await this.getAll(storeName);
            }

            return exportData;
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            return null;
        }
    }

    /**
     * Importe des données
     * @param {Object} importData - Données à importer
     * @returns {Promise<boolean>}
     */
    async importAll(importData) {
        try {
            if (!importData.data) {
                throw new Error('Format d\'import invalide');
            }

            for (const [name, storeName] of Object.entries(this.stores)) {
                if (importData.data[name]) {
                    await this.clearStore(storeName);
                    
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);

                    for (const item of importData.data[name]) {
                        await new Promise((resolve, reject) => {
                            const request = store.add(item);
                            request.onsuccess = () => resolve();
                            request.onerror = () => reject(request.error);
                        });
                    }
                }
            }

            console.log('✅ Import terminé avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            return false;
        }
    }

    /**
     * Supprime complètement la base de données
     * @returns {Promise<boolean>}
     */
    async deleteDatabase() {
        try {
            if (this.db) {
                this.db.close();
                this.db = null;
            }

            return new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(this.dbName);
                
                request.onsuccess = () => {
                    console.log('🗑️ Base de données supprimée');
                    resolve(true);
                };
                
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Erreur lors de la suppression de la base:', error);
            return false;
        }
    }

    /**
     * Ferme la connexion à la base de données
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('🔒 Connexion IndexedDB fermée');
        }
    }
}