// chartManager.js - Gestion des graphiques avec Chart.js (version corrigée)
import appState from './state.js';

export class ChartManager {
  constructor() {
    this.currentChartType = 'doughnut';
    this.isChartJSReady = false;
    this.checkChartJSAvailability();
  }

  checkChartJSAvailability() {
    // Vérifier si Chart.js est disponible
    const checkChart = () => {
      if (typeof Chart !== 'undefined') {
        this.isChartJSReady = true;
        console.log('✅ Chart.js disponible');
        return true;
      }
      return false;
    };

    if (!checkChart()) {
      // Attendre que Chart.js se charge
      let attempts = 0;
      const maxAttempts = 50; // 5 secondes max
      
      const waitForChart = setInterval(() => {
        attempts++;
        if (checkChart() || attempts >= maxAttempts) {
          clearInterval(waitForChart);
          if (!this.isChartJSReady) {
            console.error('❌ Chart.js non disponible après 5 secondes');
            this.showChartError();
          }
        }
      }, 100);
    }
  }

  createChart(type = 'doughnut') {
    if (!this.isChartJSReady) {
      console.warn('Chart.js pas encore prêt, tentative ultérieure...');
      setTimeout(() => this.createChart(type), 500);
      return;
    }

    const canvas = document.getElementById('preferencesChart');
    if (!canvas) {
      console.warn('Canvas preferencesChart non trouvé');
      return;
    }

    const ctx = canvas.getContext('2d');
    const stats = appState.getStats();
    if (!stats) {
      console.warn('Statistiques non disponibles');
      return;
    }

    try {
      // Détruire l'ancien graphique
      const currentChart = appState.getCurrentChart();
      if (currentChart) {
        currentChart.destroy();
      }

      // Préparer les données - filtrer les valeurs à 0
      const chartData = this.prepareChartData(stats);
      
      if (chartData.labels.length === 0) {
        this.showEmptyChartMessage();
        return;
      }

      const config = this.getChartConfig(type, chartData);
      const newChart = new Chart(ctx, config);
      
      appState.setCurrentChart(newChart, type);
      this.currentChartType = type;
      
      console.log(`✅ Graphique ${type} créé avec succès`);

    } catch (error) {
      console.error('Erreur lors de la création du graphique:', error);
      this.showChartError(error.message);
    }
  }

  prepareChartData(stats) {
    const labels = [];
    const data = [];
    const colors = [];

    // Filtrer les préférences avec des valeurs > 0
    Object.entries(stats.preferenceStats).forEach(([key, stat]) => {
      if (stat.count > 0) {
        labels.push(stat.name);
        data.push(stat.count);
        // Extraire la couleur du gradient ou utiliser une couleur de fallback
        colors.push(this.extractColor(stat.color) || this.getDefaultColor(key));
      }
    });

    return { labels, data, colors };
  }

