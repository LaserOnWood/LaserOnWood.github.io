/**
 * Module de lazy loading pour l'application KinkList
 * Version corrigée avec gestion des compteurs de catégories
 */

export class LazyLoadingManager {
    constructor(kinkData, uiGenerator, preferencesManager, statsManager) {
        this.kinkData = kinkData;
        this.uiGenerator = uiGenerator;
        this.preferencesManager = preferencesManager;
        this.statsManager = statsManager;
        this.observer = null;
        this.loadedCategories = new Set();
        this.loadingQueue = [];
        this.isLoading = false;
        this.batchSize = 5; // Nombre d'items à charger par batch
        this.options = {
            root: null,
            rootMargin: '200px', // Charger 200px avant d'être visible
            threshold: 0.01
        };
    }

    /**
     * Initialise le lazy loading
     */
    initialize() {
        this.createIntersectionObserver();
        this.setupLazyCategories();
        console.log('✅ Lazy loading initialisé');
    }

    /**
     * Crée l'Intersection Observer
     */
    createIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                this.options
            );
        } else {
            console.warn('⚠️ IntersectionObserver non supporté, chargement normal');
            this.loadAllCategories();
        }
    }

    /**
     * Configure les catégories pour le lazy loading
     */
    setupLazyCategories() {
        const container = document.getElementById('categoriesAccordion');
        if (!container) return;

        // Vider le conteneur
        container.innerHTML = '';

        // Créer des placeholders pour chaque catégorie
        this.kinkData.categories.forEach((category, index) => {
            const placeholder = this.createCategoryPlaceholder(category, index);
            container.appendChild(placeholder);

            // Observer le placeholder
            if (this.observer) {
                this.observer.observe(placeholder);
            }
        });

        // Mettre à jour les compteurs après un court délai
        setTimeout(() => {
            this.updateAllCounters();
        }, 100);
    }

    /**
     * Crée un placeholder pour une catégorie
     * @param {Object} category - Données de la catégorie
     * @param {number} index - Index de la catégorie
     * @returns {HTMLElement}
     */
    createCategoryPlaceholder(category, index) {
        const placeholder = document.createElement('div');
        placeholder.className = 'accordion-item category-placeholder';
        placeholder.dataset.categoryId = category.id;
        placeholder.dataset.categoryIndex = index;
        placeholder.style.minHeight = '60px';

        // Afficher un skeleton loader
        placeholder.innerHTML = `
            <div class="accordion-header">
                <div class="skeleton-loader">
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-text"></div>
                    <span class="category-counter" id="counter-${category.id}">0/0</span>
                </div>
            </div>
        `;

        return placeholder;
    }

    /**
     * Gère l'intersection d'un élément
     * @param {IntersectionObserverEntry[]} entries
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const placeholder = entry.target;
                const categoryId = placeholder.dataset.categoryId;

                // Ne charger qu'une fois
                if (!this.loadedCategories.has(categoryId)) {
                    this.loadCategory(placeholder);
                    this.observer.unobserve(placeholder);
                }
            }
        });
    }

    /**
     * Charge une catégorie spécifique
     * @param {HTMLElement} placeholder - Placeholder à remplacer
     */
    async loadCategory(placeholder) {
        const categoryId = placeholder.dataset.categoryId;
        const categoryIndex = parseInt(placeholder.dataset.categoryIndex);

        try {
            // Marquer comme chargé
            this.loadedCategories.add(categoryId);

            // Trouver la catégorie dans les données
            const category = this.kinkData.categories[categoryIndex];

            if (!category) {
                console.error('Catégorie introuvable:', categoryId);
                return;
            }

            // Animation de chargement
            placeholder.style.opacity = '0.5';

            // Simuler un délai de chargement (optionnel, pour effet visuel)
            await this.sleep(50);

            // Créer le contenu réel de la catégorie
            const categoryElement = this.createCategoryContent(category);

            // Remplacer le placeholder
            placeholder.replaceWith(categoryElement);

            // Animation d'apparition
            requestAnimationFrame(() => {
                categoryElement.style.opacity = '0';
                categoryElement.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    categoryElement.style.transition = 'all 0.3s ease';
                    categoryElement.style.opacity = '1';
                    categoryElement.style.transform = 'translateY(0)';
                }, 50);
            });

            // Mettre à jour le compteur de cette catégorie
            this.updateCategoryCounter(category);

            console.log(`✅ Catégorie chargée: ${category.name}`);

        } catch (error) {
            console.error('Erreur lors du chargement de la catégorie:', error);
        }
    }

    /**
     * Crée le contenu d'une catégorie
     * @param {Object} category - Données de la catégorie
     * @returns {HTMLElement}
     */
    createCategoryContent(category) {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';

        // En-tête
        const header = document.createElement('h2');
        header.className = 'accordion-header';
        header.innerHTML = `
            <button class="accordion-button collapsed" type="button" 
                    data-bs-toggle="collapse" data-bs-target="#${category.id}">
                <i class="${category.icon} me-2"></i>
                <span>${this.escapeHtml(category.name)}</span>
                <span class="category-counter" id="counter-${category.id}">0/0</span>
            </button>
        `;

        // Corps (initialement vide, chargé au clic)
        const body = document.createElement('div');
        body.id = category.id;
        body.className = 'accordion-collapse collapse';
        body.setAttribute('data-bs-parent', '#categoriesAccordion');

        // Lazy load du contenu au premier clic
        let contentLoaded = false;
        const button = header.querySelector('button');
        button.addEventListener('click', async () => {
            if (!contentLoaded) {
                contentLoaded = true;
                await this.loadCategoryItems(body, category);
                // Mettre à jour le compteur après chargement des items
                this.updateCategoryCounter(category);
            }
        });

        accordionItem.appendChild(header);
        accordionItem.appendChild(body);

        return accordionItem;
    }

    /**
     * Charge les items d'une catégorie
     * @param {HTMLElement} bodyElement - Élément corps de l'accordéon
     * @param {Object} category - Données de la catégorie
     */
    async loadCategoryItems(bodyElement, category) {
        // Afficher un loader temporaire
        bodyElement.innerHTML = `
            <div class="accordion-body text-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="text-muted mt-2 mb-0">Chargement des items...</p>
            </div>
        `;

        // Simuler un petit délai
        await this.sleep(100);

        // Créer le contenu réel
        const bodyContent = document.createElement('div');
        bodyContent.className = 'accordion-body';

        if (category.description) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-info text-center';
            alert.innerHTML = `<i class="fas fa-info-circle me-2"></i>${this.escapeHtml(category.description)}`;
            bodyContent.appendChild(alert);
        }

        // Bouton d'ajout d'item personnalisé
        const addItemBtn = document.createElement('button');
        addItemBtn.className = 'btn btn-sm btn-outline-success mb-3 w-100 add-custom-item-btn';
        addItemBtn.setAttribute('data-category-id', category.id);
        addItemBtn.setAttribute('data-is-custom', category.isCustom ? 'true' : 'false');
        addItemBtn.innerHTML = '<i class="fas fa-plus"></i> Ajouter un item personnalisé';
        bodyContent.appendChild(addItemBtn);

        // Grille d'items avec lazy loading progressif
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'items-grid';

        const items = this.getCategoryItems(category);
        
        // Charger les items par batches
        await this.loadItemsInBatches(itemsGrid, items, category.id);

        bodyContent.appendChild(itemsGrid);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(bodyContent);

        // Appliquer les préférences existantes aux items
        this.applyExistingPreferences(itemsGrid);
    }

    /**
     * Applique les préférences existantes aux items nouvellement chargés
     * @param {HTMLElement} itemsGrid - Grille contenant les items
     */
    applyExistingPreferences(itemsGrid) {
        const items = itemsGrid.querySelectorAll('.item');
        const preferences = this.preferencesManager.getAllPreferences();
        const validStates = ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'];

        items.forEach(item => {
            const itemName = item.dataset.item;
            if (itemName && preferences.has(itemName)) {
                const preference = preferences.get(itemName);
                if (preference !== 'none') {
                    // Retirer les anciennes classes
                    validStates.forEach(state => item.classList.remove(state));
                    // Ajouter la nouvelle classe
                    item.classList.add(preference);
                }
            }
        });
    }

    /**
     * Charge les items par batches
     * @param {HTMLElement} container - Conteneur des items
     * @param {Array} items - Liste des items
     * @param {string} categoryId - ID de la catégorie
     */
    async loadItemsInBatches(container, items, categoryId) {
        const batches = this.chunkArray(items, this.batchSize);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const fragment = document.createDocumentFragment();

            batch.forEach(item => {
                const itemElement = this.createItemElement(item, categoryId);
                fragment.appendChild(itemElement);
            });

            container.appendChild(fragment);

            // Petit délai entre les batches pour ne pas bloquer l'UI
            if (i < batches.length - 1) {
                await this.sleep(50);
            }
        }
    }

    /**
     * Crée un élément item
     * @param {string|Object} item - Données de l'item
     * @param {string} categoryId - ID de la catégorie
     * @returns {HTMLElement}
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
     * Récupère tous les items d'une catégorie
     * @param {Object} category - Catégorie
     * @returns {Array}
     */
    getCategoryItems(category) {
        const items = [];

        if (category.hasSubcategories && category.subcategories) {
            category.subcategories.forEach(subcat => {
                if (subcat.items) {
                    items.push(...subcat.items);
                }
            });
        } else if (category.items) {
            items.push(...category.items);
        }

        return items;
    }

    /**
     * Met à jour le compteur d'une catégorie
     * @param {Object} category - Catégorie
     */
    updateCategoryCounter(category) {
        const preferences = this.preferencesManager.getAllPreferences();
        const items = this.getCategoryItems(category);
        
        let selectedCount = 0;
        items.forEach(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            if (preferences.has(itemName)) {
                selectedCount++;
            }
        });

        const counter = document.getElementById(`counter-${category.id}`);
        if (counter) {
            counter.textContent = `${selectedCount}/${items.length}`;
        }
    }

    /**
     * Met à jour tous les compteurs de catégories
     */
    updateAllCounters() {
        this.kinkData.categories.forEach(category => {
            this.updateCategoryCounter(category);
        });
    }

    /**
     * Charge toutes les catégories (fallback)
     */
    loadAllCategories() {
        const container = document.getElementById('categoriesAccordion');
        if (!container) return;

        container.innerHTML = '';

        this.kinkData.categories.forEach(category => {
            const categoryElement = this.createCategoryContent(category);
            container.appendChild(categoryElement);
            this.loadedCategories.add(category.id);
        });

        // Mettre à jour tous les compteurs
        this.updateAllCounters();
    }

    /**
     * Pré-charge les catégories visibles
     * @param {number} count - Nombre de catégories à pré-charger
     */
    preloadVisibleCategories(count = 3) {
        const placeholders = document.querySelectorAll('.category-placeholder');
        
        Array.from(placeholders)
            .slice(0, count)
            .forEach(placeholder => {
                this.loadCategory(placeholder);
                if (this.observer) {
                    this.observer.unobserve(placeholder);
                }
            });
    }

    /**
     * Rafraîchit les catégories chargées
     */
    refresh() {
        this.loadedCategories.clear();
        this.setupLazyCategories();
    }

    /**
     * Déconnecte l'observer
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    /**
     * Utilitaires
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}