        /**
         * Application de gestion des préférences Kink
         * Version corrigée - Bug export double fenêtre résolu
         */
class KinkPreferencesApp {
    constructor() {
        this.preferences = new Map();
        this.kinkData = null;
        this.isInitialized = false;
        this.debounceTimeout = null;

        // Configuration
        this.config = {
            jsonPath: 'json/kink-data.json',
            preferenceStates: ['none', 'adore', 'aime', 'curiosité', 'dislike', 'non_strict'],
            validImportStates: ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'],
            toastDuration: 3000,
            debounceDelay: 100
        };

        // Cache pour éviter les recalculs
        this.cache = {
            totalItems: 0,
            categoryItems: new Map()
        };

        // Flags pour éviter les actions multiples - CORRECTION PRINCIPALE
        this.isExporting = false;
        this.isImporting = false;
        this.exportProtectionTimer = null;

        // Références liées pour add/removeEventListener
        this._boundHandleDocumentClick = this.handleDocumentClick.bind(this);
        this._boundOnFileChange = (e) => this.importResults(e.target);
    }

    /**
     * Initialisation de l'application - CORRECTION : une seule initialisation
     */
    async init() {
        try {
            if (this.isInitialized) {
                console.warn('⚠️ Application déjà initialisée');
                return;
            }

            console.log('🚀 Début de l\'initialisation...');

            // Chargement des données (avec fallback)
            await this.loadKinkData();
            
            // Génération de l'interface
            this.generateInterface();
            
            // Initialisation des event listeners - CORRECTION : une seule fois
            this.initializeEventListeners();
            
            // Mise à jour de l'interface
            this.updateInterface();

            this.isInitialized = true;
            console.log('✅ Initialisation terminée avec succès !');

            // Masquer le chargement
            this.hideLoadingIndicator();

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.handleError('Erreur lors de l\'initialisation', error);
            throw error;
        }
    }

    /**
     * Masquage de l'indicateur de chargement
     */
    hideLoadingIndicator() {
        const loading = document.getElementById('loading');
        const mainContent = document.getElementById('main-content');

        if (loading) {
            loading.classList.remove('show');
            loading.style.display = 'none';
        }

        if (mainContent) {
            mainContent.classList.remove('loading');
            mainContent.style.opacity = '1';
            mainContent.style.pointerEvents = 'auto';
        }
    }

    /**
     * Chargement des données JSON avec gestion d'erreur robuste
     */
    async loadKinkData() {
        console.log(`🔍 Tentative de chargement depuis: ${this.config.jsonPath}`);
        
        try {
            const response = await fetch(this.config.jsonPath);
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
            
            this.kinkData = JSON.parse(jsonText);
            console.log('✅ JSON parsé avec succès');
            console.log('📊 Structure des données:', {
                categories: this.kinkData.categories?.length || 0,
                preferenceTypes: this.kinkData.preferenceTypes?.length || 0
            });
            
        } catch (error) {
            console.error('❌ Erreur détaillée lors du chargement:', error);
            
            // Tentative de fallback avec des données de test
            if (error.message.includes('404') || error.message.includes('réseau')) {
                console.log('🔄 Tentative avec les données de fallback...');
                this.kinkData = this.getFallbackData();
                console.log('✅ Données de fallback chargées');
                return;
            }
            
            if (error.name === 'SyntaxError') {
                throw new Error(`JSON invalide: ${error.message}`);
            } else if (error.name === 'TypeError') {
                throw new Error(`Erreur réseau: Impossible d'accéder au fichier ${this.config.jsonPath}`);
            } else {
                throw new Error(`Impossible de charger les données: ${error.message}`);
            }
        }
    }

