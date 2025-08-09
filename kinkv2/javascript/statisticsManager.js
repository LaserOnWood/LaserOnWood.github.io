// statisticsManager.js - Gestion des statistiques et graphiques
import appState from './state.js';
import { UIGenerator } from './uiGenerator.js';

export class StatisticsManager {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Écouter les changements pour mettre à jour les stats
    appState.addListener('preferenceChanged', this.updateStats.bind(this));
    appState.addListener('preferencesImported', this.updateStats.bind(this));
    appState.addListener('allPreferencesCleared', this.updateStats.bind(this));
    appState.addListener('dataLoaded', this.updateStats.bind(this));
  }

  updateStats() {
    this.updateSimpleStats();
    
    // Si on est en vue détaillée, mettre à jour aussi les stats avancées
    if (appState.isDetailedView) {
      this.updateAdvancedStats();
    }
  }

  updateSimpleStats() {
    UIGenerator.updateStatsDisplay();
    UIGenerator.updateCategoryCounters();
  }

  updateAdvancedStats() {
    this.updateDetailedOverview();
    this.updateCategoryAnalysisAccordion();
    this.generateInsights();
    
    // Mettre à jour le graphique si il existe
    const currentChart = appState.getCurrentChart();
    if (currentChart && typeof window.chartManager !== 'undefined') {
      window.chartManager.updateChart();
    }
  }

  updateDetailedOverview() {
    const stats = appState.getStats();
    if (!stats) return;

    // Mise à jour du cercle de progression
    const circle = document.getElementById('progress-circle');
    const percentageText = document.getElementById('total-percentage');

    if (circle && percentageText) {
      const percentage = parseFloat(stats.completionPercentage);
      const circumference = 2 * Math.PI * 52;
      const offset = circumference - (percentage / 100) * circumference;

      circle.style.strokeDashoffset = offset;
      percentageText.textContent = `${percentage}%`;
    }

    // Mise à jour des badges détaillés
    const badgesContainer = document.getElementById('overview-badges');
    if (badgesContainer) {
      badgesContainer.innerHTML = '';

      Object.entries(stats.preferenceStats).forEach(([key, stat]) => {
        if (stat.count > 0) {
          const badge = document.createElement('span');
          badge.className = 'stat-badge';
          badge.style.background = stat.color;
          badge.innerHTML = `${stat.name}: ${stat.count} (${stat.percentage}%)`;
          badgesContainer.appendChild(badge);
        }
      });
    }
  }

  updateCategoryAnalysisAccordion() {
    // Utiliser la nouvelle méthode de UIGenerator pour générer l'accordion
    UIGenerator.generateCategoryAnalysisAccordion();
  }

  // Garder l'ancienne méthode pour compatibilité mais la rediriger
  updateCategoryAnalysis() {
    this.updateCategoryAnalysisAccordion();
  }

  generateInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    const stats = appState.getStats();
    if (!stats) return;

    const insights = [];

    // Analyser la préférence dominante
    const maxPref = Object.entries(stats.preferenceStats).reduce((max, [key, value]) => {
      return value.count > (stats.preferenceStats[max] ? stats.preferenceStats[max].count : 0) ? key : max;
    }, '');

    if (stats.preferenceStats[maxPref] && stats.preferenceStats[maxPref].count > 0) {
      insights.push(`🎯 Votre préférence dominante est "${stats.preferenceStats[maxPref].name}" avec ${stats.preferenceStats[maxPref].count} sélections (${stats.preferenceStats[maxPref].percentage}%).`);
    }

    // Analyser la curiosité
    const adventurous = stats.preferenceStats['curiosité'] ? stats.preferenceStats['curiosité'].count : 0;
    if (adventurous > 0) {
      insights.push(`🔍 Vous montrez de la curiosité pour ${adventurous} nouvelles expériences, signe d'un esprit ouvert !`);
    }

    // Analyser le taux de completion
    const completion = parseFloat(stats.completionPercentage);
    if (completion < 30) {
      insights.push(`📝 Vous avez complété ${completion}% de la liste. Il reste encore beaucoup à découvrir !`);
    } else if (completion > 70) {
      insights.push(`✅ Excellent ! Vous avez une vision claire de vos préférences avec ${completion}% de completion.`);
    } else {
      insights.push(`📊 Vous avez complété ${completion}% de la liste, vous êtes sur la bonne voie !`);
    }

    // Analyser la diversité des préférences
    const activePref = Object.values(stats.preferenceStats).filter(s => s.count && s.count > 0).length;
    if (activePref >= 4) {
      insights.push(`🌈 Vos goûts sont diversifiés avec des préférences dans ${activePref} catégories différentes.`);
    } else if (activePref <= 2) {
      insights.push(`🎯 Vos préférences sont concentrées sur ${activePref} type(s), vous savez ce que vous aimez !`);
    }

    // Analyser les limites strictes
    const strictLimits = stats.preferenceStats['non_strict'] ? stats.preferenceStats['non_strict'].count : 0;
    if (strictLimits > 0) {
      insights.push(`🚫 Vous avez défini ${strictLimits} limite(s) stricte(s), important pour établir vos boundaries.`);
    }

    // Analyser les dislikes
    const dislikes = stats.preferenceStats['dislike'] ? stats.preferenceStats['dislike'].count : 0;
    if (dislikes > 0) {
      insights.push(`❌ ${dislikes} pratique(s) ne vous intéresse(nt) pas, c'est tout à fait normal d'avoir des préférences !`);
    }

    // Catégorie la plus explorée
    const topCategory = Object.entries(stats.categoryStats).reduce((max, [key, value]) => {
      return value.selected > (stats.categoryStats[max] ? stats.categoryStats[max].selected : 0) ? key : max;
    }, '');

    if (stats.categoryStats[topCategory] && stats.categoryStats[topCategory].selected > 0) {
      insights.push(`⭐ Votre domaine de prédilection est "${stats.categoryStats[topCategory].name}" avec ${stats.categoryStats[topCategory].selected} préférences.`);
    }

    // Conseils personnalisés
    if (completion < 50 && adventurous > 0) {
      insights.push(`💡 Conseil : Votre curiosité pourrait vous aider à explorer d'autres catégories pour mieux vous connaître.`);
    }

    container.innerHTML = insights.map(insight => `
      <div class="alert alert-info d-flex align-items-center mb-2">
        <div>${UIGenerator.escapeHtml(insight)}</div>
      </div>
    `).join('');
  }

  toggleStatsView() {
    const statsContainer = document.querySelector('.stats');
    const toggleBtn = document.getElementById('toggle-stats-btn');
  
    if (!statsContainer || !toggleBtn) {
      console.error('❌ Éléments UI non trouvés pour la bascule');
      return;
    }
  
    if (!appState.isDetailedView) {
      console.log('🔄 Passage en vue détaillée...');
      
      // Sauvegarder la vue simple si nécessaire
      if (!this.originalStatsHTML) {
        this.originalStatsHTML = statsContainer.innerHTML;
      }
  
      // Passer en vue détaillée
      statsContainer.innerHTML = `
        <h5 class="mb-3 text-center">
          <i class="fas fa-chart-bar"></i> Statistiques Détaillées
          <button class="btn btn-sm btn-outline-secondary ms-2" onclick="window.statisticsManager?.exportStats()">
            <i class="fas fa-download"></i> Exporter Stats
          </button>
        </h5>
        ${UIGenerator.createEnhancedStatsHTML()}
      `;
  
      // Ajouter les styles CSS
      this.addEnhancedStatsCSS();
  
      // IMPORTANT : Attendre que le DOM soit mis à jour
      setTimeout(() => {
        console.log('🔄 DOM mis à jour, initialisation du canvas...');
        
        // Initialiser le canvas
        const canvasInitialized = UIGenerator.initializeChartCanvas();
        
        if (canvasInitialized) {
          // Attendre encore un peu pour que Chart.js soit prêt
          setTimeout(() => {
            console.log('🚀 Tentative de création du graphique...');
            
            // Vérifier Chart.js une dernière fois
            if (typeof Chart === 'undefined') {
              console.error('❌ Chart.js toujours non disponible');
              this.showChartJSError();
              return;
            }
            
            // Initialiser les composants détaillés
            this.updateAdvancedStats();
            
            // Générer l'accordion d'analyse (AJOUT IMPORTANT)
            setTimeout(() => {
              console.log('🎯 Génération de l\'accordion d\'analyse...');
              UIGenerator.generateCategoryAnalysisAccordion();
            }, 200);
            
            // Créer le graphique
            if (window.chartManager) {
              window.chartManager.createChart('doughnut');
            } else {
              console.error('❌ ChartManager non disponible');
            }
            
          }, 500);
        } else {
          console.error('❌ Échec de l\'initialisation du canvas');
        }
      }, 100);
  
      // Mettre à jour l'UI du bouton
      toggleBtn.innerHTML = '<i class="fas fa-chart-bar me-2"></i>Vue Simple';
      toggleBtn.classList.remove('btn-outline-primary');
      toggleBtn.classList.add('btn-outline-success');
      appState.setDetailedView(true);
  
    } else {
      console.log('🔄 Retour en vue simple...');
      
      // Revenir à la vue simple
      statsContainer.innerHTML = this.originalStatsHTML;
  
      // Régénérer les badges simples
      UIGenerator.generateStatsSection();
      this.updateSimpleStats();
  
      toggleBtn.innerHTML = '<i class="fas fa-chart-line me-2"></i>Vue Détaillée';
      toggleBtn.classList.remove('btn-outline-success');
      toggleBtn.classList.add('btn-outline-primary');
      appState.setDetailedView(false);
    }
  }

  addEnhancedStatsCSS() {
    const cssId = 'enhanced-stats-css';
    if (document.getElementById(cssId)) return;

    const style = document.createElement('style');
    style.id = cssId;
    style.textContent = `
      /* Styles spécifiques pour les statistiques détaillées - éviter les conflits */
      .stats .stat-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        transition: transform 0.3s ease;
      }

      .stats .stat-card:hover {
        transform: translateY(-2px);
      }

      .stats .progress-ring {
        width: 120px;
        height: 120px;
      }

      .stats .progress-ring-circle {
        transition: stroke-dashoffset 0.8s ease-in-out;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
      }

      .stats .chart-container {
        position: relative;
        height: 300px;
        margin: 1rem 0;
      }

      .stats .percentage-bar {
        background: #e9ecef;
        border-radius: 10px;
        height: 20px;
        overflow: hidden;
        margin: 0.5rem 0;
      }

      .stats .percentage-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .stats .toggle-btn {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        border: none;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: bold;
        margin: 0.25rem;
        transition: all 0.3s ease;
        font-size: 0.85rem;
      }

      .stats .toggle-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(79, 172, 254, 0.3);
        color: white;
      }

      .stats .toggle-btn.active {
        background: linear-gradient(135deg, #28a745, #20c997);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      }

      .stats .preference-color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
        flex-shrink: 0;
      }

      /* Styles spécifiques pour l'accordion d'analyse par catégorie */
      #categoryAnalysisAccordion .accordion-item {
        border: none;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 0.5rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      }

      #categoryAnalysisAccordion .accordion-button {
        border-radius: 10px !important;
        border: none;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        color: #495057;
        font-weight: 500;
      }

      #categoryAnalysisAccordion .accordion-button:not(.collapsed) {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        box-shadow: none;
      }

      #categoryAnalysisAccordion .accordion-button:focus {
        box-shadow: none;
        border: none;
      }

      #categoryAnalysisAccordion .accordion-button::after {
        filter: brightness(0) invert(1);
      }

      #categoryAnalysisAccordion .accordion-button.collapsed::after {
        filter: none;
      }

      @media (max-width: 768px) {
        .stats .chart-container {
          height: 250px;
        }
        
        .stats .toggle-btn {
          font-size: 0.75rem;
          padding: 0.4rem 0.8rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  exportStats() {
    const stats = appState.getStats();
    if (!stats) return;

    try {
      // Créer un canvas temporaire avec les statistiques
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      // Arrière-plan blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Titre
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Mes Statistiques de Préférences', canvas.width / 2, 40);

      // Date
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      const today = new Date().toLocaleDateString('fr-FR');
      ctx.fillText(`Généré le ${today}`, canvas.width / 2, 65);

      // Copier le graphique si disponible
      const chartCanvas = document.getElementById('preferencesChart');
      if (chartCanvas) {
        ctx.drawImage(chartCanvas, 50, 100, 700, 400);
      }

      // Ajouter les statistiques textuelles
      ctx.font = '16px Arial';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';

      let y = 520;
      ctx.fillText(`Total d'éléments sélectionnés: ${stats.selectedItems}/${stats.totalItems}`, 50, y);
      y += 25;
      ctx.fillText(`Pourcentage de completion: ${stats.completionPercentage}%`, 50, y);

      // Télécharger l'image
      const link = document.createElement('a');
      link.download = `statistiques_preferences_${today.replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();

      return { success: true, message: 'Statistiques exportées avec succès !' };

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      return { success: false, message: 'Erreur lors de l\'export des statistiques' };
    }
  }
  
  showChartJSError() {
    const container = document.querySelector('.chart-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
          <i class="fas fa-exclamation-triangle mb-2"></i>
          <h6>Chart.js non disponible</h6>
          <p>La librairie Chart.js n'a pas pu être chargée.</p>
          <div class="mt-3">
            <p><strong>Solutions possibles :</strong></p>
            <ul class="text-start">
              <li>Vérifiez votre connexion internet</li>
              <li>Rechargez la page</li>
              <li>Vérifiez que le script Chart.js est bien chargé</li>
            </ul>
            <button class="btn btn-sm btn-outline-danger me-2" onclick="location.reload()">
              <i class="fas fa-redo"></i> Recharger la page
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="window.testChartJS()">
              <i class="fas fa-bug"></i> Test Chart.js
            </button>
          </div>
        </div>
      `;
    }
  }
}