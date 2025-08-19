/**
 * Module de génération d'interface utilisateur pour l'application de gestion des préférences Kink
 */
import { escapeHtml } from './utils.js';

/**
 * Classe responsable de la génération de l'interface utilisateur
 */
export class UIGenerator {
    constructor(kinkData) {
        this.kinkData = kinkData;
    }

    /**
     * Génération complète de l'interface
     */
    generateInterface() {
        this.generateStatsSection();
        this.generateCategoriesAccordion();
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
     * @param {string} name - Nom du badge
     * @param {string} id - ID du badge
     * @param {string} color - Couleur du badge
     * @returns {HTMLElement} Élément badge
     */
    createStatBadge(name, id, color) {
        const badge = document.createElement('div');
        badge.className = 'stat-badge';
        badge.style.background = color;
        badge.innerHTML = `
            <span>${escapeHtml(name)}</span>
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
        headerElement.innerHTML = `
            <button class="accordion-button collapsed" type="button" 
                    data-bs-toggle="collapse" data-bs-target="#${category.id}" 
                    aria-expanded="false">
                <i class="${category.icon} me-2"></i>
                <span>${escapeHtml(category.name)}</span>
                <span class="category-counter" id="counter-${category.id}"></span>
            </button>
        `;
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

        const bodyContent = document.createElement('div');
        bodyContent.className = 'accordion-body';

        if (category.description) {
            const alert = document.createElement('div');
            alert.className = 'alert alert-info text-center';
            alert.innerHTML = `<i class="fas fa-info-circle me-2"></i>${escapeHtml(category.description)}`;
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
        header.innerHTML = `
            <button class="accordion-button collapsed" type="button" 
                    data-bs-toggle="collapse" data-bs-target="#${subcat.id}" 
                    aria-expanded="false">
                <i class="${subcat.icon} me-2"></i>
                <span>${escapeHtml(subcat.name)}</span>
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
}