    /**
     * Génération de l'interface
     */
    generateInterface() {
        this.generateStatsSection();
        this.generateCategoriesAccordion();
        this.calculateCacheData();
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
     * Génération de la section statistiques
     */
    generateStatsSection() {
        const statsContainer = document.querySelector('.stats-badges');
        if (!statsContainer) return;

        const fragment = document.createDocumentFragment();

        this.kinkData.preferenceTypes.forEach(type => {
            const badge = this.createStatBadge(type.name, type.id, type.color);
            fragment.appendChild(badge);
        });

        // Badge "Non sélectionné"
        const unselectedBadge = this.createStatBadge(
            'Non sélectionné',
            'unselected',
            'linear-gradient(135deg, #6c757d, #5a6268)'
        );
        fragment.appendChild(unselectedBadge);

        statsContainer.innerHTML = '';
        statsContainer.appendChild(fragment);
    }

    /**
     * Création d'un badge de statistique
     */
    createStatBadge(name, id, color) {
        const badge = document.createElement('div');
        badge.className = 'stat-badge';
        badge.style.background = color;
        badge.innerHTML = `
            <span>${this.escapeHtml(name)}</span>
            <span class="count" id="${id}-count">0</span>
        `;
        return badge;
    }

    /**
     * Génération de l'accordéon des catégories
     */
    generateCategoriesAccordion() {
        const accordion = document.getElementById('categoriesAccordion');
        if (!accordion) return;

        const fragment = document.createDocumentFragment();

        this.kinkData.categories.forEach(category => {
            const accordionItem = this.createCategoryAccordion(category);
            fragment.appendChild(accordionItem);
        });

        accordion.innerHTML = '';
        accordion.appendChild(fragment);
    }

    /**
     * Création d'un élément d'accordéon pour une catégorie
     */
    createCategoryAccordion(category) {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';

        const header = this.createCategoryHeader(category);
        const body = this.createCategoryBody(category);

        accordionItem.appendChild(header);
        accordionItem.appendChild(body);

        return accordionItem;
    }

    /**
     * Création de l'en-tête d'une catégorie
     */
    createCategoryHeader(category) {
        const headerElement = document.createElement('h2');
        headerElement.className = 'accordion-header';
        headerElement.innerHTML = `
            <button class="accordion-button collapsed" type="button" 
                    data-bs-toggle="collapse" data-bs-target="#${category.id}" 
                    aria-expanded="false">
                <i class="${category.icon} me-2"></i>
                <span>${this.escapeHtml(category.name)}</span>
                <span class="category-counter" id="counter-${category.id}"></span>
            </button>
        `;
        return headerElement;
    }

    /**
     * Création du corps d'une catégorie
     */
    createCategoryBody(category) {
        const bodyElement = document.createElement('div');
        bodyElement.id = category.id;
        bodyElement.className = 'accordion-collapse collapse';
        bodyElement.setAttribute('data-bs-parent', '#categoriesAccordion');

        const bodyContent = document.createElement('div');
        bodyContent.className = 'accordion-body';

        if (category.description) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-info text-center';
            alert.innerHTML = `<i class="fas fa-info-circle me-2"></i>${this.escapeHtml(category.description)}`;
            bodyContent.appendChild(alert);
        }

        if (category.hasSubcategories && category.subcategories) {
            const subAccordion = this.createSubcategoriesAccordion(category);
            bodyContent.appendChild(subAccordion);
        } else if (category.items) {
            const itemsGrid = this.createItemsGrid(category.items, category.id);
            bodyContent.appendChild(itemsGrid);
        }

        bodyElement.appendChild(bodyContent);
        return bodyElement;
    }

    /**
     * Création de l'accordéon pour les sous-catégories
     */
    createSubcategoriesAccordion(category) {
        const accordion = document.createElement('div');
        accordion.className = 'accordion';
        accordion.id = `accordion${category.id}`;

        const fragment = document.createDocumentFragment();

        category.subcategories.forEach(subcat => {
            const subcatItem = this.createSubcategoryAccordionItem(subcat, category.id);
            fragment.appendChild(subcatItem);
        });

        accordion.appendChild(fragment);
        return accordion;
    }

