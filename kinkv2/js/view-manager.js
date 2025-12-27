/**
 * Module de gestion des vues alternatives pour l'application KinkList
 * Version corrigée : ne touche pas aux statistiques/légendes
 */
import { escapeHtml } from './utils.js';

export class ViewManager {
    constructor(kinkData, preferencesManager) {
        this.kinkData = kinkData;
        this.preferencesManager = preferencesManager;
        this.currentView = 'accordion'; // Par défaut
        this.viewContainer = null;
        this.availableViews = {
            accordion: { name: 'Accordéon', icon: 'fas fa-list' },
            table: { name: 'Tableau', icon: 'fas fa-table' },
            cards: { name: 'Cartes', icon: 'fas fa-th-large' },
            compact: { name: 'Compacte', icon: 'fas fa-bars' }
        };
    }

    /**
     * Initialise le gestionnaire de vues
     */
    initialize() {
        this.createViewSwitcher();
        this.loadSavedView();
        console.log('✅ Gestionnaire de vues initialisé');
    }

    /**
     * Crée le sélecteur de vues dans l'interface
     */
    createViewSwitcher() {
        // Chercher la section stats (APRÈS les badges de légende)
        const statsSection = document.querySelector('.stats');
        if (!statsSection) return;

        // Vérifier si le sélecteur existe déjà
        if (document.querySelector('.view-switcher')) {
            console.log('⚠️ View switcher déjà présent');
            return;
        }

        const viewSwitcher = document.createElement('div');
        viewSwitcher.className = 'view-switcher mt-3';
        viewSwitcher.innerHTML = `
            <div class="d-flex justify-content-center align-items-center gap-2">
                <span class="text-muted"><i class="fas fa-eye"></i> Vue :</span>
                <div class="btn-group" role="group" aria-label="Sélection de vue">
                    ${Object.entries(this.availableViews).map(([key, view]) => `
                        <button type="button" 
                                class="btn btn-outline-primary btn-sm view-btn ${key === this.currentView ? 'active' : ''}" 
                                data-view="${key}"
                                title="${view.name}">
                            <i class="${view.icon}"></i>
                            <span class="d-none d-md-inline ms-1">${view.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Ajouter APRÈS les stats-badges, pas les remplacer
        statsSection.appendChild(viewSwitcher);

        // Ajouter les event listeners
        viewSwitcher.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
    }

    /**
     * Change la vue active
     * @param {string} viewType - Type de vue à afficher
     */
    switchView(viewType) {
        if (!this.availableViews[viewType]) {
            console.error('Type de vue invalide:', viewType);
            return;
        }

        console.log(`🔄 Changement de vue: ${this.currentView} → ${viewType}`);

        // Mettre à jour les boutons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewType);
        });

        // Sauvegarder la préférence
        this.currentView = viewType;
        localStorage.setItem('kinkv2_preferred_view', viewType);

