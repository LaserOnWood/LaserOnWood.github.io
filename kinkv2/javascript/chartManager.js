// chartManager.js - Version optimisée avec gestion d'erreurs robuste
import appState from './state.js';

export class ChartManager {
  constructor() {
    this.currentChartType = 'doughnut';
    this.isChartJSReady = false;
    this.initPromise = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Cache pour les données du graphique
    this.chartDataCache = null;
    this.lastUpdateTime = 0;
    
    // Démarrer l'initialisation
    this.initPromise = this.initializeChartJS();
  }

  async initializeChartJS() {
    if (this.isChartJSReady) {
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = 15000; // 15 secondes maximum
      
      // Vérification immédiate
      if (typeof Chart !== 'undefined') {
        this.isChartJSReady = true;
        this.validateChartJS();
        resolve(true);
        return;
      }

      // Polling optimisé avec backoff exponentiel
      let interval = 50;
      const maxInterval = 500;
      
      const checkChartJS = () => {
        if (Date.now() - startTime > timeout) {
          const error = 'Timeout: Chart.js non disponible après 15 secondes';
          console.error('❌', error);
          this.handleChartJSError(error);
          reject(new Error(error));
          return;
        }

        if (typeof Chart !== 'undefined') {
          this.isChartJSReady = true;
          console.log('✅ Chart.js disponible après', Date.now() - startTime, 'ms');
          
          if (this.validateChartJS()) {
            resolve(true);
          } else {
            reject(new Error('Chart.js validation failed'));
          }
          return;
        }

        // Backoff exponentiel pour réduire la charge CPU
        interval = Math.min(interval * 1.1, maxInterval);
        setTimeout(checkChartJS, interval);
      };

      checkChartJS();
    });
  }

  validateChartJS() {
    try {
      if (!Chart || !Chart.register) {
        console.warn('⚠️ Chart.js incomplet ou version non supportée');
        return false;
      }

      console.log(`📊 Chart.js ${Chart.version || 'version inconnue'} validé`);
      return true;
    } catch (error) {
      console.error('❌ Erreur validation Chart.js:', error);
      return false;
    }
  }

  async ensureChartJSReady() {
    if (!this.isChartJSReady) {
      try {
        await this.initPromise;
      } catch (error) {
        // Tenter une réinitialisation si pas trop de tentatives
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 Tentative ${this.retryCount}/${this.maxRetries}`);
          
          await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
          this.initPromise = this.initializeChartJS();
          await this.initPromise;
        } else {
          throw error;
        }
      }
    }
  }

  async createChart(type = 'doughnut') {
    try {
      console.log(`🎯 Création graphique ${type}...`);

      // S'assurer que Chart.js est prêt
      await this.ensureChartJSReady();

      // Vérifier le canvas
      const canvas = this.ensureCanvas();
      if (!canvas) {
        throw new Error('Impossible de créer ou trouver le canvas');
      }

      // Préparer les données avec cache
      const chartData = await this.getChartData();
      if (!chartData || chartData.labels.length === 0) {
        this.showEmptyChartMessage();
        return null;
      }

      // Nettoyer l'ancien graphique
      this.cleanupCurrentChart();

      // Créer le nouveau graphique
      const chart = await this.createNewChart(canvas, type, chartData);
      
      if (chart) {
        // Sauvegarder dans l'état
        appState.setCurrentChart(chart, type);
        this.currentChartType = type;
        console.log(`✅ Graphique ${type} créé avec succès`);
      }

      return chart;

    } catch (error) {
      console.error('❌ Erreur création graphique:', error);
      this.showChartError(error.message);
      return null;
    }
  }

  ensureCanvas() {
    let canvas = document.getElementById('preferencesChart');
    
    if (!canvas) {
      // Créer le canvas s'il n'existe pas
      const container = document.querySelector('.chart-container');
      if (!container) {
        console.error('❌ Conteneur de graphique non trouvé');
        return null;
      }

      canvas = document.createElement('canvas');
      canvas.id = 'preferencesChart';
      canvas.width = 450;
      canvas.height = 450;
      
      // Nettoyer le conteneur et ajouter le canvas
      container.innerHTML = '';
      container.appendChild(canvas);
      
      console.log('🎨 Canvas créé dynamiquement');
    }

    // Vérifier que le canvas est dans le DOM et visible
    if (!canvas.offsetParent && canvas.style.display !== 'none') {
      console.warn('⚠️ Canvas potentiellement invisible');
    }

    return canvas;
  }

  async getChartData() {
    const now = Date.now();
    
    // Utiliser le cache si récent (moins de 1 seconde)
    if (this.chartDataCache && (now - this.lastUpdateTime < 1000)) {
      return this.chartDataCache;
    }

    const stats = appState.getStats();
    if (!stats || !stats.preferenceStats) {
      return { labels: [], data: [], colors: [] };
    }

    const chartData = {
      labels: [],
      data: [],
      colors: []
    };

    // Traitement optimisé des données
    for (const [key, stat] of Object.entries(stats.preferenceStats)) {
      if (stat?.count > 0) {
        chartData.labels.push(stat.name || key);
        chartData.data.push(stat.count);
        chartData.colors.push(this.extractColor(stat.color) || this.getDefaultColor(key));
      }
    }

    // Mettre en cache
    this.chartDataCache = chartData;
    this.lastUpdateTime = now;

    return chartData;
  }

  cleanupCurrentChart() {
    const currentChart = appState.getCurrentChart();
    if (currentChart) {
      try {
        currentChart.destroy();
      } catch (error) {
        console.warn('⚠️ Erreur lors de la destruction du graphique:', error);
      }
    }
  }

  async createNewChart(canvas, type, chartData) {
    return new Promise((resolve, reject) => {
      try {
        const ctx = canvas.getContext('2d');
        const config = this.getChartConfig(type, chartData);

        const chart = new Chart(ctx, config);
        
        // Attendre que l'animation soit terminée pour confirmer la création
        chart.options.onComplete = () => {
          resolve(chart);
        };

        // Fallback au cas où onComplete ne serait pas appelé
        setTimeout(() => {
          if (chart.canvas) {
            resolve(chart);
          }
        }, 2000);

      } catch (error) {
        reject(error);
      }
    });
  }

  extractColor(gradient) {
    if (!gradient) return null;
    
    // Couleur simple
    if (/^#[0-9a-fA-F]{6}$/.test(gradient)) {
      return gradient;
    }
    
    // Extraction de couleur depuis un gradient
    const colorMatches = gradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)/);
    return colorMatches ? colorMatches[0] : null;
  }

  getDefaultColor(preferenceId) {
    const colors = {
      'adore': '#7d2e79',
      'aime': '#4CAF50',
      'curiosité': '#FF9800',
      'dislike': '#FF5722',
      'non_strict': '#f44336'
    };
    return colors[preferenceId] || '#6c757d';
  }

  getChartConfig(type, chartData) {
    // Configuration de base optimisée
    const baseConfig = {
      type: type,
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: chartData.colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: this.getLegendPosition(type),
            labels: {
              padding: 15,
              usePointStyle: true,
              font: { size: 11 },
              generateLabels: (chart) => {
                const data = chart.data;
                return data.labels.map((label, index) => ({
                  text: label,
                  fillStyle: data.datasets[0].backgroundColor[index],
                  strokeStyle: data.datasets[0].backgroundColor[index],
                  pointStyle: 'circle'
                }));
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${context.raw} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeInOutQuart'
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    // Configuration spécifique par type
    this.applyTypeSpecificConfig(baseConfig, type, chartData);

    return baseConfig;
  }

  applyTypeSpecificConfig(config, type, chartData) {
    switch (type) {
      case 'bar':
        config.options.scales = {
          y: {
            beginAtZero: true,
            ticks: { 
              stepSize: 1,
              callback: (value) => Number.isInteger(value) ? value : ''
            }
          },
          x: {
            ticks: { 
              maxRotation: 45,
              minRotation: 0
            }
          }
        };
        break;
        
      case 'polarArea':
        const maxValue = Math.max(...chartData.data);
        config.options.scales = {
          r: {
            beginAtZero: true,
            max: Math.max(maxValue + 1, 3),
            ticks: { stepSize: 1 }
          }
        };
        break;
        
      case 'doughnut':
        config.options.cutout = '60%';
        break;
    }
  }

  getLegendPosition(type) {
    return type === 'polarArea' ? 'bottom' : 'right';
  }

  toggleChart(type) {
    if (type === this.currentChartType) return;

    console.log(`🔄 Changement de graphique: ${type}`);
    
    // Mettre à jour les boutons
    this.updateToggleButtons(type);
    
    // Créer le nouveau graphique
    this.createChart(type);
  }

  updateToggleButtons(activeType) {
    // Mise à jour optimisée des boutons
    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      
      const btnType = btn.id?.replace('btn-', '');
      if (btnType === activeType) {
        btn.classList.add('active');
      }
    });
  }

  updateChart() {
    // Invalider le cache et recréer
    this.chartDataCache = null;
    
    if (appState.isDetailedView && this.isChartJSReady) {
      // Debounce pour éviter les mises à jour trop fréquentes
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        this.createChart(this.currentChartType);
      }, 100);
    }
  }

  showChartError(message = '') {
    const container = document.querySelector('.chart-container');
    if (!container) return;

    const errorHTML = `
      <div class="alert alert-danger text-center m-3" role="alert">
        <i class="fas fa-exclamation-triangle mb-2 d-block"></i>
        <h6>Erreur de graphique</h6>
        <p class="mb-2">Le graphique ne peut pas être affiché.</p>
        ${message ? `<small class="text-muted d-block mb-3">Détail: ${this.escapeHtml(message)}</small>` : ''}
        <div class="btn-group" role="group">
          <button class="btn btn-sm btn-outline-danger" onclick="window.chartManager?.retryChart()">
            <i class="fas fa-redo"></i> Réessayer
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="window.chartManager?.showDebugInfo()">
            <i class="fas fa-info-circle"></i> Infos
          </button>
        </div>
      </div>
    `;

    container.innerHTML = errorHTML;
  }

  showEmptyChartMessage() {
    const container = document.querySelector('.chart-container');
    if (!container) return;

    container.innerHTML = `
      <div class="alert alert-info text-center m-3" role="alert">
        <i class="fas fa-chart-pie mb-2 d-block" style="font-size: 2rem; opacity: 0.5;"></i>
        <h6>Aucune donnée à afficher</h6>
        <p class="mb-2">Sélectionnez des préférences pour voir le graphique.</p>
        <small class="text-muted">Cliquez sur les éléments des catégories pour les sélectionner.</small>
      </div>
    `;
  }

  handleChartJSError(error) {
    console.error('❌ Erreur Chart.js:', error);
    
    // Afficher des conseils de dépannage
    const container = document.querySelector('.chart-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-warning text-center m-3">
          <i class="fas fa-exclamation-triangle mb-2"></i>
          <h6>Chart.js non disponible</h6>
          <p>La librairie de graphiques n'a pas pu être chargée.</p>
          <div class="mt-3">
            <p><strong>Solutions possibles:</strong></p>
            <ul class="list-unstyled small">
              <li>• Vérifiez votre connexion internet</li>
              <li>• Rechargez la page</li>
              <li>• Désactivez les bloqueurs de publicité</li>
              <li>• Essayez un autre navigateur</li>
            </ul>
            <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.reload()">
              <i class="fas fa-redo"></i> Recharger la page
            </button>
          </div>
        </div>
      `;
    }
  }

  retryChart() {
    console.log('🔄 Nouvelle tentative de création du graphique');
    
    // Reset des états
    this.isChartJSReady = false;
    this.chartDataCache = null;
    this.retryCount = 0;
    
    // Nouvelle tentative d'initialisation
    this.initPromise = this.initializeChartJS();
    
    setTimeout(() => {
      this.createChart(this.currentChartType);
    }, 1000);
  }

  showDebugInfo() {
    const debugInfo = {
      chartJSReady: this.isChartJSReady,
      chartJSExists: typeof Chart !== 'undefined',
      chartVersion: typeof Chart !== 'undefined' ? Chart.version : 'N/A',
      canvasExists: !!document.getElementById('preferencesChart'),
      containerExists: !!document.querySelector('.chart-container'),
      statsAvailable: !!appState.getStats(),
      currentChart: !!appState.getCurrentChart(),
      detailedView: appState.isDetailedView,
      retryCount: this.retryCount,
      cacheValid: this.chartDataCache !== null
    };

    console.table(debugInfo);

    // Afficher dans l'interface
    const container = document.querySelector('.chart-container');
    if (container) {
      const debugHTML = Object.entries(debugInfo)
        .map(([key, value]) => `<tr><td>${key}</td><td class="${value ? 'text-success' : 'text-danger'}">${value}</td></tr>`)
        .join('');

      container.innerHTML = `
        <div class="alert alert-secondary m-3">
          <h6><i class="fas fa-bug"></i> Informations de diagnostic</h6>
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead><tr><th>Propriété</th><th>Valeur</th></tr></thead>
              <tbody>${debugHTML}</tbody>
            </table>
          </div>
          <div class="mt-3">
            <button class="btn btn-sm btn-primary me-2" onclick="window.chartManager?.createChart()">
              <i class="fas fa-play"></i> Forcer la création
            </button>
            <button class="btn btn-sm btn-secondary" onclick="window.testChartJS?.()">
              <i class="fas fa-vial"></i> Test Chart.js
            </button>
          </div>
        </div>
      `;
    }
  }

  // Export PDF optimisé
  async exportToPDF() {
    try {
      const chart = appState.getCurrentChart();
      if (!chart) {
        return { success: false, message: 'Aucun graphique à exporter' };
      }

      // Créer le canvas d'export
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 800;
      exportCanvas.height = 600;
      const ctx = exportCanvas.getContext('2d');

      // Arrière-plan blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // Titre et date
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Statistiques des Préférences', exportCanvas.width / 2, 40);

      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      const date = new Date().toLocaleDateString('fr-FR');
      ctx.fillText(`Généré le ${date}`, exportCanvas.width / 2, 65);

      // Copier le graphique
      const chartCanvas = chart.canvas;
      if (chartCanvas) {
        const sourceWidth = chartCanvas.width;
        const sourceHeight = chartCanvas.height;
        const targetWidth = 600;
        const targetHeight = 400;
        const x = (exportCanvas.width - targetWidth) / 2;
        const y = 100;

        ctx.drawImage(chartCanvas, x, y, targetWidth, targetHeight);
      }

      // Ajouter les statistiques
      const stats = appState.getStats();
      if (stats) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'left';

        let yPos = 520;
        const leftMargin = 50;

        ctx.fillText(`Total sélectionné: ${stats.selectedItems}/${stats.totalItems}`, leftMargin, yPos);
        yPos += 25;
        ctx.fillText(`Completion: ${stats.completionPercentage}%`, leftMargin, yPos);
      }

      // Télécharger
      const link = document.createElement('a');
      const fileName = `preferences_chart_${date.replace(/\//g, '-')}.png`;
      link.download = fileName;
      link.href = exportCanvas.toDataURL('image/png', 0.9);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, message: `Graphique exporté: ${fileName}` };

    } catch (error) {
      console.error('Erreur export PDF:', error);
      return { success: false, message: 'Erreur lors de l\'export' };
    }
  }

  // Méthodes utilitaires
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // Nettoyage lors de la destruction
  destroy() {
    clearTimeout(this.updateTimeout);
    this.cleanupCurrentChart();
    this.chartDataCache = null;
  }
}

// Fonctions globales utilitaires
window.debugChart = () => {
  window.chartManager?.showDebugInfo();
};

window.testChartJS = () => {
  const result = {
    exists: typeof Chart !== 'undefined',
    version: typeof Chart !== 'undefined' ? Chart.version : 'N/A',
    registry: typeof Chart !== 'undefined' ? !!Chart.registry : false,
    controllers: typeof Chart !== 'undefined' ? Object.keys(Chart.registry?.controllers || {}) : []
  };
  
  console.log('🧪 Test Chart.js:', result);
  
  if (result.exists) {
    console.log('✅ Chart.js est disponible');
  } else {
    console.log('❌ Chart.js non disponible');
  }
  
  return result;
};