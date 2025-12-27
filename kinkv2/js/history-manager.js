/**
 * Module de gestion de l'historique pour l'application de gestion des préférences Kink
 * Implémente un système d'undo/redo avec limite de mémoire
 */

/**
 * Classe responsable de la gestion de l'historique des modifications
 */
export class HistoryManager {
    constructor(maxHistory = 50) {
        this.history = []; // Pile d'états
        this.currentIndex = -1; // Index de l'état actuel
        this.maxHistory = maxHistory; // Nombre max d'états sauvegardés
        this.isRestoring = false; // Flag pour éviter les boucles infinies
        this.listeners = new Set(); // Écouteurs de changement d'état
    }

    /**
     * Sauvegarde un nouvel état dans l'historique
     * @param {Map} preferences - État actuel des préférences
     * @param {string} action - Description de l'action (optionnel)
     */
    saveState(preferences, action = 'modification') {
        // Ne pas sauvegarder si on est en train de restaurer
        if (this.isRestoring) return;

        // Créer une copie profonde de l'état
        const state = {
            preferences: new Map(preferences),
            timestamp: Date.now(),
            action: action
        };

        // Si on n'est pas à la fin de l'historique, supprimer tous les états après
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Ajouter le nouvel état
        this.history.push(state);
        this.currentIndex++;

        // Limiter la taille de l'historique
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }

        // Notifier les écouteurs du changement
        this.notifyListeners();

        console.log(`📝 État sauvegardé: ${action} (${this.currentIndex + 1}/${this.history.length})`);
    }

    /**
     * Annule la dernière action (undo)
     * @returns {Map|null} État précédent ou null si impossible
     */
    undo() {
        if (!this.canUndo()) {
            console.log('⚠️ Impossible d\'annuler: début de l\'historique atteint');
            return null;
        }

        this.currentIndex--;
        const previousState = this.history[this.currentIndex];
        
        console.log(`↶ Undo: retour à l'état "${previousState.action}" (${this.currentIndex + 1}/${this.history.length})`);
        
        this.notifyListeners();
        return new Map(previousState.preferences);
    }

    /**
     * Rétablit l'action annulée (redo)
     * @returns {Map|null} État suivant ou null si impossible
     */
    redo() {
        if (!this.canRedo()) {
            console.log('⚠️ Impossible de rétablir: fin de l\'historique atteint');
            return null;
        }

        this.currentIndex++;
        const nextState = this.history[this.currentIndex];
        
        console.log(`↷ Redo: avance à l'état "${nextState.action}" (${this.currentIndex + 1}/${this.history.length})`);
        
        this.notifyListeners();
        return new Map(nextState.preferences);
    }

    /**
     * Vérifie si un undo est possible
     * @returns {boolean}
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Vérifie si un redo est possible
     * @returns {boolean}
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Obtient l'état actuel
     * @returns {Object|null}
     */
    getCurrentState() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex];
        }
        return null;
    }

    /**
     * Obtient les informations sur l'historique
     * @returns {Object}
     */
    getHistoryInfo() {
        return {
            totalStates: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            currentAction: this.getCurrentState()?.action || 'aucune',
            previousAction: this.canUndo() ? this.history[this.currentIndex - 1].action : null,
            nextAction: this.canRedo() ? this.history[this.currentIndex + 1].action : null
        };
    }

    /**
     * Obtient la liste complète de l'historique (pour visualisation)
     * @returns {Array}
     */
    getHistoryList() {
        return this.history.map((state, index) => ({
            index: index,
            action: state.action,
            timestamp: state.timestamp,
            isCurrent: index === this.currentIndex,
            itemCount: state.preferences.size
        }));
    }

    /**
     * Revient à un état spécifique de l'historique
     * @param {number} targetIndex - Index de l'état cible
     * @returns {Map|null}
     */
    goToState(targetIndex) {
        if (targetIndex < 0 || targetIndex >= this.history.length) {
            console.log('⚠️ Index d\'historique invalide');
            return null;
        }

        this.currentIndex = targetIndex;
        const targetState = this.history[targetIndex];
        
        console.log(`⏭️ Saut vers l'état "${targetState.action}" (${this.currentIndex + 1}/${this.history.length})`);
        
        this.notifyListeners();
        return new Map(targetState.preferences);
    }

    /**
     * Efface l'historique
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.notifyListeners();
        console.log('🗑️ Historique effacé');
    }

    /**
     * Active le mode restauration (pour éviter de sauvegarder lors d'un undo/redo)
     * @param {boolean} value
     */
    setRestoring(value) {
        this.isRestoring = value;
    }

    /**
     * Ajoute un écouteur pour les changements d'historique
     * @param {Function} listener - Fonction callback
     */
    addListener(listener) {
        this.listeners.add(listener);
    }

    /**
     * Retire un écouteur
     * @param {Function} listener - Fonction callback
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }

    /**
     * Notifie tous les écouteurs d'un changement
     */
    notifyListeners() {
        const info = this.getHistoryInfo();
        this.listeners.forEach(listener => {
            try {
                listener(info);
            } catch (error) {
                console.error('Erreur dans le listener d\'historique:', error);
            }
        });
    }

    /**
     * Exporte l'historique pour sauvegarde
     * @returns {Object}
     */
    exportHistory() {
        return {
            history: this.history.map(state => ({
                preferences: Object.fromEntries(state.preferences),
                timestamp: state.timestamp,
                action: state.action
            })),
            currentIndex: this.currentIndex,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Importe un historique sauvegardé
     * @param {Object} data - Données d'historique exportées
     * @returns {boolean}
     */
    importHistory(data) {
        try {
            if (!data.history || !Array.isArray(data.history)) {
                throw new Error('Format d\'historique invalide');
            }

            this.history = data.history.map(state => ({
                preferences: new Map(Object.entries(state.preferences)),
                timestamp: state.timestamp,
                action: state.action
            }));

            this.currentIndex = Math.min(data.currentIndex, this.history.length - 1);
            this.notifyListeners();

            console.log(`✅ Historique importé: ${this.history.length} états`);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'import de l\'historique:', error);
            return false;
        }
    }

    /**
     * Obtient des statistiques sur l'utilisation
     * @returns {Object}
     */
    getStatistics() {
        if (this.history.length === 0) {
            return {
                totalActions: 0,
                oldestAction: null,
                newestAction: null,
                averageItemsPerState: 0
            };
        }

        const totalItems = this.history.reduce((sum, state) => sum + state.preferences.size, 0);

        return {
            totalActions: this.history.length,
            oldestAction: new Date(this.history[0].timestamp).toLocaleString('fr-FR'),
            newestAction: new Date(this.history[this.history.length - 1].timestamp).toLocaleString('fr-FR'),
            averageItemsPerState: Math.round(totalItems / this.history.length),
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estime l'utilisation mémoire (approximative)
     * @returns {string}
     */
    estimateMemoryUsage() {
        const jsonSize = JSON.stringify(this.exportHistory()).length;
        const sizeInKB = (jsonSize / 1024).toFixed(2);
        return `${sizeInKB} KB`;
    }
}