  extractColor(gradient) {
    if (!gradient) return null;
    
    // Si c'est déjà une couleur simple
    if (!gradient.includes('gradient')) {
      return gradient;
    }
    
    // Extraire la première couleur du gradient
    const match = gradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)/);
    if (match) {
      return match[0];
    }
    
    // Fallback : extraire les couleurs connues du gradient
    if (gradient.includes('#7d2e79')) return '#7d2e79'; // adore
    if (gradient.includes('#4CAF50')) return '#4CAF50'; // aime
    if (gradient.includes('#FF9800')) return '#FF9800'; // curiosité
    if (gradient.includes('#FF5722')) return '#FF5722'; // dislike
    if (gradient.includes('#f44336')) return '#f44336'; // non_strict
    
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
            position: type === 'radar' ? 'bottom' : 'right',
            labels: {
              padding: 20,
              usePointStyle: true
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
          }
        };
        break;
        
      case 'radar':
        baseConfig.options.scales = {
          r: {
            beginAtZero: true,
            max: Math.max(...chartData.data) + 1,
            ticks: {
              stepSize: 1
            }
          }
        };
        break;
    }

    return baseConfig;
  }

  toggleChart(type) {
    this.currentChartType = type;

    // Mettre à jour les boutons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.getElementById(`btn-${type}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.createChart(type);
  }

  updateChart() {
    if (appState.isDetailedView && this.isChartJSReady) {
      this.createChart(this.currentChartType);
    }
  }

  showChartError(message = '') {
    const container = document.querySelector('.chart-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-warning text-center" role="alert">
          <i class="fas fa-exclamation-triangle"></i>
          <h6>Erreur de graphique</h6>
          <p>Le graphique ne peut pas être affiché.</p>
          ${message ? `<small class="text-muted">Détail : ${message}</small>` : ''}
          <button class="btn btn-sm btn-outline-warning mt-2" onclick="window.chartManager?.retryChart()">
            <i class="fas fa-redo"></i> Réessayer
          </button>
        </div>
      `;
    }
  }

  showEmptyChartMessage() {
    const container = document.querySelector('.chart-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-info text-center" role="alert">
          <i class="fas fa-chart-pie"></i>
          <h6>Aucune donnée à afficher</h6>
          <p>Sélectionnez des préférences pour voir le graphique.</p>
        </div>
      `;
    }
  }

  retryChart() {
    this.checkChartJSAvailability();
    setTimeout(() => {
      if (this.isChartJSReady) {
        this.createChart(this.currentChartType);
      }
    }, 500);
  }

  // Export PDF avec jsPDF
  async exportToPDF() {
    try {
      // Vérifier si jsPDF est disponible
      if (typeof window.jsPDF === 'undefined') {
        await this.loadJsPDF();
      }

      const stats = appState.getStats();
      if (!stats) {
        throw new Error('Aucune statistique disponible');
      }

      // Créer le PDF
      const pdf = new window.jsPDF('p', 'mm', 'a4');
      
      // Configuration
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // En-tête
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('Mes Préférences - Rapport Détaillé', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Date
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      const today = new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      pdf.text(`Généré le ${today}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;

      // Vue d'ensemble
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('📊 Vue d\'ensemble', margin, yPos);
      yPos += 10;

      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`• Total d'éléments explorés : ${stats.selectedItems} / ${stats.totalItems}`, margin, yPos);
      yPos += 7;
      pdf.text(`• Pourcentage de completion : ${stats.completionPercentage}%`, margin, yPos);
      yPos += 15;

      // Répartition des préférences
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('🎯 Répartition des préférences', margin, yPos);
      yPos += 10;

      // Tableau des préférences
      Object.entries(stats.preferenceStats).forEach(([key, stat]) => {
        if (stat.count > 0) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'normal');
          pdf.text(`• ${stat.name} : ${stat.count} (${stat.percentage}%)`, margin, yPos);
          yPos += 7;
        }
      });
      yPos += 10;

      // Analyse par catégorie
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('📂 Analyse par catégorie', margin, yPos);
      yPos += 10;

      Object.entries(stats.categoryStats).forEach(([categoryId, categoryData]) => {
        if (categoryData.selected > 0) {
          // Vérifier si on a assez de place
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }

          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${categoryData.name}`, margin, yPos);
          yPos += 7;
          
          pdf.setFont(undefined, 'normal');
          pdf.text(`  Sélectionnées : ${categoryData.selected} / ${categoryData.total} (${categoryData.percentage}%)`, margin, yPos);
          yPos += 10;
        }
      });

      // Ajouter le graphique si disponible
      if (this.isChartJSReady && appState.getCurrentChart()) {
        const canvas = document.getElementById('preferencesChart');
        if (canvas) {
          try {
            // Nouvelle page pour le graphique
            pdf.addPage();
            yPos = margin;

            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text('📈 Graphique des préférences', pageWidth / 2, yPos, { align: 'center' });
            yPos += 20;

            // Convertir le canvas en image
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
          } catch (error) {
            console.warn('Impossible d\'ajouter le graphique au PDF:', error);
          }
        }
      }

      // Pied de page
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'italic');
      pdf.text('Généré par KinkList - Application de gestion des préférences', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Sauvegarder
      const filename = `Mes_preferences_${today.replace(/\s+/g, '_').replace(/,/g, '')}.pdf`;
      pdf.save(filename);

      return {
        success: true,
        message: 'Rapport PDF généré avec succès !',
        filename: filename
      };

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      return {
        success: false,
        message: `Erreur lors de la génération du PDF: ${error.message}`
      };
    }
  }

  async loadJsPDF() {
    return new Promise((resolve, reject) => {
      if (typeof window.jsPDF !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        if (typeof window.jsPDF !== 'undefined') {
          resolve();
        } else {
          reject(new Error('jsPDF non disponible après chargement'));
        }
      };
      script.onerror = () => reject(new Error('Erreur de chargement de jsPDF'));
      document.head.appendChild(script);
    });
  }
}