/**
 * Module de gestion des notifications toast pour l'application de gestion des préférences Kink
 */
import { CONFIG } from './config.js';
import { escapeHtml } from './utils.js';

/**
 * Classe responsable de la gestion des notifications toast
 */
export class ToastManager {
    /**
     * Affichage des toasts
     * @param {string} message - Message à afficher
     * @param {string} type - Type de toast (success, warning, danger)
     */
    static showToast(message, type = 'success') {
        try {
            // Supprimer les anciens toasts
            ToastManager.removeExistingToasts();

            const toast = ToastManager.createToastElement(message, type);
            document.body.appendChild(toast);

            // Animation d'entrée
            requestAnimationFrame(() => {
                toast.style.animation = 'slideIn 0.3s ease';
            });

            // Suppression automatique
            setTimeout(() => ToastManager.removeToast(toast), CONFIG.toastDuration);

        } catch (error) {
            console.error('Erreur lors de l\'affichage du toast:', error);
            alert(message); // Fallback
        }
    }

    /**
     * Création d'un élément toast
     * @param {string} message - Message du toast
     * @param {string} type - Type de toast
     * @returns {HTMLElement} Élément toast
     */
    static createToastElement(message, type) {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed toast-notification`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';

        const iconMap = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            danger: 'exclamation-circle'
        };

        const icon = iconMap[type] || 'info-circle';
        toast.innerHTML = `<i class="fas fa-${icon} me-2"></i>${escapeHtml(message)}`;

        return toast;
    }

    /**
     * Suppression des toasts existants
     */
    static removeExistingToasts() {
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());
    }

    /**
     * Suppression animée d'un toast
     * @param {HTMLElement} toast - Élément toast à supprimer
     */
    static removeToast(toast) {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }
}

