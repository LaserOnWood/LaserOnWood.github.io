/**
 * Module de gestion des statistiques pour l'application de gestion des préférences Kink
 * Version mise à jour avec support du lazy loading
 */

/**
 * Classe responsable de la gestion et mise à jour des statistiques
 */
export class StatsManager {
    constructor(kinkData, preferencesManager) {
        this.kinkData = kinkData;
        this.preferencesManager = preferencesManager;
        this.lazyLoadingManager = null; // Sera défini plus tard si nécessaire
        this.cache = {
            totalItems: 0,
            categoryItems: new Map()
        };
    }

    /**
     * Définit le gestionnaire de lazy loading (optionnel)
     * @param {LazyLoadingManager} lazyLoadingManager
     */
    setLazyLoadingManager(lazyLoadingManager) {
        this.lazyLoadingManager = lazyLoadingManager;
    }

    /**
     * Calcul des données en cache
     */
    calculateCacheData() {
        this.cache.totalItems = this.getTotalItemsCount();

        this.kinkData.categories.forEach(category => {
            const itemsCount = this.getCategoryItemsCount(category);
            this.cache.categoryItems.set(category.id, itemsCount);

            if (category.subcategories) {
                category.subcategories.forEach(subcat => {
                    const subcatCount = this.getSubcategoryItemsCount(subcat);
                    this.cache.categoryItems.set(subcat.id, subcatCount);
                });
            }
        });
    }

    /**
     * Compte le nombre total d'items dans les données
     * @returns {number}
     */
    getTotalItemsCount() {
        let count = 0;
        this.kinkData.categories.forEach(category => {
            if (category.hasSubcategories && category.subcategories) {
                category.subcategories.forEach(subcat => {
                    count += (subcat.items || []).length;
                });
            } else {
                count += (category.items || []).length;
            }
        });
        return count;
    }

    /**
     * Compte les items d'une catégorie
     * @param {Object} category
     * @returns {number}
     */
    getCategoryItemsCount(category) {
        let count = 0;
        if (category.hasSubcategories && category.subcategories) {
            category.subcategories.forEach(subcat => {
                count += (subcat.items || []).length;
            });
        } else {
            count = (category.items || []).length;
        }
        return count;
    }

    /**
     * Compte les items d'une sous-catégorie
     * @param {Object} subcategory
     * @returns {number}
     */
    getSubcategoryItemsCount(subcategory) {
        return (subcategory.items || []).length;
    }

    /**
     * Mise à jour des statistiques globales
     */
    updateStats() {
        if (!this.kinkData?.preferenceTypes) return;

        const stats = {};
        const preferences = this.preferencesManager.getAllPreferences();

        // Initialiser les compteurs
        this.kinkData.preferenceTypes.forEach(type => {
            stats[type.id] = 0;
        });

        // Compter les préférences
        preferences.forEach(pref => {
            if (stats.hasOwnProperty(pref)) {
                stats[pref]++;
            }
        });

        // Calculer les non sélectionnés
        const selectedCount = Object.values(stats).reduce((sum, count) => sum + count, 0);
        const unselectedCount = Math.max(0, this.cache.totalItems - selectedCount);

        // Mise à jour de l'interface
        this.kinkData.preferenceTypes.forEach(type => {
            const element = document.getElementById(`${type.id}-count`);
            if (element) {
                element.textContent = stats[type.id] || 0;
            }
        });

        const unselectedElement = document.getElementById('unselected-count');
        if (unselectedElement) {
            unselectedElement.textContent = unselectedCount;
        }
    }

    /**
     * Mise à jour des compteurs de catégorie
     */
    updateCategoryCounters() {
        if (!this.kinkData?.categories) return;

        this.kinkData.categories.forEach(category => {
            if (category.hasSubcategories && category.subcategories) {
                this.updateSubcategoriesCounters(category);
            } else {
                this.updateSingleCategoryCounter(category);
            }
        });
    }

    /**
     * Mise à jour des compteurs pour les sous-catégories
     * @param {Object} category - Données de la catégorie
     */
    updateSubcategoriesCounters(category) {
        let totalSelected = 0;
        let totalItems = 0;

        category.subcategories.forEach(subcat => {
            const items = this.getItemsForCategory(subcat);
            const subcatSelected = this.countSelectedItems(items);

            totalItems += items.length;
            totalSelected += subcatSelected;

            // Mise à jour du compteur de sous-catégorie
            const subcatCounter = document.getElementById(`counter-${subcat.id}`);
            if (subcatCounter) {
                subcatCounter.textContent = `${subcatSelected}/${items.length}`;
            }
        });

        // Mise à jour du compteur principal
        const counter = document.getElementById(`counter-${category.id}`);
        if (counter) {
            counter.textContent = `${totalSelected}/${totalItems}`;
        }
    }

    /**
     * Mise à jour du compteur pour une catégorie simple
     * @param {Object} category - Données de la catégorie
     */
    updateSingleCategoryCounter(category) {
        const items = this.getItemsForCategory(category);
        const selectedItems = this.countSelectedItems(items);

        const counter = document.getElementById(`counter-${category.id}`);
        if (counter) {
            counter.textContent = `${selectedItems}/${items.length}`;
        }
    }

    /**
     * Récupère les items d'une catégorie/sous-catégorie
     * @param {Object} category
     * @returns {Array}
     */
    getItemsForCategory(category) {
        if (category.items && Array.isArray(category.items)) {
            return category.items;
        }
        return [];
    }

    /**
     * Compte les items sélectionnés dans une liste
     * @param {Array} items - Liste des items
     * @returns {number}
     */
    countSelectedItems(items) {
        let count = 0;
        const preferences = this.preferencesManager.getAllPreferences();
        
        items.forEach(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            if (itemName && preferences.has(itemName)) {
                count++;
            }
        });
        
        return count;
    }

    /**
     * Mise à jour complète de l'interface
     */
    updateInterface() {
        this.updateStats();
        this.updateCategoryCounters();
        
        // Si le lazy loading est activé, mettre à jour ses compteurs aussi
        if (this.lazyLoadingManager) {
            this.lazyLoadingManager.updateAllCounters();
        }
    }

    /**
     * Obtenir des statistiques détaillées
     * @returns {Object}
     */
    getDetailedStats() {
        const preferences = this.preferencesManager.getAllPreferences();
        const stats = {
            total: preferences.size,
            totalAvailable: this.cache.totalItems,
            percentageCompleted: this.cache.totalItems > 0 ? ((preferences.size / this.cache.totalItems) * 100).toFixed(1) : 0,
            byType: {},
            byCategory: {}
        };

        // Stats par type
        this.kinkData.preferenceTypes.forEach(type => {
            stats.byType[type.id] = {
                name: type.name,
                count: 0,
                percentage: 0
            };
        });

        preferences.forEach(pref => {
            if (stats.byType[pref]) {
                stats.byType[pref].count++;
            }
        });

        // Calculer les pourcentages
        Object.keys(stats.byType).forEach(typeId => {
            if (preferences.size > 0) {
                stats.byType[typeId].percentage = 
                    ((stats.byType[typeId].count / preferences.size) * 100).toFixed(1);
            }
        });

        // Stats par catégorie
        this.kinkData.categories.forEach(category => {
            const items = this.getItemsForCategory(category);
            const selected = this.countSelectedItems(items);
            
            stats.byCategory[category.id] = {
                name: category.name,
                total: items.length,
                selected: selected,
                percentage: items.length > 0 ? ((selected / items.length) * 100).toFixed(1) : 0
            };
        });

        return stats;
    }
}
