/**
 * Module de recherche pour l'application KinkList
 * Permet de filtrer les catégories et items en temps réel
 */
import { debounce } from './core-utils.js';

export class SearchManager {
    constructor(kinkData, uiGenerator = null) {
        this.kinkData = kinkData;
        this.uiGenerator = uiGenerator;
        this.searchInput = null;
        this.clearButton = null;
        this.isSearchActive = false;
        this.originalDisplay = new Map(); // Pour restaurer l'affichage original

        // Debounce de la recherche pour optimiser les performances
        this.debouncedSearch = debounce((query) => {
            this.performSearch(query);
        }, 300);
    }

    /**
     * Initialise le module de recherche
     */
    initialize() {
        this.searchInput = document.getElementById('globalSearch');
        this.clearButton = document.getElementById('clearSearch');

        if (!this.searchInput || !this.clearButton) {
            console.warn('⚠️ Éléments de recherche non trouvés');
            return;
        }

        // Event listener sur l'input de recherche
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (query.length === 0) {
                this.clearSearch();
            } else if (query.length >= 2) {
                this.debouncedSearch(query);
            }
        });

        // Event listener sur le bouton clear
        this.clearButton.addEventListener('click', () => {
            this.clearSearch();
        });

        // Raccourci clavier : Ctrl+F pour focus
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.searchInput.focus();
            }

            // Escape pour effacer la recherche
            if (e.key === 'Escape' && this.isSearchActive) {
                this.clearSearch();
            }
        });

        console.log('✅ Module de recherche initialisé');
    }

    /**
     * Effectue la recherche
     * @param {string} query - Terme de recherche
     */
    performSearch(query) {
        // La recherche porte sur l’ensemble du catalogue : elle demande donc
        // explicitement le rendu des sections encore non matérialisées.
        this.uiGenerator?.renderAllCategories();

        const normalizedQuery = this.normalizeString(query);

        if (normalizedQuery.length < 2) return;

        this.isSearchActive = true;
        this.searchInput.classList.add('active');

        let foundCount = 0;
        let matchedCategories = new Set();

        // Parcourir toutes les catégories
        this.kinkData.categories.forEach(category => {
            const categoryMatches = this.searchInCategory(category, normalizedQuery);

            if (categoryMatches.itemsFound > 0 || categoryMatches.categoryNameMatch) {
                matchedCategories.add(category.id);
                foundCount += categoryMatches.itemsFound;

                // Ouvrir l'accordéon de la catégorie
                this.expandCategory(category.id);
            } else {
                // Masquer la catégorie
                this.hideCategory(category.id);
            }
        });

        // Afficher le résultat de la recherche
        this.showSearchResults(foundCount, matchedCategories.size);

        console.log(`🔍 Recherche "${query}": ${foundCount} items trouvés dans ${matchedCategories.size} catégories`);
    }

    /**
     * Recherche dans une catégorie
     * @param {Object} category - Catégorie à parcourir
     * @param {string} query - Terme de recherche normalisé
     * @returns {Object} Résultats de la recherche
     */
    searchInCategory(category, query) {
        const result = {
            itemsFound: 0,
            categoryNameMatch: false
        };

        // Vérifier si le nom de la catégorie correspond
        const categoryName = this.normalizeString(category.name);
        if (categoryName.includes(query)) {
            result.categoryNameMatch = true;
        }

        // Parcourir les items
        if (category.hasSubcategories && category.subcategories) {
            // Catégorie avec sous-catégories
            category.subcategories.forEach(subcat => {
                const subcatResult = this.searchInSubcategory(subcat, query);
                result.itemsFound += subcatResult.itemsFound;

                if (subcatResult.itemsFound > 0 || subcatResult.subcategoryNameMatch) {
                    this.expandCategory(subcat.id);
                } else {
                    this.hideCategory(subcat.id);
                }
            });
        } else {
            // Catégorie simple
            result.itemsFound = this.searchInItems(category.items || [], category.id, query);
        }

        return result;
    }

    /**
     * Recherche dans une sous-catégorie
     * @param {Object} subcategory - Sous-catégorie
     * @param {string} query - Terme de recherche
     * @returns {Object} Résultats
     */
    searchInSubcategory(subcategory, query) {
        const result = {
            itemsFound: 0,
            subcategoryNameMatch: false
        };

        const subcatName = this.normalizeString(subcategory.name);
        if (subcatName.includes(query)) {
            result.subcategoryNameMatch = true;
        }

        result.itemsFound = this.searchInItems(subcategory.items || [], subcategory.id, query);

        return result;
    }

    /**
     * Recherche dans une liste d'items
     * @param {Array} items - Liste des items
     * @param {string} categoryId - ID de la catégorie
     * @param {string} query - Terme de recherche
     * @returns {number} Nombre d'items trouvés
     */
    searchInItems(items, categoryId, query) {
        let foundCount = 0;

        items.forEach(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            const itemDescription = typeof item === 'object' ? item.description : '';

            const normalizedName = this.normalizeString(itemName);
            const normalizedDesc = this.normalizeString(itemDescription);

            const itemElement = document.querySelector(this.getItemSelector(itemName, categoryId));

            if (itemElement) {
                if (normalizedName.includes(query) || normalizedDesc.includes(query)) {
                    // Item trouvé : afficher et surligner
                    itemElement.style.display = '';
                    itemElement.classList.add('search-highlight');
                    foundCount++;
                } else {
                    // Item non trouvé : masquer
                    itemElement.style.display = 'none';
                    itemElement.classList.remove('search-highlight');
                }
            }
        });

        return foundCount;
    }

    getItemSelector(itemName, categoryId) {
        const escape = window.CSS?.escape
            ? window.CSS.escape
            : (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `[data-item="${escape(itemName)}"][data-category="${escape(categoryId)}"]`;
    }

    /**
     * Ouvre un accordéon de catégorie
     * @param {string} categoryId - ID de la catégorie
     */
    expandCategory(categoryId) {
        const categoryElement = document.getElementById(categoryId);
        const button = document.querySelector(`[data-bs-target="#${categoryId}"]`);

        if (categoryElement && button) {
            // Afficher la catégorie
            const accordionItem = categoryElement.closest('.accordion-item');
            if (accordionItem) {
                accordionItem.style.display = '';
            }

            // Ouvrir l'accordéon
            if (!categoryElement.classList.contains('show')) {
                button.click();
            }
        }
    }

    /**
     * Masque une catégorie
     * @param {string} categoryId - ID de la catégorie
     */
    hideCategory(categoryId) {
        const categoryElement = document.getElementById(categoryId);

        if (categoryElement) {
            const accordionItem = categoryElement.closest('.accordion-item');
            if (accordionItem) {
                accordionItem.style.display = 'none';
            }
        }
    }

    /**
     * Affiche les résultats de recherche
     * @param {number} itemCount - Nombre d'items trouvés
     * @param {number} categoryCount - Nombre de catégories trouvées
     */
    showSearchResults(itemCount, categoryCount) {
        // Supprimer l'ancien message s'il existe
        const oldMessage = document.getElementById('searchResultMessage');
        if (oldMessage) oldMessage.remove();

        if (itemCount === 0) {
            // Aucun résultat
            const message = document.createElement('div');
            message.id = 'searchResultMessage';
            message.className = 'alert alert-warning text-center animate__animated animate__fadeIn';
            message.innerHTML = `
                <i class="fas fa-search"></i>
                Aucun résultat trouvé pour votre recherche
            `;

            const accordion = document.getElementById('categoriesAccordion');
            if (accordion) {
                accordion.insertAdjacentElement('beforebegin', message);
            }
        } else {
            // Résultats trouvés
            const message = document.createElement('div');
            message.id = 'searchResultMessage';
            message.className = 'alert alert-info text-center animate__animated animate__fadeIn';
            message.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <strong>${itemCount}</strong> résultat${itemCount > 1 ? 's' : ''}
                dans <strong>${categoryCount}</strong> catégorie${categoryCount > 1 ? 's' : ''}
            `;

            const accordion = document.getElementById('categoriesAccordion');
            if (accordion) {
                accordion.insertAdjacentElement('beforebegin', message);
            }
        }
    }

    /**
     * Efface la recherche et restaure l'affichage
     */
    clearSearch() {
        this.searchInput.value = '';
        this.isSearchActive = false;
        this.searchInput.classList.remove('active');

        // Supprimer le message de résultats
        const message = document.getElementById('searchResultMessage');
        if (message) message.remove();

        // Restaurer tous les items
        const allItems = document.querySelectorAll('.item');
        allItems.forEach(item => {
            item.style.display = '';
            item.classList.remove('search-highlight');
        });

        // Restaurer toutes les catégories
        const allAccordionItems = document.querySelectorAll('.accordion-item');
        allAccordionItems.forEach(item => {
            item.style.display = '';
        });

        // Fermer tous les accordéons ouverts
        const openAccordions = document.querySelectorAll('.accordion-collapse.show');
        openAccordions.forEach(accordion => {
            const button = document.querySelector(`[data-bs-target="#${accordion.id}"]`);
            if (button && !button.classList.contains('collapsed')) {
                button.click();
            }
        });

        console.log('🧹 Recherche effacée');
    }

    /**
     * Normalise une chaîne pour la recherche
     * @param {string} str - Chaîne à normaliser
     * @returns {string} Chaîne normalisée
     */
    normalizeString(str) {
        if (!str) return '';

        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
            .trim();
    }

    /**
     * Nettoyage
     */
    cleanup() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.clearSearch();
    }
}
