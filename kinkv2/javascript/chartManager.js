// chartManager.js - Gestion des graphiques avec Chart.js
import appState from './state.js';

export class ChartManager {
  constructor() {
    this.currentChartType = 'doughnut';
  }

  createChart(type = 'doughnut') {
    const canvas = document.getElementById('preferencesChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const stats = appState.getStats();
    if (!stats) return;

    // Détruire l'ancien graphique
    const currentChart = appState.getCurrentChart();
    if (currentChart) {
      currentChart.destroy();
    }

    const labels = Object.values(stats.preferenceStats).map(s => s.name);
    const data = Object.values(stats.preferenceStats).map(s => s.count);
    const colors = Object.values(stats.preferenceStats).map(s => s.color);

    const config = {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: type === 'radar' ? 'bottom' : 'right'
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
        scales: type === 'bar' ? {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        } : type === 'radar' ? {
          r: {
            beginAtZero: true,
            max: Math.max(...data) + 1
          }
        } : {}
      }
    };

    const newChart = new Chart(ctx, config);
    appState.setCurrentChart(newChart, type);
    this.currentChartType = type;
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
    if (appState.isDetailedView) {
      this.createChart(this.currentChartType);
    }
  }
}