    /**
     * Création d'un élément d'accordéon pour une sous-catégorie
     */
    createSubcategoryAccordionItem(subcat, parentId) {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';

        // En-tête de la sous-catégorie
        const header = document.createElement('h2');
        header.className = 'accordion-header';
        header.innerHTML = `
            <button class="accordion-button collapsed" type="button" 
                    data-bs-toggle="collapse" data-bs-target="#${subcat.id}" 
                    aria-expanded="false">
                <i class="${subcat.icon} me-2"></i>
                <span>${this.escapeHtml(subcat.name)}</span>
                <span class="category-counter" id="counter-${subcat.id}"></span>
            </button>
        `;

        // Corps de la sous-catégorie
        const body = document.createElement('div');
        body.id = subcat.id;
        body.className = 'accordion-collapse collapse';
        body.setAttribute('data-bs-parent', `#accordion${parentId}`);

        const bodyContent = document.createElement('div');
        bodyContent.className = 'accordion-body';

        if (subcat.items && subcat.items.length > 0) {
            const itemsGrid = this.createItemsGrid(subcat.items, subcat.id);
            bodyContent.appendChild(itemsGrid);
        }

        body.appendChild(bodyContent);
        accordionItem.appendChild(header);
        accordionItem.appendChild(body);

        return accordionItem;
    }

    /**
     * Création de la grille d'items
     */
    createItemsGrid(items, categoryId) {
        const grid = document.createElement('div');
        grid.className = 'items-grid';

        const fragment = document.createDocumentFragment();
        items.forEach(item => {
            const itemElement = this.createItemElement(item, categoryId);
            fragment.appendChild(itemElement);
        });

        grid.appendChild(fragment);
        return grid;
    }

    /**
     * Création d'un élément item
     */
    createItemElement(item, categoryId) {
        const itemName = typeof item === 'string' ? item : item.name;
        const itemDescription = typeof item === 'object' && item.description ? item.description : '';

        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.dataset.item = itemName;
        itemElement.dataset.category = categoryId;

        const nameElement = document.createElement('div');
        nameElement.className = 'item-name';
        nameElement.textContent = itemName;
        itemElement.appendChild(nameElement);

        if (itemDescription) {
            const descElement = document.createElement('div');
            descElement.className = 'item-description';
            descElement.textContent = itemDescription;
            itemElement.appendChild(descElement);
        }

        return itemElement;
    }

    /**
     * CORRECTION : Initialisation des event listeners - UNE SEULE FOIS
     */
    initializeEventListeners() {
        // Supprimer d'abord tout listener existant
        this.removeExistingEventListeners();

        // Un seul écouteur global pour tous les clics
        document.addEventListener('click', this._boundHandleDocumentClick);

        // Un seul écouteur pour l'input file
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', this._boundOnFileChange);
        }

