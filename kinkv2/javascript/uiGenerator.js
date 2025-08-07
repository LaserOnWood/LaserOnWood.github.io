// uiGenerator.js - Génération de l'interface utilisateur
import appState from './state.js';
import { CONFIG } from './config.js';

export class UIGenerator {
  static generateInterface() {
    const kinkData = appState.getKinkData();
    if (!kinkData) return;

    UIGenerator.generateStatsSection();
    UIGenerator.generateCategoriesAccordion();
  }

  static generateStatsSection() {
    const statsContainer = document.querySelector('.stats-badges');
    if (!statsContainer) return;

    const kinkData = appState.getKinkData();
    if (!kinkData) return;

    statsContainer.innerHTML = '';

    // Badges des types de préférences
    kinkData.preferenceTypes.forEach(type => {
      const badge = document.createElement('div');
      badge.className = 'stat-badge';
      badge.style.background = type.color;
      badge.innerHTML = `
        <span>${type.name}</span>
        <span class="count" id="${type.id}-count">0</span>
      `;
      statsContainer.appendChild(badge);
    });

    // Badge "Non sélectionné"
    const unselectedBadge = document.createElement('div');
    unselectedBadge.className = 'stat-badge';
    unselectedBadge.style.background = 'linear-gradient(135deg, #6c757d, #5a6268)';
    unselectedBadge.innerHTML = `
      <span>Non sélectionné</span>
      <span class="count" id="unselected-count">0</span>
    `;
    statsContainer.appendChild(unselectedBadge);
  }

  static generateCategoriesAccordion() {
    const accordion = document.getElementById('categoriesAccordion');
    if (!accordion) return;

    const kinkData = appState.getKinkData();
    if (!kinkData) return;

    accordion.innerHTML = '';

    kinkData.categories.forEach(category => {
      const accordionItem = document.createElement('div');
      accordionItem.className = 'accordion-item';

      const header = UIGenerator.generateCategoryHeader(category);
      const body = UIGenerator.generateCategoryBody(category);

      accordionItem.innerHTML = `
        ${header}
        <div id="${category.id}" class="accordion-collapse collapse" 
             data-bs-parent="#categoriesAccordion">
          ${body}
        </div>
      `;

      accordion.appendChild(accordionItem);
    });
  }

  static generateCategoryHeader(category) {
    return `
      <h2 class="accordion-header">
        <button class="accordion-button collapsed" type="button" 
                data-bs-toggle="collapse" data-bs-target="#${category.id}" 
                aria-expanded="false">
          <i class="${category.icon} me-2"></i>
          <span>${category.name}</span>
          <span class="category-counter" id="counter-${category.id}"></span>
        </button>
      </h2>
    `;
  }

  static generateCategoryBody(category) {
    if (category.hasSubcategories && category.subcategories) {
      // Catégorie avec sous-catégories
      return `
        <div class="accordion-body">
          ${category.description ? `
            <div class="alert alert-info text-center" role="alert">
              ${UIGenerator.escapeHtml(category.description)}
            </div>
          ` : ''}
          <div class="accordion" id="accordion${category.id}">
            ${category.subcategories.map(subcat => 
              UIGenerator.generateSubcategoryHTML(subcat, category.id)
            ).join('')}
          </div>
        </div>
      `;
    } else if (category.items) {
      // Catégorie normale
      return `
        <div class="accordion-body">
          ${category.description ? `
            <div class="alert alert-info text-center" role="alert">
              <i class="fas fa-info-circle me-2"></i>${UIGenerator.escapeHtml(category.description)}
            </div>
          ` : ''}
          <div class="items-grid">
            ${category.items.map(item => 
              UIGenerator.generateItemHTML(item, category.id)
            ).join('')}
          </div>
        </div>
      `;
    }
    return '';
  }

