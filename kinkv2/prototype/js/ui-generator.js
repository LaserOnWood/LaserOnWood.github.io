/**
 * Module de génération d'interface utilisateur pour l'application de gestion des préférences Kink
 */
import { escapeHtml } from './core-utils.js';

/**
 * Classe responsable de la génération de l'interface utilisateur
 */
export class UIGenerator {
    constructor(kinkData, preferencesManager = null) {
        this.kinkData = kinkData;
        this.preferencesManager = preferencesManager;
        this.categoryById = new Map(kinkData.categories.map(category => [category.id, category]));
        this.renderedContentIds = new Set();
    }

    /**
     * Génération complète de l'interface
     */
    generateInterface() {
        this.generateStatsSection();
        this.generateCategoriesAccordion();
        this.generateQuickNav();
        this.initializeLazyRendering();
    }

    /**
     * Génération de la section statistiques (Légende classique)
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
     * @param {string} name - Nom du badge
     * @param {string} id - ID du badge
     * @param {string} color - Couleur du badge
     * @returns {HTMLElement} Élément badge
     */
    createStatBadge(name, id, color) {
        const badge = document.createElement('div');
        badge.className = 'stat-badge';
        badge.style.background = color;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;

        const countSpan = document.createElement('span');
        countSpan.className = 'count';
        countSpan.id = `${id}-count`;
        countSpan.textContent = '0';

        badge.appendChild(nameSpan);
        badge.appendChild(countSpan);

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
     * @param {Object} category - Données de la catégorie
     * @returns {HTMLElement} Élément accordéon
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
     * @param {Object} category - Données de la catégorie
     * @returns {HTMLElement} En-tête de catégorie
     */
    createCategoryHeader(category) {
        const headerElement = document.createElement('h2');
        headerElement.className = 'accordion-header';

        const button = document.createElement('button');
        button.className = 'accordion-button collapsed';
        button.type = 'button';
        button.dataset.bsToggle = 'collapse';
        button.dataset.bsTarget = `#${category.id}`;
        button.setAttribute('aria-expanded', 'false');

        const icon = document.createElement('i');
        icon.className = `${category.icon} me-2`;

        const title = document.createElement('span');
        title.textContent = category.name;

        const counter = document.createElement('span');
        counter.className = 'category-counter';
        counter.id = `counter-${category.id}`;

        button.appendChild(icon);
        button.appendChild(title);
        button.appendChild(counter);
        headerElement.appendChild(button);

        return headerElement;
    }

    /**
     * Création du corps d'une catégorie
     * @param {Object} category - Données de la catégorie
     * @returns {HTMLElement} Corps de catégorie
     */
    createCategoryBody(category) {
        const bodyElement = document.createElement('div');
        bodyElement.id = category.id;
        bodyElement.className = 'accordion-collapse collapse';
        bodyElement.setAttribute('data-bs-parent', '#categoriesAccordion');
        bodyElement.dataset.lazyContent = 'true';
        bodyElement.dataset.rendered = 'false';

        const bodyContent = document.createElement('div');
        bodyContent.className = 'accordion-body';
        bodyElement.appendChild(bodyContent);
        return bodyElement;
    }

    /**
     * Ne construit les cartes que lorsqu’une section devient utile.
     * La recherche peut demander explicitement le rendu complet.
     */
    initializeLazyRendering() {
        const accordion = document.getElementById('categoriesAccordion');
        if (!accordion) return;

        accordion.addEventListener('show.bs.collapse', (event) => {
            this.renderContentForId(event.target.id);
        });
    }

    renderAllCategories() {
        this.kinkData.categories.forEach(category => {
            this.renderContentForId(category.id);
            if (category.hasSubcategories) {
                category.subcategories.forEach(subcategory => this.renderContentForId(subcategory.id));
            }
        });
    }

    renderContentForId(id) {
        if (this.renderedContentIds.has(id)) return;

        const category = this.categoryById.get(id);
        if (category) {
            this.renderCategoryBody(category);
            return;
        }

        for (const parentCategory of this.kinkData.categories) {
            const subcategory = parentCategory.subcategories?.find(item => item.id === id);
            if (subcategory) {
                this.renderSubcategoryBody(subcategory);
                return;
            }
        }
    }

    renderCategoryBody(category) {
        const body = document.getElementById(category.id);
        const content = body?.querySelector('.accordion-body');
        if (!body || !content || this.renderedContentIds.has(category.id)) return;

        if (category.description) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-info text-center';
            alert.innerHTML = `<i class="fas fa-info-circle me-2"></i>${escapeHtml(category.description)}`;
            content.appendChild(alert);
        }

        const addItemBtn = document.createElement('button');
        addItemBtn.className = 'btn btn-sm btn-outline-success mb-3 w-100 add-custom-item-btn';
        addItemBtn.dataset.categoryId = category.id;
        addItemBtn.dataset.isCustom = category.isCustom ? 'true' : 'false';
        addItemBtn.innerHTML = '<i class="fas fa-plus"></i> Ajouter un item personnalisé';
        content.appendChild(addItemBtn);

        if (category.hasSubcategories && category.subcategories) {
            content.appendChild(this.createSubcategoriesAccordion(category));
        } else if (category.items) {
            content.appendChild(this.createItemsGrid(category.items, category.id));
        }

        body.dataset.rendered = 'true';
        this.renderedContentIds.add(category.id);
        document.dispatchEvent(new CustomEvent('categoryRendered', { detail: { id: category.id } }));
    }