        console.log('🔗 Event listeners initialisés (une seule fois)');
    }

    /**
     * Suppression des event listeners existants
     */
    removeExistingEventListeners() {
        if (this._boundHandleDocumentClick) {
            document.removeEventListener('click', this._boundHandleDocumentClick);
        }

        const importFile = document.getElementById('importFile');
        if (importFile && this._boundOnFileChange) {
            importFile.removeEventListener('change', this._boundOnFileChange);
        }
    }

    /**
     * CORRECTION : Gestionnaire des clics avec protection renforcée
     */
    handleDocumentClick(e) {
        // Gestion des items de préférence
        const item = e.target.closest('.item');
        if (item) {
            e.preventDefault();
            e.stopPropagation();
            this.handleItemClick(item);
            return;
        }

        // CORRECTION PRINCIPALE : Gestion du bouton export avec protection multiple
        if (e.target.closest('#exportBtn')) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔤 Clic détecté sur le bouton export');

            // Protection multiple contre les doubles clics
            if (this.isExporting) {
                console.log('⚠️ Export déjà en cours, ignoré');
                return;
            }

            // Protection temporelle supplémentaire
            if (this.exportProtectionTimer) {
                console.log('⚠️ Protection temporelle active, export ignoré');
                return;
            }

            this.exportResults();
            return;
        }

        // Gestion du bouton import
        if (e.target.closest('#importBtn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔥 Clic détecté sur le bouton import');
            const importFile = document.getElementById('importFile');
            if (importFile) importFile.click();
            return;
        }
    }

    /**
     * Gestion du clic sur un item
     */
    handleItemClick(item) {
        const itemName = item.dataset.item;
        if (!itemName) return;

        const currentState = this.preferences.get(itemName) || 'none';
        const currentIndex = this.config.preferenceStates.indexOf(currentState);
        const newState = this.config.preferenceStates[(currentIndex + 1) % this.config.preferenceStates.length];

        // Mise à jour de l'état
        if (newState === 'none') {
            this.preferences.delete(itemName);
        } else {
            this.preferences.set(itemName, newState);
        }

        // Mise à jour visuelle
        this.updateItemVisualState(item, newState);

        // Mise à jour des stats avec debounce
        this.debouncedUpdateInterface();
    }

    /**
     * Mise à jour de l'état visuel d'un item
     */
    updateItemVisualState(item, newState) {
        // Nettoyer toutes les classes d'état
        this.config.validImportStates.forEach(state => {
            item.classList.remove(state);
        });

        // Ajouter la nouvelle classe si nécessaire
        if (newState !== 'none') {
            item.classList.add(newState);
        }
    }

    /**
     * Mise à jour de l'interface avec debounce
     */
    debouncedUpdateInterface() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            this.updateInterface();
        }, this.config.debounceDelay);
    }

    /**
     * Mise à jour complète de l'interface
     */
    updateInterface() {
        this.updateStats();
        this.updateCategoryCounters();
    }

    /**
     * Mise à jour des statistiques
     */
    updateStats() {
        if (!this.kinkData?.preferenceTypes) return;

        const stats = new Map();

        // Initialiser les compteurs
        this.kinkData.preferenceTypes.forEach(type => {
            stats.set(type.id, 0);
        });

        // Compter les préférences
        this.preferences.forEach(pref => {
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
     */
    countSelectedItems(items) {
        let count = 0;
        items.forEach(item => {
            const itemName = item.dataset.item;
            if (itemName && this.preferences.has(itemName)) {
                count++;
            }
        });
        return count;
    }

    /**
     * CORRECTION PRINCIPALE : Export avec protection renforcée contre les doublons
     */
    exportResults() {
        console.log('🔤 Début de l\'export...');

        // Protection principale
        if (this.isExporting) {
            console.log('⚠️ Export déjà en cours, annulation');
            return;
        }

        // Activation de la protection
        this.isExporting = true;
        
        // Protection temporelle (timer de sécurité)
        this.exportProtectionTimer = setTimeout(() => {
            this.exportProtectionTimer = null;
        }, 2000); // 2 secondes de protection

        // Désactiver le bouton
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Export en cours...';
        }

        try {
            const preferences = Object.fromEntries(this.preferences);
            const selectedCount = this.preferences.size;

            if (selectedCount === 0) {
                this.showToast('Aucune préférence sélectionnée à exporter', 'warning');
                return;
            }

            const exportData = {
                timestamp: new Date().toISOString(),
                totalSelected: selectedCount,
                preferences: preferences,
                summary: this.generateExportSummary()
            };

            // CORRECTION : Téléchargement sécurisé
            this.downloadJsonFile(exportData, `Mes_preferences_${this.getDateString()}.json`);
            this.showToast(`${selectedCount} préférences exportées avec succès !`, 'success');

            console.log('✅ Export terminé avec succès');

        } catch (error) {
            console.error('❌ Erreur lors de l\'export:', error);
            this.handleError('Erreur lors de l\'export des préférences', error);
        } finally {
            // Réactivation après délai de sécurité
            setTimeout(() => {
                this.isExporting = false;
                
                // Réactiver le bouton
                const exportBtn2 = document.getElementById('exportBtn');
                if (exportBtn2) {
                    exportBtn2.disabled = false;
                    exportBtn2.innerHTML = '<i class="fas fa-download"></i> Exporter mes préférences';
                }
                
                console.log('🔓 Export réactivé');
            }, 1000); // 1 seconde de délai
        }
    }

    /**
     * Génération du résumé d'export
     */
    generateExportSummary() {
        const summary = {};

        if (this.kinkData?.preferenceTypes) {
            this.kinkData.preferenceTypes.forEach(type => {
                summary[type.id] = Array.from(this.preferences.values()).filter(v => v === type.id).length;
            });
        }

        return summary;
    }

    /**
     * CORRECTION : Téléchargement sécurisé d'un fichier JSON
     */
    downloadJsonFile(data, filename) {
        console.log('💾 Début du téléchargement:', filename);

        try {
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            // Création du lien de téléchargement
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = filename;
            
            // Style invisible
            link.style.position = 'absolute';
            link.style.left = '-9999px';
            
            // Ajout temporaire au DOM
            document.body.appendChild(link);

            // Déclenchement du téléchargement
            link.click();

            // Nettoyage immédiat et sécurisé
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
                URL.revokeObjectURL(link.href);
            }, 100);

            console.log('✅ Téléchargement déclenché avec succès');

        } catch (error) {
            console.error('❌ Erreur lors du téléchargement:', error);
            throw error;
        }
    }

    /**
     * Génération d'une chaîne de date
     */
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Import des résultats
     */
    async importResults(input) {
        if (this.isImporting) {
            console.log('⚠️ Import déjà en cours...');
            return;
        }

        const file = input.files[0];
        if (!file) return;

        this.isImporting = true;
        console.log('🔥 Début de l\'import...');

        try {
            await this.validateAndImportFile(file);
            console.log('✅ Import terminé avec succès');
        } catch (error) {
            this.showToast(error.message, 'danger');
        } finally {
            input.value = '';
            setTimeout(() => {
                this.isImporting = false;
                console.log('🔓 Import réactivé');
            }, 500);
        }
    }

    /**
     * Validation et import du fichier
     */
    async validateAndImportFile(file) {
        // Validation du type de fichier
        if (!file.type.includes('application/json') && !file.name.endsWith('.json')) {
            throw new Error('Veuillez sélectionner un fichier JSON valide');
        }

        // Validation de la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Le fichier est trop volumineux (max 5MB)');
        }

        const data = await this.readFileAsJson(file);
        const validPreferences = this.validateImportData(data);

        this.applyImportedPreferences(validPreferences);

        const importedCount = validPreferences.size;
        this.showToast(`Préférences importées avec succès ! (${importedCount} éléments)`, 'success');
    }

    /**
     * Lecture d'un fichier comme JSON
     */
    readFileAsJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Fichier JSON invalide'));
                }
            };

            reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
            reader.readAsText(file);
        });
    }

    /**
     * Validation des données d'import
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Fichier JSON invalide');
        }

        if (!data.preferences || typeof data.preferences !== 'object') {
            throw new Error('Fichier invalide : aucune préférence trouvée');
        }

        const validPreferences = new Map();

        Object.entries(data.preferences).forEach(([key, value]) => {
            if (typeof key === 'string' && this.config.validImportStates.includes(value)) {
                validPreferences.set(key, value);
            }
        });

        return validPreferences;
    }

    /**
     * Application des préférences importées
     */
    applyImportedPreferences(validPreferences) {
        this.resetAllPreferences();
        this.preferences = validPreferences;
        this.updateAllItems();
        this.updateInterface();
    }

    /**
     * Réinitialisation de toutes les préférences
     */
    resetAllPreferences() {
        const items = document.querySelectorAll('.item');
        items.forEach(item => {
            this.config.validImportStates.forEach(state => {
                item.classList.remove(state);
            });
        });
        this.preferences.clear();
    }

    /**
     * Mise à jour de tous les items
     */
    updateAllItems() {
        const items = document.querySelectorAll('.item');
        items.forEach(item => {
            const itemName = item.dataset.item;
            if (itemName && this.preferences.has(itemName)) {
                const preference = this.preferences.get(itemName);
                if (preference !== 'none') {
                    // Nettoyer d'abord les anciennes classes
                    this.config.validImportStates.forEach(state => {
                        item.classList.remove(state);
                    });
                    // Ajouter la nouvelle classe
                    item.classList.add(preference);
                }
            }
        });
    }

    /**
     * Affichage des toasts
     */
    showToast(message, type = 'success') {
        try {
            // Supprimer les anciens toasts
            this.removeExistingToasts();

            const toast = this.createToastElement(message, type);
            document.body.appendChild(toast);

            // Animation d'entrée
            requestAnimationFrame(() => {
                toast.style.animation = 'slideIn 0.3s ease';
            });

            // Suppression automatique
            setTimeout(() => this.removeToast(toast), this.config.toastDuration);

        } catch (error) {
            console.error('Erreur lors de l\'affichage du toast:', error);
            alert(message); // Fallback
        }
    }

    /**
     * Création d'un élément toast
     */
    createToastElement(message, type) {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed toast-notification`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';

        const iconMap = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            danger: 'exclamation-circle'
        };

        const icon = iconMap[type] || 'info-circle';
        toast.innerHTML = `<i class="fas fa-${icon} me-2"></i>${this.escapeHtml(message)}`;

        return toast;
    }

    /**
     * Suppression des toasts existants
     */
    removeExistingToasts() {
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());
    }

    /**
     * Suppression animée d'un toast
     */
    removeToast(toast) {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }

    /**
     * Gestion des erreurs
     */
    handleError(message, error) {
        console.error(message, error);
        this.showToast(message, 'danger');
    }

    /**
     * Utilitaire pour échapper le HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// CORRECTION PRINCIPALE : Une seule initialisation globale
let kinkApp = null;
let isAppInitialized = false;

// Initialisation sécurisée de l'application
document.addEventListener('DOMContentLoaded', async () => {
    // Protection contre la double initialisation
    if (isAppInitialized) {
        console.warn('⚠️ Application déjà initialisée, annulation');
        return;
    }
    
    isAppInitialized = true;
    console.log('🚀 DOM chargé, démarrage de l\'application...');
    
    // Timeout de sécurité
    const safetyTimeout = setTimeout(() => {
        console.log('⏰ Timeout de sécurité - Masquage forcé du chargement');
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('show');
            loading.style.display = 'none';
        }
    }, 10000);
    
    try {
        // Création et initialisation de l'application
        console.log('🔧 Création de l\'instance KinkApp...');
        kinkApp = new KinkPreferencesApp();
        
        console.log('⚡ Initialisation de l\'application...');
        await kinkApp.init();
        console.log('✅ Application initialisée avec succès !');
        
        // Annuler le timeout de sécurité
        clearTimeout(safetyTimeout);
        
        console.log('🎉 Tout est prêt ! Application utilisable.');
        
    } catch (error) {
        console.error('❌ Erreur fatale lors de l\'initialisation:', error);
        
        // Annuler le timeout et masquer le loading même en cas d'erreur
        clearTimeout(safetyTimeout);
        
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('show');
            loading.style.display = 'none';
        }
        
        // Afficher un message d'erreur à l'utilisateur
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger text-center mt-5" role="alert">
                    <h4 class="alert-heading"><i class="fas fa-exclamation-triangle"></i> Erreur de chargement</h4>
                    <p class="mb-3">Une erreur est survenue lors du chargement de l'application.</p>
                    <p class="mb-3"><strong>Détail :</strong> ${error.message}</p>
                    <hr>
                    <p class="mb-0">
                        <button class="btn btn-outline-danger" onclick="location.reload()">
                            <i class="fas fa-refresh"></i> Recharger la page
                        </button>
                    </p>
                </div>
            `;
        }
    }
});