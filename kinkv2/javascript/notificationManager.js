// notificationManager.js - Système de notifications
import { CONFIG } from './config.js';

export class NotificationManager {
  constructor() {
    this.addToastStyles();
  }

  showToast(message, type = 'success') {
    try {
      // Supprimer les anciens toasts
      this.clearExistingToasts();

      const toast = document.createElement('div');
      toast.className = `alert alert-${type} position-fixed toast-notification`;
      toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px; animation: slideIn 0.3s ease;';

      const icon = this.getIconForType(type);
      toast.innerHTML = `<i class="fas fa-${icon} me-2"></i>${this.escapeHtml(message)}`;

      document.body.appendChild(toast);

      // Auto-suppression après délai
      setTimeout(() => {
        this.removeToast(toast);
      }, CONFIG.UI.TOAST_DURATION);

    } catch (error) {
      console.error('Erreur lors de l\'affichage du toast:', error);
      // Fallback avec alert natif
      alert(message);
    }
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'danger');
  }

  showWarning(message) {
    this.showToast(message, 'warning');
  }

  showInfo(message) {
    this.showToast(message, 'info');
  }

  clearExistingToasts() {
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }

  removeToast(toast) {
    if (toast.parentNode) {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  getIconForType(type) {
    const icons = {
      'success': 'check-circle',
      'danger': 'exclamation-circle',
      'warning': 'exclamation-triangle',
      'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addToastStyles() {
    const styleId = 'toast-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      .toast-notification {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 8px;
        font-weight: 500;
      }
      
      .toast-notification:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(style);
  }

  // Méthodes de notification spécialisées pour l'application
  notifyPreferenceChanged(itemName, newState) {
    // Notification discrète pour les changements de préférence
    // (optionnel, peut être désactivé pour éviter le spam)
  }

  notifyImportSuccess(count) {
    this.showSuccess(`${CONFIG.MESSAGES.IMPORT_SUCCESS} (${count} éléments)`);
  }

  notifyImportError(error) {
    this.showError(error || CONFIG.MESSAGES.IMPORT_ERROR);
  }

  notifyExportSuccess(count) {
    this.showSuccess(`${count} préférences exportées avec succès !`);
  }

  notifyExportError() {
    this.showError(CONFIG.MESSAGES.EXPORT_ERROR);
  }

  notifyDataLoaded() {
    this.showInfo('Données chargées avec succès');
  }

  notifyDataLoadError() {
    this.showError(CONFIG.MESSAGES.LOADING_ERROR);
  }
}