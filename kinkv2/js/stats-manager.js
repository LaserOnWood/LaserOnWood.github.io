/**
 * Module de gestion des statistiques pour l'application de gestion des préférences Kink
 */

/**
 * Classe responsable de la gestion et mise à jour des statistiques
 */
export class StatsManager {
    constructor(kinkData, preferencesManager) {
        this.kinkData = kinkData;
        this.preferencesManager = preferencesManager;
        this.cache = {
            totalItems: 0,
            categoryItems: new Map()
        };
    }

    /**
     * Calcul des données en cache
     */
    calculateCacheData() {
        this.cache.totalItems = document.querySelectorAll('.item').length;

        this.kinkData.categories.forEach(category => {
            const items = document.querySelectorAll(`[data-category="${category.id}"]`);
            this.cache.categoryItems.set(category.id, items.length);

            if (category.subcategories) {
                category.subcategories.forEach(subcat => {
                    const subcatItems = document.querySelectorAll(`[data-category="${subcat.id}"]`);
                    this.cache.categoryItems.set(subcat.id, subcatItems.length);
                });
            }
        });
    }

    /**
     * Mise à jour des statistiques globales
     */
    updateStats() {
        if (!this.kinkData?.preferenceTypes) return;

        const stats = new Map();
        const preferences = this.preferencesManager.getAllPreferences();

        // Initialiser les compteurs
        this.kinkData.preferenceTypes.forEach(type => {
            stats.set(type.id, 0);
        });

        // Compter les préférences
        preferences.forEach(pref => {
            if (stats.has(pref)) {
                stats.set(pref, stats.get(pref) + 1);
            }
        });

        // Calculer les non sélectionnés
        const selectedCount = Array.from(stats.values()).reduce((sum, count) => sum + count, 0);
        const unselectedCount = this.cache.totalItems - selectedCount;

        // Mise à jour de l'interface
        this.kinkData.preferenceTypes.forEach(type => {
            const element = document.getElementById(`${type.id}-count`);
            if (element) {
                element.textContent = stats.get(type.id) || 0;
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
            const items = document.querySelectorAll(`[data-category="${subcat.id}"]`);
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
        const items = document.querySelectorAll(`[data-category="${category.id}"]`);
        const selectedItems = this.countSelectedItems(items);

        const counter = document.getElementById(`counter-${category.id}`);
        if (counter) {
            counter.textContent = `${selectedItems}/${items.length}`;
        }
    }

    /**
     * Comptage des items sélectionnés
     * @param {NodeList} items - Liste des items
     * @returns {number} Nombre d'items sélectionnés
     */
    countSelectedItems(items) {
        let count = 0;
        const preferences = this.preferencesManager.getAllPreferences();
        
        items.forEach(item => {
            const itemName = item.dataset.item;
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
    }
}

