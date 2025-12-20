/**
 * Module de gestion des données personnalisées pour l'application Kink
 * Permet aux utilisateurs d'ajouter, modifier et supprimer des catégories et items personnalisés
 */

export class CustomDataManager {
    constructor() {
        this.storageKey = 'kinkv2_custom_data';
        this.customCategories = this.loadCustomData();
    }

    /**
     * Charge les données personnalisées depuis le localStorage
     * @returns {Array} Tableau des catégories personnalisées
     */
    loadCustomData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données personnalisées:', error);
            return [];
        }
    }

    /**
     * Sauvegarde les données personnalisées dans le localStorage
     */
    saveCustomData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.customCategories));
            console.log('✅ Données personnalisées sauvegardées');
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des données personnalisées:', error);
        }
    }

    /**
     * Ajoute une nouvelle catégorie personnalisée
     * @param {Object} category - Objet catégorie avec id, name, icon, description
     * @returns {boolean} Succès de l'opération
     */
    addCategory(category) {
        // Validation
        if (!category.id || !category.name || !category.icon) {
            console.error('❌ Catégorie invalide: id, name et icon sont obligatoires');
            return false;
        }

        // Vérifier si l'ID existe déjà
        if (this.customCategories.some(cat => cat.id === category.id)) {
            console.error('❌ Une catégorie avec cet ID existe déjà');
            return false;
        }

        // Ajouter la catégorie
        const newCategory = {
            id: category.id,
            name: category.name,
            icon: category.icon,
            description: category.description || '',
            isCustom: true,
            items: category.items || []
        };

        this.customCategories.push(newCategory);
        this.saveCustomData();
        console.log('✅ Catégorie personnalisée ajoutée:', category.name);
        return true;
    }

    /**
     * Ajoute un item à une catégorie (personnalisée ou existante)
     * @param {string} categoryId - ID de la catégorie
     * @param {Object} item - Objet item avec name et description
     * @returns {boolean} Succès de l'opération
     */
    addItemToCategory(categoryId, item) {
        // Validation
        if (!item.name) {
            console.error('❌ Item invalide: name est obligatoire');
            return false;
        }

        // Chercher la catégorie personnalisée
        const category = this.customCategories.find(cat => cat.id === categoryId);
        
        if (!category) {
            console.error('❌ Catégorie personnalisée non trouvée');
            return false;
        }

        // Vérifier si l'item existe déjà
        if (category.items.some(it => it.name === item.name)) {
            console.error('❌ Cet item existe déjà dans cette catégorie');
            return false;
        }

        // Ajouter l'item
        const newItem = {
            name: item.name,
            description: item.description || '',
            isCustom: true
        };

        category.items.push(newItem);
        this.saveCustomData();
        console.log('✅ Item personnalisé ajouté:', item.name);
        return true;
    }

    /**
     * Ajoute un item à une catégorie existante (non personnalisée)
     * @param {string} categoryId - ID de la catégorie existante
     * @param {Object} item - Objet item avec name et description
     * @returns {boolean} Succès de l'opération
     */
    addItemToExistingCategory(categoryId, item) {
        // Validation
        if (!item.name) {
            console.error('❌ Item invalide: name est obligatoire');
            return false;
        }

        // Chercher ou créer une catégorie de suivi pour les items personnalisés
        let customCategory = this.customCategories.find(cat => cat.id === categoryId);
        
        if (!customCategory) {
            // Créer une catégorie de suivi pour les items personnalisés de cette catégorie
            customCategory = {
                id: categoryId,
                name: `${categoryId} (Personnalisé)`,
                icon: 'fas fa-star',
                description: 'Items personnalisés ajoutés à cette catégorie',
                isCustom: true,
                isItemsOnlyCategory: true,
                items: []
            };
            this.customCategories.push(customCategory);
        }

        // Vérifier si l'item existe déjà
        if (customCategory.items.some(it => it.name === item.name)) {
            console.error('❌ Cet item existe déjà');
            return false;
        }

        // Ajouter l'item
        const newItem = {
            name: item.name,
            description: item.description || '',
            isCustom: true
        };

        customCategory.items.push(newItem);
        this.saveCustomData();
        console.log('✅ Item personnalisé ajouté à la catégorie existante:', item.name);
        return true;
    }

    /**
     * Supprime un item personnalisé
     * @param {string} categoryId - ID de la catégorie
     * @param {string} itemName - Nom de l'item
     * @returns {boolean} Succès de l'opération
     */
    removeItem(categoryId, itemName) {
        const category = this.customCategories.find(cat => cat.id === categoryId);
        
        if (!category) {
            console.error('❌ Catégorie non trouvée');
            return false;
        }

        const initialLength = category.items.length;
        category.items = category.items.filter(item => item.name !== itemName);

        if (category.items.length < initialLength) {
            this.saveCustomData();
            console.log('✅ Item supprimé:', itemName);
            return true;
        }

        console.error('❌ Item non trouvé');
        return false;
    }

    /**
     * Supprime une catégorie personnalisée
     * @param {string} categoryId - ID de la catégorie
     * @returns {boolean} Succès de l'opération
     */
    removeCategory(categoryId) {
        const initialLength = this.customCategories.length;
        this.customCategories = this.customCategories.filter(cat => cat.id !== categoryId);

        if (this.customCategories.length < initialLength) {
            this.saveCustomData();
            console.log('✅ Catégorie supprimée:', categoryId);
            return true;
        }

        console.error('❌ Catégorie non trouvée');
        return false;
    }

    /**
     * Récupère toutes les catégories personnalisées
     * @returns {Array} Tableau des catégories personnalisées
     */
    getCustomCategories() {
        return this.customCategories;
    }

    /**
     * Récupère une catégorie personnalisée par ID
     * @param {string} categoryId - ID de la catégorie
     * @returns {Object|null} La catégorie ou null
     */
    getCategory(categoryId) {
        return this.customCategories.find(cat => cat.id === categoryId) || null;
    }

    /**
     * Fusionne les données personnalisées avec les données existantes
     * @param {Object} originalData - Données originales du JSON
     * @returns {Object} Données fusionnées
     */
    mergeWithOriginalData(originalData) {
        const merged = JSON.parse(JSON.stringify(originalData)); // Deep copy

        // Ajouter les catégories personnalisées
        this.customCategories.forEach(customCat => {
            if (customCat.isItemsOnlyCategory) {
                // C'est une catégorie de suivi pour les items personnalisés
                // Ajouter les items à la catégorie existante
                const existingCat = merged.categories.find(cat => cat.id === customCat.id);
                if (existingCat) {
                    existingCat.items = existingCat.items || [];
                    customCat.items.forEach(item => {
                        if (!existingCat.items.some(it => it.name === item.name)) {
                            existingCat.items.push(item);
                        }
                    });
                }
            } else {
                // C'est une catégorie complètement personnalisée
                if (!merged.categories.some(cat => cat.id === customCat.id)) {
                    merged.categories.push(customCat);
                }
            }
        });

        return merged;
    }

    /**
     * Exporte les données personnalisées en JSON
     * @returns {string} JSON stringifié
     */
    exportCustomData() {
        return JSON.stringify(this.customCategories, null, 2);
    }

    /**
     * Importe des données personnalisées depuis un JSON
     * @param {string} jsonString - JSON à importer
     * @returns {boolean} Succès de l'opération
     */
    importCustomData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (!Array.isArray(data)) {
                console.error('❌ Le JSON doit être un tableau de catégories');
                return false;
            }

            // Valider la structure
            const isValid = data.every(cat => 
                cat.id && cat.name && cat.icon && Array.isArray(cat.items)
            );

            if (!isValid) {
                console.error('❌ Structure JSON invalide');
                return false;
            }

            // Fusionner avec les données existantes
            data.forEach(newCat => {
                const existing = this.customCategories.find(cat => cat.id === newCat.id);
                if (existing) {
                    // Mettre à jour la catégorie existante
                    existing.name = newCat.name;
                    existing.icon = newCat.icon;
                    existing.description = newCat.description || existing.description;
                    existing.items = newCat.items;
                } else {
                    // Ajouter la nouvelle catégorie
                    this.customCategories.push(newCat);
                }
            });

            this.saveCustomData();
            console.log('✅ Données personnalisées importées');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'import:', error);
            return false;
        }
    }

    /**
     * Efface toutes les données personnalisées
     * @returns {boolean} Succès de l'opération
     */
    clearAllCustomData() {
        this.customCategories = [];
        localStorage.removeItem(this.storageKey);
        console.log('✅ Toutes les données personnalisées ont été effacées');
        return true;
    }

    /**
     * Obtient des statistiques sur les données personnalisées
     * @returns {Object} Statistiques
     */
    getStatistics() {
        return {
            totalCustomCategories: this.customCategories.length,
            totalCustomItems: this.customCategories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0),
            categories: this.customCategories.map(cat => ({
                id: cat.id,
                name: cat.name,
                itemCount: cat.items?.length || 0
            }))
        };
    }
}
