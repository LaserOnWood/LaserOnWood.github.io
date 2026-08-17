/**
 * Module de gestion d'import/export pour l'application de gestion des préférences Kink
 */
import { CONFIG } from './config.js';
import { readFileAsJson, downloadJsonFile, getDateString } from './core-utils.js';
import { DataLoader } from './data-loader.js';
import { ToastManager } from './core-utils.js';

/**
 * Classe responsable de la gestion des imports et exports
 */
export class ImportExportManager {
    constructor(preferencesManager, statsManager) {
        this.preferencesManager = preferencesManager;
        this.statsManager = statsManager;
        this.isExporting = false;
        this.isImporting = false;
        this.exportProtectionTimer = null;
    }

    /**
     * Export des résultats avec protection renforcée contre les doublons
     * @param {Array} preferenceTypes - Types de préférences disponibles
     */
    exportResults(preferenceTypes) {
        console.log('🔤 Début de l\'export...');

        // Protection principale
        if (this.isExporting) {
            console.log('⚠️ Export déjà en cours, annulation');
            return;
        }

        // Activation de la protection
        this.isExporting = true;

        // Protection temporelle (timer de sécurité)
        this.exportProtectionTimer = setTimeout(() => {
            this.exportProtectionTimer = null;
        }, 2000); // 2 secondes de protection

        // Désactiver le bouton
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Export en cours...';
        }

        try {
            const selectedCount = this.preferencesManager.getSelectedCount();

            if (selectedCount === 0) {
                ToastManager.showToast('Aucune préférence sélectionnée à exporter', 'warning');
                return;
            }

            const exportData = this.preferencesManager.generateExportData(preferenceTypes);

            // Téléchargement sécurisé
            downloadJsonFile(exportData, `Mes_preferences_${getDateString()}.json`);
            ToastManager.showToast(`${selectedCount} préférences exportées avec succès !`, 'success');

            console.log('✅ Export terminé avec succès');

        } catch (error) {
            console.error('❌ Erreur lors de l\'export:', error);
            ToastManager.showToast('Erreur lors de l\'export des préférences', 'danger');
        } finally {
            // Réactivation après délai de sécurité
            setTimeout(() => {
                this.isExporting = false;

                // Réactiver le bouton
                const exportBtn2 = document.getElementById('exportBtn');
                if (exportBtn2) {
                    exportBtn2.disabled = false;
                    exportBtn2.innerHTML = '<i class="fas fa-download"></i> Exporter mes préférences';
                }

                console.log('🔓 Export réactivé');
            }, 1000); // 1 seconde de délai
        }
    }

    /**
     * Import des résultats
     * @param {HTMLInputElement} input - Input file
     */
    async importResults(input) {
        if (this.isImporting) {
            console.log('⚠️ Import déjà en cours...');
            return;
        }

        const file = input.files[0];
        if (!file) return;

        this.isImporting = true;
        console.log('🔥 Début de l\'import...');

        try {
            await this.validateAndImportFile(file);
            console.log('✅ Import terminé avec succès');
            return true;
        } catch (error) {
            ToastManager.showToast(error.message, 'danger');
            return false;
        } finally {
            input.value = '';
            setTimeout(() => {
                this.isImporting = false;
                console.log('🔓 Import réactivé');
            }, 500);
        }
    }

    /**
     * Validation et import du fichier
     * @param {File} file - Fichier à importer
     */
    async validateAndImportFile(file) {
        // Validation du type de fichier
        if (!file.type.includes('application/json') && !file.name.endsWith('.json')) {
            throw new Error('Veuillez sélectionner un fichier JSON valide');
        }

        // Validation de la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Le fichier est trop volumineux (max 5MB)');
        }

        const data = await readFileAsJson(file);
        const validPreferences = DataLoader.validateImportData(data);

        this.applyImportedPreferences(validPreferences);

        const importedCount = validPreferences.size;
        ToastManager.showToast(`Préférences importées avec succès ! (${importedCount} éléments)`, 'success');
    }

    /**
     * Application des préférences importées
     * @param {Map} validPreferences - Préférences validées
     */
    applyImportedPreferences(validPreferences) {
        this.resetAllPreferences();
        this.preferencesManager.applyImportedPreferences(validPreferences);
        this.updateAllItems();
        this.statsManager.calculateCacheData();
        this.statsManager.updateInterface();
    }

    /**
     * Réinitialisation de toutes les préférences
     */
    resetAllPreferences() {
        const items = document.querySelectorAll('.item');
        items.forEach(item => {
            CONFIG.validImportStates.forEach(state => {
                item.classList.remove(state);
            });
        });
        this.preferencesManager.resetAllPreferences();
    }

    /**
     * Mise à jour de tous les items
     */
    updateAllItems() {
        const items = document.querySelectorAll('.item');
        const preferences = this.preferencesManager.getAllPreferences();

        items.forEach(item => {
            const itemName = item.dataset.item;
            if (itemName && preferences.has(itemName)) {
                const preference = preferences.get(itemName);
                if (preference !== 'none') {
                    // Nettoyer d'abord les anciennes classes
                    CONFIG.validImportStates.forEach(state => {
                        item.classList.remove(state);
                    });
                    // Ajouter la nouvelle classe
                    item.classList.add(preference);
                }
            }
        });
    }
}
