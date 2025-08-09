// uiGenerator.js - Génération de l'interface utilisateur
import appState from './state.js';
import { CONFIG } from './config.js';

export class UIGenerator {
  // ========================================
  // MÉTHODES PRINCIPALES DE GÉNÉRATION
  // ========================================
  
  /**
   * Génère l'interface complète de l'application
   */
  static generateInterface() {
    const kinkData = appState.getKinkData();
    if (!kinkData) return;

    UIGenerator.generateStatsSection();
    UIGenerator.generateCategoriesAccordion();
  }

  // ========================================
  // GÉNÉRATION DE LA SECTION STATISTIQUES
  // ========================================

  /**
   * Génère les badges de statistiques (vue simple)
   * Maintenant génère pour les deux emplacements : header et footer
   */
  static generateStatsSection() {
    const kinkData = appState.getKinkData();
    if (!kinkData) return;

    // Générer pour les deux conteneurs
    UIGenerator.generateStatsBadges('stats-badges-header');
    UIGenerator.generateStatsBadges('stats-badges-footer');
  }

  /**
   * Génère les badges pour un conteneur spécifique
   */
  static generateStatsBadges(containerId) {
    const statsContainer = document.getElementById(containerId);
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
        <span class="count" id="${type.id}-count-${containerId}">0</span>
      `;
      statsContainer.appendChild(badge);
    });

    // Badge "Non sélectionné"
    const unselectedBadge = document.createElement('div');
    unselectedBadge.className = 'stat-badge';
    unselectedBadge.style.background = 'linear-gradient(135deg, #6c757d, #5a6268)';
    unselectedBadge.innerHTML = `
      <span>Non sélectionné</span>
      <span class="count" id="unselected-count-${containerId}">0</span>
    `;
    statsContainer.appendChild(unselectedBadge);
  }

  // ========================================
  // GÉNÉRATION DES CATÉGORIES (VUE PRINCIPALE)
  // ========================================

  /**
   * Génère l'accordion principal des catégories
   */
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

  /**
   * Génère l'en-tête d'une catégorie dans l'accordion
   */
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

  /**
   * Génère le corps d'une catégorie (avec ou sans sous-catégories)
   */
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

  /**
   * Génère le HTML d'une sous-catégorie
   */
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

  /**
   * Génère le HTML d'un item individuel
   */
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

  // ========================================
  // STATISTIQUES AVANCÉES (VUE DÉTAILLÉE)
  // ========================================

  /**
   * Génère le HTML complet pour les statistiques avancées
   */
  static createEnhancedStatsHTML() {
    return `
      <!-- Vue d'ensemble avec graphique circulaire -->
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

      <!-- Graphiques interactifs -->
      <div class="stat-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4><i class="fas fa-chart-pie me-2"></i>Répartition des Préférences</h4>
          <div class="chart-controls">
            <button class="toggle-btn active" onclick="window.chartManager?.toggleChart('doughnut')" id="btn-doughnut">
              <i class="fas fa-chart-pie me-1"></i>Camembert
            </button>
            <button class="toggle-btn" onclick="window.chartManager?.toggleChart('bar')" id="btn-bar">
              <i class="fas fa-chart-bar me-1"></i>Barres
            </button>
            <button class="toggle-btn" onclick="window.chartManager?.toggleChart('polarArea')" id="btn-polarArea">
              <i class="fas fa-chart-line me-1"></i>Polar Area
            </button>
          </div>
        </div>
        
        <div class="chart-container" id="chart-container">
          <canvas id="preferencesChart" width="450" height="450"></canvas>
          <div class="chart-loading d-none" id="chart-loading">
            <div class="text-center p-4">
              <div class="spinner-border text-primary mb-2" role="status">
                <span class="visually-hidden">Chargement...</span>
              </div>
              <p class="text-muted">Génération du graphique...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Analyse par catégorie - ACCORDION POUR ÉCONOMISER L'ESPACE -->
      <div class="stat-card">
        <h4><i class="fas fa-layer-group me-2"></i>Analyse par Catégorie</h4>
        <div class="accordion" id="categoryAnalysisAccordion">
          <div id="category-analysis-accordion-content">
            <!-- Contenu généré par generateCategoryAnalysisAccordion() -->
          </div>
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

  /**
   * Génère l'accordion d'analyse détaillée par catégorie
   * Cette méthode crée un accordion pour économiser l'espace d'affichage
   */
  static generateCategoryAnalysisAccordion() {
    const container = document.getElementById('category-analysis-accordion-content');
    if (!container) return;

    const kinkData = appState.getKinkData();
    const stats = appState.getStats();
    
    if (!kinkData || !stats) return;

    container.innerHTML = '';

    // Générer un élément d'accordion pour chaque catégorie
    kinkData.categories.forEach((category, index) => {
      const categoryStats = stats.categoryStats[category.id];
      if (!categoryStats) return;

      const completionPercentage = categoryStats.total > 0 ? 
        Math.round((categoryStats.selected / categoryStats.total) * 100) : 0;

      const accordionItem = document.createElement('div');
      accordionItem.className = 'accordion-item';
      
      accordionItem.innerHTML = `
        <h2 class="accordion-header">
          <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" 
                  data-bs-toggle="collapse" data-bs-target="#categoryAnalysis${category.id}" 
                  aria-expanded="${index === 0 ? 'true' : 'false'}">
            <i class="${category.icon} me-2"></i>
            <span class="me-2">${category.name}</span>
            <span class="badge bg-primary me-2">${categoryStats.selected}/${categoryStats.total}</span>
            <span class="badge bg-${completionPercentage > 50 ? 'success' : completionPercentage > 25 ? 'warning' : 'secondary'}">
              ${completionPercentage}%
            </span>
          </button>
        </h2>
        <div id="categoryAnalysis${category.id}" 
             class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
             data-bs-parent="#categoryAnalysisAccordion">
          <div class="accordion-body">
            ${UIGenerator.generateCategoryAnalysisContent(category, categoryStats)}
          </div>
        </div>
      `;

      container.appendChild(accordionItem);
    });
  }

  /**
   * Génère le contenu détaillé d'analyse pour une catégorie spécifique
   */
  static generateCategoryAnalysisContent(category, categoryStats) {
    const preferences = appState.getAllPreferences();
    const kinkData = appState.getKinkData();
    
    // En-tête avec statistiques générales
    let content = `
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="d-flex align-items-center mb-2">
            <i class="fas fa-check-circle text-success me-2"></i>
            <span>Sélectionnés: <strong>${categoryStats.selected}</strong></span>
          </div>
          <div class="d-flex align-items-center mb-2">
            <i class="fas fa-circle text-muted me-2"></i>
            <span>Total: <strong>${categoryStats.total}</strong></span>
          </div>
        </div>
        <div class="col-md-6">
          <div class="progress mb-2">
            <div class="progress-bar" role="progressbar" 
                 style="width: ${categoryStats.total > 0 ? (categoryStats.selected / categoryStats.total) * 100 : 0}%">
            </div>
          </div>
          <small class="text-muted">Progression: ${categoryStats.total > 0 ? Math.round((categoryStats.selected / categoryStats.total) * 100) : 0}%</small>
        </div>
      </div>
    `;

    // Analyser la répartition des préférences pour cette catégorie
    const categoryPreferences = {};
    kinkData.preferenceTypes.forEach(type => {
      categoryPreferences[type.id] = 0;
    });

    // Compter les préférences dans cette catégorie
    if (category.hasSubcategories && category.subcategories) {
      // Cas des catégories avec sous-catégories
      category.subcategories.forEach(subcat => {
        if (subcat.items) {
          subcat.items.forEach(item => {
            const itemName = typeof item === 'string' ? item : item.name;
            const preference = preferences[itemName];
            if (preference && preference !== 'none') {
              categoryPreferences[preference] = (categoryPreferences[preference] || 0) + 1;
            }
          });
        }
      });
    } else if (category.items) {
      // Cas des catégories simples
      category.items.forEach(item => {
        const itemName = typeof item === 'string' ? item : item.name;
        const preference = preferences[itemName];
        if (preference && preference !== 'none') {
          categoryPreferences[preference] = (categoryPreferences[preference] || 0) + 1;
        }
      });
    }

    // Section de répartition des préférences
    content += `
      <h6 class="mb-2"><i class="fas fa-chart-pie me-2"></i>Répartition des préférences</h6>
      <div class="row">
    `;

    kinkData.preferenceTypes.forEach(type => {
      const count = categoryPreferences[type.id] || 0;
      content += `
        <div class="col-6 col-md-3 mb-2">
          <div class="d-flex align-items-center">
            <div class="preference-color-dot me-2" style="background: ${type.color}"></div>
            <span class="small">${type.name}: <strong>${count}</strong></span>
          </div>
        </div>
      `;
    });

    content += `</div>`;

    return content;
  }

  // ========================================
  // MÉTHODES DE MISE À JOUR
  // ========================================

  /**
   * Met à jour l'affichage des items selon l'état actuel
   */
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

  /**
   * Met à jour l'affichage des statistiques (badges)
   * Maintenant met à jour les deux sections
   */
  static updateStatsDisplay() {
    const stats = appState.getStats();
    if (!stats) return;

    const kinkData = appState.getKinkData();
    if (!kinkData) return;

    // Mettre à jour les deux sections de badges
    UIGenerator.updateStatsBadges('stats-badges-header', stats, kinkData);
    UIGenerator.updateStatsBadges('stats-badges-footer', stats, kinkData);
  }

  /**
   * Met à jour les badges d'une section spécifique
   */
  static updateStatsBadges(containerId, stats, kinkData) {
    // Mettre à jour les badges des types de préférences
    kinkData.preferenceTypes.forEach(type => {
      const element = document.getElementById(`${type.id}-count-${containerId}`);
      if (element && stats.preferenceStats[type.id]) {
        element.textContent = stats.preferenceStats[type.id].count || 0;
      }
    });

    // Mettre à jour le badge "non sélectionné"
    const unselectedElement = document.getElementById(`unselected-count-${containerId}`);
    if (unselectedElement) {
      const unselected = stats.totalItems - stats.selectedItems;
      unselectedElement.textContent = unselected;
    }
  }

  /**
   * Met à jour les compteurs des catégories et sous-catégories
   */
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

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Initialise le canvas Chart.js après génération HTML
   */
  static initializeChartCanvas() {
    console.log('🎨 Initialisation du canvas Chart.js');
    
    // Vérifier que le canvas existe
    const canvas = document.getElementById('preferencesChart');
    if (!canvas) {
      console.error('❌ Canvas preferencesChart non trouvé après génération HTML');
      return false;
    }
    
    // Vérifier les dimensions
    const container = canvas.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      console.log('📐 Dimensions du conteneur:', {
        width: rect.width,
        height: rect.height
      });
      
      // Ajuster les dimensions du canvas si nécessaire
      if (rect.width > 0 && rect.height > 0) {
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '400px';
      }
    }
    
    console.log('✅ Canvas initialisé');
    return true;
  }

  /**
   * Échappe le HTML pour éviter les injections
   */
  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}