    renderSubcategoryBody(subcategory) {
        const body = document.getElementById(subcategory.id);
        const content = body?.querySelector('.accordion-body');
        if (!body || !content || this.renderedContentIds.has(subcategory.id)) return;

        content.appendChild(this.createItemsGrid(subcategory.items || [], subcategory.id));
        body.dataset.rendered = 'true';
        this.renderedContentIds.add(subcategory.id);
        document.dispatchEvent(new CustomEvent('categoryRendered', { detail: { id: subcategory.id } }));
    }

    /**
     * Ajoute les event listeners pour les boutons d'ajout d'item personnalisé
     * @param {CustomUIManager} customUIManager - Instance du CustomUIManager
     */
    static initializeCustomItemButtons(customUIManager) {
        // Utiliser la délégation d'événements sur le conteneur principal pour plus de fiabilité
        const accordion = document.getElementById('categoriesAccordion');
        if (accordion) {
            accordion.addEventListener('click', (e) => {
                const button = e.target.closest('.add-custom-item-btn');
                if (button) {
                    const categoryId = button.dataset.categoryId;
                    const isCustom = button.dataset.isCustom === 'true';
                    customUIManager.showAddItemModal(categoryId, isCustom);
                }
            });
        }
    }

    /**
     * Création de l'accordéon pour les sous-catégories
     * @param {Object} category - Données de la catégorie
     * @returns {HTMLElement} Accordéon des sous-catégories
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
     * @param {Object} subcat - Données de la sous-catégorie
     * @param {string} parentId - ID de la catégorie parent
     * @returns {HTMLElement} Élément accordéon de sous-catégorie
     */
    createSubcategoryAccordionItem(subcat, parentId) {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';

        // En-tête de la sous-catégorie
        const header = document.createElement('h2');
        header.className = 'accordion-header';

        const button = document.createElement('button');
        button.className = 'accordion-button collapsed';
        button.type = 'button';
        button.dataset.bsToggle = 'collapse';
        button.dataset.bsTarget = `#${subcat.id}`;
        button.setAttribute('aria-expanded', 'false');

        const icon = document.createElement('i');
        icon.className = `${subcat.icon} me-2`;

        const title = document.createElement('span');
        title.textContent = subcat.name;

        const counter = document.createElement('span');
        counter.className = 'category-counter';
        counter.id = `counter-${subcat.id}`;

        button.appendChild(icon);
        button.appendChild(title);
        button.appendChild(counter);
        header.appendChild(button);

        // Corps de la sous-catégorie
        const body = document.createElement('div');
        body.id = subcat.id;
        body.className = 'accordion-collapse collapse';
        body.setAttribute('data-bs-parent', `#accordion${parentId}`);

        const bodyContent = document.createElement('div');
        bodyContent.className = 'accordion-body';

        body.dataset.lazyContent = 'true';
        body.dataset.rendered = 'false';
        body.appendChild(bodyContent);
        accordionItem.appendChild(header);
        accordionItem.appendChild(body);

        return accordionItem;
    }

    /**
     * Création de la grille d'items
     * @param {Array} items - Liste des items
     * @param {string} categoryId - ID de la catégorie
     * @returns {HTMLElement} Grille d'items
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
     * @param {string|Object} item - Données de l'item
     * @param {string} categoryId - ID de la catégorie
     * @returns {HTMLElement} Élément item
     */
    createItemElement(item, categoryId) {
        const itemName = typeof item === 'string' ? item : item.name;
        const itemDescription = typeof item === 'object' && item.description ? item.description : '';

        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.dataset.item = itemName;
        itemElement.dataset.category = categoryId;

        const currentState = this.preferencesManager?.getPreference(itemName) || 'none';
        if (currentState !== 'none') {
            itemElement.classList.add(currentState);
        }

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
     * Génération de la navigation rapide latérale
     */
    generateQuickNav() {
        const navContainer = document.getElementById('quickNav');
        if (!navContainer) return;

        const fragment = document.createDocumentFragment();

        this.kinkData.categories.forEach(category => {
            const link = document.createElement('a');
            link.href = `#${category.id}`;
            link.className = 'list-group-item list-group-item-action border-0 py-3 d-flex align-items-center';
            link.style.fontSize = '0.9rem';
            link.style.fontWeight = '500';
            link.style.transition = 'all 0.2s ease';

            const icon = document.createElement('i');
            icon.className = `${category.icon} me-3 text-primary`;
            icon.style.width = '20px';
            icon.style.textAlign = 'center';

            const text = document.createElement('span');
            text.textContent = category.name;

            link.appendChild(icon);
            link.appendChild(text);

            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(category.id);
                if (target) {
                    // Ouvrir l'accordéon si fermé
                    const button = document.querySelector(`[data-bs-target="#${category.id}"]`);
                    if (button && button.classList.contains('collapsed')) {
                        button.click();
                    }

                    // Scroll doux
                    const headerOffset = 100;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            });

            fragment.appendChild(link);
        });

        navContainer.innerHTML = '';
        navContainer.appendChild(fragment);
    }
}
