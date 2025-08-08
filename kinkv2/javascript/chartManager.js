// chartManager.js - Version corrigée avec debug amélioré
import appState from './state.js';

export class ChartManager {
  constructor() {
    this.currentChartType = 'doughnut';
    this.isChartJSReady = false;
    this.initializationPromise = null;
    this.debug = false; // Activer pour debugging
    
    // Initialiser Chart.js de manière asynchrone
    this.initializationPromise = this.initializeChartJS();
  }

  async initializeChartJS() {
    return new Promise((resolve, reject) => {
      // Vérifier si Chart.js est déjà disponible
      if (typeof Chart !== 'undefined') {
        this.isChartJSReady = true;
        this.logDebug('✅ Chart.js déjà disponible');
        resolve(true);
        return;
      }

      // Attendre le chargement de Chart.js
      let attempts = 0;
      const maxAttempts = 100; // 10 secondes max
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        this.logDebug(`🔄 Tentative ${attempts}/${maxAttempts} - Vérification Chart.js...`);
        
        if (typeof Chart !== 'undefined') {
          this.isChartJSReady = true;
          clearInterval(checkInterval);
          this.logDebug('✅ Chart.js maintenant disponible');
          
          // Vérifier la version et les composants
          this.validateChartJS();
          resolve(true);
          
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          const error = 'Chart.js non disponible après 10 secondes';
          this.logDebug(`❌ ${error}`);
          this.showChartError(error);
          reject(new Error(error));
        }
      }, 100);
    });
  }

  validateChartJS() {
    try {
      this.logDebug(`📊 Chart.js version: ${Chart.version || 'inconnue'}`);
      
      // Vérifier les composants nécessaires
      const requiredComponents = ['Chart', 'DoughnutController', 'BarController'];
      const missing = [];
      
      if (!Chart.registry) {
        missing.push('Registry');
      }
      
      if (missing.length > 0) {
        this.logDebug(`⚠️ Composants manquants: ${missing.join(', ')}`);
      }
      
      return missing.length === 0;
    } catch (error) {
      this.logDebug('❌ Erreur lors de la validation Chart.js:', error);
      return false;
    }
  }

  async createChart(type = 'doughnut') {
    try {
      this.logDebug(`🎯 Tentative de création de graphique: ${type}`);
      
      // Attendre que Chart.js soit prêt
      if (!this.isChartJSReady) {
        this.logDebug('⏳ Attente de Chart.js...');
        await this.initializationPromise;
      }

      // Vérifier le canvas
      const canvas = document.getElementById('preferencesChart');
      if (!canvas) {
        throw new Error('Canvas preferencesChart introuvable dans le DOM');
      }
      this.logDebug('✅ Canvas trouvé');

      // Vérifier les données
      const stats = appState.getStats();
      if (!stats) {
        throw new Error('Statistiques non disponibles');
      }
      this.logDebug('✅ Statistiques disponibles:', stats);

      // Détruire l'ancien graphique
      const currentChart = appState.getCurrentChart();
      if (currentChart) {
        this.logDebug('🗑️ Destruction de l\'ancien graphique');
        try {
          currentChart.destroy();
        } catch (destroyError) {
          this.logDebug('⚠️ Erreur lors de la destruction:', destroyError);
        }
      }

      // Préparer les données
      const chartData = this.prepareChartData(stats);
      this.logDebug('📊 Données du graphique:', chartData);
      
      if (chartData.labels.length === 0) {
        this.showEmptyChartMessage();
        return null;
      }

      // Obtenir la configuration
      const config = this.getChartConfig(type, chartData);
      this.logDebug('⚙️ Configuration du graphique:', config);

      // Créer le nouveau graphique
      const ctx = canvas.getContext('2d');
      const newChart = new Chart(ctx, config);
      
      // Sauvegarder dans l'état
      appState.setCurrentChart(newChart, type);
      this.currentChartType = type;
      
      this.logDebug(`✅ Graphique ${type} créé avec succès`);
      return newChart;

    } catch (error) {
      this.logDebug('❌ Erreur lors de la création du graphique:', error);
      this.showChartError(`Erreur: ${error.message}`);
      return null;
    }
  }

  prepareChartData(stats) {
    const labels = [];
    const data = [];
    const colors = [];

    this.logDebug('🔄 Préparation des données...');
    
    // Vérifier la structure des stats
    if (!stats.preferenceStats) {
      this.logDebug('❌ stats.preferenceStats manquant');
      return { labels, data, colors };
    }

    // Filtrer les préférences avec des valeurs > 0
    Object.entries(stats.preferenceStats).forEach(([key, stat]) => {
      this.logDebug(`📊 ${key}:`, stat);
      
      if (stat && stat.count && stat.count > 0) {
        labels.push(stat.name || key);
        data.push(stat.count);
        
        const color = this.extractColor(stat.color) || this.getDefaultColor(key);
        colors.push(color);
        
        this.logDebug(`✅ Ajouté: ${stat.name} = ${stat.count} (${color})`);
      }
    });

    this.logDebug(`📈 Données finales: ${labels.length} éléments`);
    return { labels, data, colors };
  }

  extractColor(gradient) {
    if (!gradient) return null;
    
    // Si c'est déjà une couleur simple
    if (gradient.startsWith('#')) {
      return gradient;
    }
    
    if (!gradient.includes('gradient')) {
      return gradient;
    }
    
    // Extraire la première couleur du gradient
    const colorPatterns = [
      /#[0-9a-fA-F]{6}/,
      /#[0-9a-fA-F]{3}/,
      /rgb\([^)]+\)/,
      /rgba\([^)]+\)/
    ];
    
    for (const pattern of colorPatterns) {
      const match = gradient.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    // Fallback : couleurs connues
    const knownColors = {
      '#7d2e79': '#7d2e79', // adore
      '#4CAF50': '#4CAF50', // aime
      '#FF9800': '#FF9800', // curiosité
      '#FF5722': '#FF5722', // dislike
      '#f44336': '#f44336'  // non_strict
    };
    
    for (const [search, color] of Object.entries(knownColors)) {
      if (gradient.includes(search)) {
        return color;
      }
    }
    
    return null;
  }

  getDefaultColor(preferenceId) {
    const defaultColors = {
      'adore': '#7d2e79',
      'aime': '#4CAF50', 
      'curiosité': '#FF9800',
      'dislike': '#FF5722',
      'non_strict': '#f44336'
    };
    return defaultColors[preferenceId] || '#6c757d';
  }

  getChartConfig(type, chartData) {
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
            position: type === 'polarArea' ? 'bottom' : 'right',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${context.raw} (${percentage}%)`;
              }
            }
          }
        },
        // Configuration pour éviter les erreurs d'animation
        animation: {
          duration: 1000,
          onComplete: () => {
            this.logDebug('✅ Animation du graphique terminée');
          }
        }
      }
    };

    // Configuration spécifique par type
    switch (type) {
      case 'bar':
        baseConfig.options.scales = {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            ticks: {
              maxRotation: 45
            }
          }
        };
        break;
        
      case 'polarArea':
        const maxValue = Math.max(...chartData.data);
        baseConfig.options.scales = {
          r: {
            beginAtZero: true,
            max: maxValue > 0 ? maxValue + 1 : 5,
            ticks: {
              stepSize: 1
            }
          }
        };
        break;
        
      case 'doughnut':
      case 'pie':
        // Configuration par défaut suffit
        break;
    }

    return baseConfig;
  }

  toggleChart(type) {
    this.logDebug(`🔄 Changement de type de graphique: ${type}`);
    
    this.currentChartType = type;

    // Mettre à jour les boutons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`btn-${type}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Créer le nouveau graphique
    this.createChart(type);
  }

  updateChart() {
    this.logDebug('🔄 Mise à jour du graphique demandée');
    
    if (appState.isDetailedView && this.isChartJSReady) {
      this.createChart(this.currentChartType);
    } else {
      this.logDebug('⏭️ Mise à jour ignorée (vue non détaillée ou Chart.js non prêt)');
    }
  }

  showChartError(message = '') {
    const container = document.querySelector('.chart-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger text-center" role="alert">
          <i class="fas fa-exclamation-triangle mb-2"></i>
          <h6>Erreur de graphique</h6>
          <p>Le graphique ne peut pas être affiché.</p>
          ${message ? `<small class="text-muted">Détail : ${message}</small>` : ''}
          <div class="mt-3">
            <button class="btn btn-sm btn-outline-danger me-2" onclick="window.chartManager?.retryChart()">
              <i class="fas fa-redo"></i> Réessayer
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="window.chartManager?.debugChart()">
              <i class="fas fa-bug"></i> Debug
            </button>
          </div>
        </div>
      `;
    }
  }

  showEmptyChartMessage() {
    const container = document.querySelector('.chart-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-info text-center" role="alert">
          <i class="fas fa-chart-pie mb-2"></i>
          <h6>Aucune donnée à afficher</h6>
          <p>Sélectionnez des préférences pour voir le graphique.</p>
          <small class="text-muted">Cliquez sur les éléments des catégories pour les sélectionner.</small>
        </div>
      `;
    }
  }

  retryChart() {
    this.logDebug('🔄 Nouvelle tentative de création du graphique');
    this.isChartJSReady = false;
    this.initializationPromise = this.initializeChartJS();
    
    setTimeout(() => {
      this.createChart(this.currentChartType);
    }, 1000);
  }

  debugChart() {
    this.logDebug('🐛 Mode debug activé');
    
    const debugInfo = {
      chartJSReady: this.isChartJSReady,
      chartJSExists: typeof Chart !== 'undefined',
      chartVersion: typeof Chart !== 'undefined' ? Chart.version : 'N/A',
      canvasExists: !!document.getElementById('preferencesChart'),
      statsAvailable: !!appState.getStats(),
      currentChart: !!appState.getCurrentChart(),
      detailedView: appState.isDetailedView
    };
    
    console.table(debugInfo);
    
    // Afficher dans l'interface
    const container = document.querySelector('.chart-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-warning">
          <h6>🐛 Informations de debug</h6>
          <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
          <button class="btn btn-sm btn-primary mt-2" onclick="window.chartManager?.createChart()">
            Forcer la création
          </button>
        </div>
      `;
    }
  }

  logDebug(message, data = null) {
    if (this.debug) {
      if (data) {
        console.log(`[ChartManager] ${message}`, data);
      } else {
        console.log(`[ChartManager] ${message}`);
      }
    }
  }

  // Désactiver le debug pour la production
  disableDebug() {
    this.debug = false;
  }
}

// Fonctions utilitaires pour debugging global
window.debugChart = () => {
  if (window.chartManager) {
    window.chartManager.debugChart();
  } else {
    console.log('ChartManager non disponible');
  }
};

window.testChartJS = () => {
  console.log('Test Chart.js:', {
    exists: typeof Chart !== 'undefined',
    version: typeof Chart !== 'undefined' ? Chart.version : 'N/A',
    registry: typeof Chart !== 'undefined' ? !!Chart.registry : false
  });
};