        // Appliquer la vue
        this.renderView(viewType);
    }

    /**
     * Charge la vue sauvegardée
     */
    loadSavedView() {
        const savedView = localStorage.getItem('kinkv2_preferred_view');
        if (savedView && this.availableViews[savedView]) {
            this.currentView = savedView;
            
            // Mettre à jour le bouton actif
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === savedView);
            });
            
            // Si ce n'est pas l'accordéon (vue par défaut), charger la vue sauvegardée
            if (savedView !== 'accordion') {
                this.renderView(savedView);
            }
        }
    }

    /**
     * Rend la vue sélectionnée
     * @param {string} viewType - Type de vue
     */
    renderView(viewType) {
        const container = document.getElementById('categoriesAccordion');
        if (!container) return;

        // Animation de sortie
        container.style.opacity = '0';
        container.style.transform = 'translateY(10px)';

        setTimeout(() => {
            switch (viewType) {
                case 'table':
                    this.renderTableView(container);
                    break;
                case 'cards':
                    this.renderCardsView(container);
                    break;
                case 'compact':
                    this.renderCompactView(container);
                    break;
                case 'accordion':
                default:
                    this.renderAccordionView(container);
                    break;
            }

            // Animation d'entrée
            setTimeout(() => {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
    }

    /**
     * Vue accordéon (par défaut)
     */
    renderAccordionView(container) {
        // Ne rien faire si c'est déjà la vue accordéon
        if (container.classList.contains('accordion')) {
            console.log('Vue accordéon déjà active');
            return;
        }

        container.className = 'accordion';
        container.innerHTML = '';

        this.kinkData.categories.forEach(category => {
            const accordionItem = this.createAccordionItem(category);
            container.appendChild(accordionItem);
        });

        this.attachItemListeners();
    }

    /**
     * Vue tableau
     */
    renderTableView(container) {
        container.className = 'table-view';
        container.innerHTML = '';

        const preferences = this.preferencesManager.getAllPreferences();

        const table = document.createElement('div');
        table.className = 'table-responsive';
        
        let tableHTML = `
            <table class="table table-hover table-striped">
                <thead class="table-dark sticky-top">
                    <tr>
                        <th style="width: 40%;">Item</th>
                        <th style="width: 25%;">Catégorie</th>
                        <th style="width: 20%;">Préférence</th>
                        <th style="width: 15%;">Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Collecter tous les items
        const allItems = [];
        this.kinkData.categories.forEach(category => {
            if (category.hasSubcategories && category.subcategories) {
                category.subcategories.forEach(subcat => {
                    if (subcat.items) {
                        subcat.items.forEach(item => {
                            const itemName = typeof item === 'string' ? item : item.name;
                            allItems.push({
                                name: itemName,
                                category: `${category.name} - ${subcat.name}`,
                                categoryId: subcat.id
                            });
                        });
                    }
                });
            } else if (category.items) {
                category.items.forEach(item => {
                    const itemName = typeof item === 'string' ? item : item.name;
                    allItems.push({
                        name: itemName,
                        category: category.name,
                        categoryId: category.id
                    });
                });
            }
        });

        // Générer les lignes
        allItems.forEach(item => {
            const preference = preferences.get(item.name) || 'none';
            const preferenceType = this.kinkData.preferenceTypes.find(t => t.id === preference);
            const preferenceLabel = preferenceType ? preferenceType.name : 'Non sélectionné';
            const preferenceColor = preferenceType ? preferenceType.color : 'transparent';

            tableHTML += `
                <tr class="table-item-row" data-item="${escapeHtml(item.name)}" data-category="${item.categoryId}">
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td><small class="text-muted">${escapeHtml(item.category)}</small></td>
                    <td>
                        <span class="badge" style="background: ${preferenceColor}; color: white;">
                            ${preferenceLabel}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary table-item-btn" 
                                data-item="${escapeHtml(item.name)}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        table.innerHTML = tableHTML;
        container.appendChild(table);

        this.attachItemListeners();
    }

    /**
     * Vue cartes (style Pinterest)
     */
    renderCardsView(container) {
        container.className = 'cards-view';
        container.innerHTML = '';

        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-masonry';

        this.kinkData.categories.forEach(category => {
            const card = this.createCategoryCard(category);
            cardsContainer.appendChild(card);
        });

        container.appendChild(cardsContainer);
        this.attachItemListeners();
    }

    /**
     * Vue compacte (liste simple)
     */
    renderCompactView(container) {
        container.className = 'compact-view';
        container.innerHTML = '';

        const preferences = this.preferencesManager.getAllPreferences();

        this.kinkData.categories.forEach(category => {
            const section = document.createElement('div');
            section.className = 'compact-category mb-3';

            const header = document.createElement('h5');
            header.className = 'compact-category-header';
            header.innerHTML = `<i class="${category.icon}"></i> ${escapeHtml(category.name)}`;
            section.appendChild(header);

            const itemsList = document.createElement('div');
            itemsList.className = 'compact-items-list';

            const items = this.getCategoryItems(category);
            items.forEach(item => {
                const itemName = typeof item === 'string' ? item : item.name;
                const preference = preferences.get(itemName) || 'none';
                const preferenceType = this.kinkData.preferenceTypes.find(t => t.id === preference);

                const itemElement = document.createElement('div');
                itemElement.className = `compact-item ${preference !== 'none' ? preference : ''}`;
                itemElement.dataset.item = itemName;
                itemElement.dataset.category = category.id;
                
                itemElement.innerHTML = `
                    <span class="compact-item-indicator" style="background: ${preferenceType ? preferenceType.color : 'transparent'}"></span>
                    <span class="compact-item-name">${escapeHtml(itemName)}</span>
                `;

                itemsList.appendChild(itemElement);
            });

            section.appendChild(itemsList);
            container.appendChild(section);
        });

        this.attachItemListeners();
    }

    /**
     * Crée un item d'accordéon (vue par défaut)
     */
    createAccordionItem(category) {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';

        const header = document.createElement('h2');
        header.className = 'accordion-header';
        header.innerHTML = `
            <button class="accordion-button collapsed" type="button" 
                    data-bs-toggle="collapse" data-bs-target="#${category.id}">
                <i class="${category.icon} me-2"></i>
                <span>${escapeHtml(category.name)}</span>
                <span class="category-counter" id="counter-${category.id}"></span>
            </button>
        `;

        const body = document.createElement('div');
        body.id = category.id;
        body.className = 'accordion-collapse collapse';
        body.setAttribute('data-bs-parent', '#categoriesAccordion');

        const bodyContent = document.createElement('div');
        bodyContent.className = 'accordion-body';

        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'items-grid';

        const items = this.getCategoryItems(category);
        items.forEach(item => {
            const itemElement = this.createItemElement(item, category.id);
            itemsGrid.appendChild(itemElement);
        });

        bodyContent.appendChild(itemsGrid);
        body.appendChild(bodyContent);
        accordionItem.appendChild(header);
        accordionItem.appendChild(body);

        return accordionItem;
    }

    /**
     * Crée une carte de catégorie
     */
    createCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'category-card-header';
        cardHeader.innerHTML = `
            <i class="${category.icon}"></i>
            <h5>${escapeHtml(category.name)}</h5>
        `;

        const cardBody = document.createElement('div');
        cardBody.className = 'category-card-body';

        const items = this.getCategoryItems(category);
        items.forEach(item => {
            const itemElement = this.createItemElement(item, category.id);
            cardBody.appendChild(itemElement);
        });

        card.appendChild(cardHeader);
        card.appendChild(cardBody);

        return card;
    }

    /**
     * Crée un élément item
     */
    createItemElement(item, categoryId) {
        const itemName = typeof item === 'string' ? item : item.name;
        const itemDescription = typeof item === 'object' && item.description ? item.description : '';

        const preferences = this.preferencesManager.getAllPreferences();
        const preference = preferences.get(itemName) || 'none';

        const itemElement = document.createElement('div');
        itemElement.className = `item ${preference !== 'none' ? preference : ''}`;
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
     * Attache les event listeners aux items
     */
    attachItemListeners() {
        // Les listeners sont gérés par EventManager via la délégation d'événements
        // Cette méthode est un hook pour d'éventuels listeners spécifiques à la vue
    }

    /**
     * Rafraîchit la vue actuelle
     */
    refresh() {
        this.renderView(this.currentView);
    }

    /**
     * Obtient la vue actuelle
     */
    getCurrentView() {
        return this.currentView;
    }
}