  static generateSubcategoryHTML(subcat, parentId) {
    if (!subcat || !subcat.items) return '';

    return `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" type="button" 
                  data-bs-toggle="collapse" data-bs-target="#${subcat.id}" 
                  aria-expanded="false">
            <i class="${subcat.icon} me-2"></i>
            <span>${subcat.name}</span>
            <span class="category-counter" id="counter-${subcat.id}"></span>
          </button>
        </h2>
        <div id="${subcat.id}" class="accordion-collapse collapse" 
             data-bs-parent="#accordion${parentId}">
          <div class="accordion-body">
            <div class="items-grid">
              ${subcat.items.map(item => 
                UIGenerator.generateItemHTML(item, subcat.id)
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static generateItemHTML(item, categoryId) {
    if (!item) return '';

    // Support des objets avec description et des chaînes simples
    const itemName = typeof item === 'string' ? item : item.name;
    const itemDescription = typeof item === 'object' && item.description ? item.description : '';

    if (!itemName) return '';

    return `
      <div class="item" data-item="${UIGenerator.escapeHtml(itemName)}" data-category="${categoryId}">
        <div class="item-name">${UIGenerator.escapeHtml(itemName)}</div>
        ${itemDescription ? `<div class="item-description">${UIGenerator.escapeHtml(itemDescription)}</div>` : ''}
      </div>
    `;
  }

  static updateItemsFromState() {
    const preferences = appState.getAllPreferences();
    
    document.querySelectorAll('.item').forEach(item => {
      const itemName = item.dataset.item;
      const preference = preferences[itemName];

      // Nettoyer les anciennes classes d'état
      const stateClasses = CONFIG.VALIDATION.VALID_PREFERENCE_STATES;
      stateClasses.forEach(cls => item.classList.remove(cls));

      // Ajouter la nouvelle classe si nécessaire
      if (preference && preference !== 'none') {
        item.classList.add(preference);
      }
    });
  }

  static updateStatsDisplay() {
    const stats = appState.getStats();
    if (!stats) return;

    const kinkData = appState.getKinkData();
    if (!kinkData) return;

    // Mettre à jour les badges des types de préférences
    kinkData.preferenceTypes.forEach(type => {
      const element = document.getElementById(`${type.id}-count`);
      if (element && stats.preferenceStats[type.id]) {
        element.textContent = stats.preferenceStats[type.id].count || 0;
      }
    });

    // Mettre à jour le badge "non sélectionné"
    const unselectedElement = document.getElementById('unselected-count');
    if (unselectedElement) {
      const unselected = stats.totalItems - stats.selectedItems;
      unselectedElement.textContent = unselected;
    }
  }

  static updateCategoryCounters() {
    const kinkData = appState.getKinkData();
    const stats = appState.getStats();
    
    if (!kinkData || !stats) return;

    kinkData.categories.forEach(category => {
      const categoryStats = stats.categoryStats[category.id];
      if (!categoryStats) return;

      if (category.hasSubcategories && category.subcategories) {
        // Gérer les sous-catégories
        category.subcategories.forEach(subcat => {
          const items = document.querySelectorAll(`[data-category="${subcat.id}"]`);
          const preferences = appState.getAllPreferences();
          
          let subcatSelected = 0;
          items.forEach(item => {
            const itemName = item.dataset.item;
            if (preferences[itemName] && preferences[itemName] !== 'none') {
              subcatSelected++;
            }
          });

          const subcatCounter = document.getElementById(`counter-${subcat.id}`);
          if (subcatCounter) {
            subcatCounter.textContent = `${subcatSelected}/${items.length}`;
          }
        });
      }

      // Mettre à jour le compteur principal
      const counter = document.getElementById(`counter-${category.id}`);
      if (counter) {
        counter.textContent = `${categoryStats.selected}/${categoryStats.total}`;
      }
    });
  }

  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static createEnhancedStatsHTML() {
    return `
      <!-- Statistiques Améliorées -->
      <div class="stat-card">
        <h4><i class="fas fa-chart-bar me-2"></i>Vue d'ensemble</h4>
        <div class="row">
          <div class="col-md-6">
            <div class="d-flex justify-content-center position-relative">
              <svg class="progress-ring" width="120" height="120">
                <circle class="progress-ring-circle" stroke="#e9ecef" stroke-width="8" 
                        fill="transparent" r="52" cx="60" cy="60"/>
                <circle id="progress-circle" class="progress-ring-circle" stroke="#4facfe" 
                        stroke-width="8" fill="transparent" r="52" cx="60" cy="60" 
                        stroke-dasharray="327" stroke-dashoffset="327"/>
              </svg>
              <div class="position-absolute d-flex align-items-center justify-content-center h-100">
                <div class="text-center">
                  <div class="h3 mb-0" id="total-percentage">0%</div>
                  <small class="text-muted">Complété</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex flex-wrap justify-content-center" id="overview-badges">
              <!-- Badges générés dynamiquement -->
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques -->
      <div class="stat-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4><i class="fas fa-chart-pie me-2"></i>Répartition des Préférences</h4>
          <div>
            <button class="toggle-btn active" onclick="window.chartManager?.toggleChart('doughnut')" id="btn-doughnut">
              <i class="fas fa-chart-pie me-1"></i>Camembert
            </button>
            <button class="toggle-btn" onclick="window.chartManager?.toggleChart('bar')" id="btn-bar">
              <i class="fas fa-chart-bar me-1"></i>Barres
            </button>
            <button class="toggle-btn" onclick="window.chartManager?.toggleChart('radar')" id="btn-radar">
              <i class="fas fa-chart-line me-1"></i>Radar
            </button>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="preferencesChart"></canvas>
        </div>
      </div>

      <!-- Analyse par catégorie -->
      <div class="stat-card">
        <h4><i class="fas fa-layer-group me-2"></i>Analyse par Catégorie</h4>
        <div id="category-analysis">
          <!-- Analyses par catégorie générées dynamiquement -->
        </div>
      </div>

      <!-- Tendances et insights -->
      <div class="stat-card">
        <h4><i class="fas fa-lightbulb me-2"></i>Insights & Tendances</h4>
        <div id="insights-container">
          <!-- Insights générés dynamiquement -->
        </div>
      </div>
    `;
  }
}