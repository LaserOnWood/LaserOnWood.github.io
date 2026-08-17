/**
 * Historique compact pour KinkList.
 * Un état complet est conservé uniquement comme point de départ ; les états
 * suivants mémorisent les différences, ce qui limite la mémoire à O(changements).
 */
export class HistoryManager {
    constructor(maxHistory = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = maxHistory;
        this.isRestoring = false;
        this.listeners = new Set();
    }

    saveState(preferences, action = 'modification') {
        if (this.isRestoring) return;

        const nextPreferences = new Map(preferences);
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        const previousPreferences = this.currentIndex >= 0
            ? this.getStateAt(this.currentIndex)
            : null;
        const state = this.createHistoryEntry(previousPreferences, nextPreferences, action);
        this.history.push(state);
        this.currentIndex += 1;

        if (this.history.length > this.maxHistory) {
            this.compactAfterTrim();
        }

        this.notifyListeners();
        console.log(`📝 État sauvegardé: ${action} (${this.currentIndex + 1}/${this.history.length})`);
    }

    createHistoryEntry(previousPreferences, nextPreferences, action) {
        const entry = {
            timestamp: Date.now(),
            action,
            itemCount: nextPreferences.size
        };

        if (!previousPreferences) {
            entry.snapshot = new Map(nextPreferences);
            entry.changes = null;
            return entry;
        }

        const changes = new Map();
        const keys = new Set([...previousPreferences.keys(), ...nextPreferences.keys()]);
        keys.forEach((key) => {
            const previous = previousPreferences.get(key) ?? null;
            const next = nextPreferences.get(key) ?? null;
            if (previous !== next) {
                changes.set(key, { previous, next });
            }
        });

        entry.changes = changes;
        entry.snapshot = null;
        return entry;
    }

    compactAfterTrim() {
        const retainedStates = [];
        for (let index = 1; index < this.history.length; index += 1) {
            retainedStates.push(this.getStateAt(index));
        }
        const retainedMetadata = this.history.slice(1).map(({ timestamp, action }) => ({ timestamp, action }));
        this.history = retainedStates.map((preferences, index) => {
            const previous = index > 0 ? retainedStates[index - 1] : null;
            const entry = this.createHistoryEntry(previous, preferences, retainedMetadata[index].action);
            entry.timestamp = retainedMetadata[index].timestamp;
            return entry;
        });
        this.currentIndex = Math.max(0, this.currentIndex - 1);
    }

    getStateAt(index) {
        if (index < 0 || index >= this.history.length) return null;
        let state = null;

        for (let cursor = 0; cursor <= index; cursor += 1) {
            const entry = this.history[cursor];
            if (entry.snapshot) {
                state = new Map(entry.snapshot);
                continue;
            }
            if (!state) state = new Map();
            entry.changes.forEach(({ next }, key) => {
                if (next === null) state.delete(key);
                else state.set(key, next);
            });
        }
        return state || new Map();
    }

    undo() {
        if (!this.canUndo()) return null;
        this.currentIndex -= 1;
        const state = this.getCurrentState();
        this.notifyListeners();
        return state?.preferences || null;
    }

    redo() {
        if (!this.canRedo()) return null;
        this.currentIndex += 1;
        const state = this.getCurrentState();
        this.notifyListeners();
        return state?.preferences || null;
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    getCurrentState() {
        if (this.currentIndex < 0 || this.currentIndex >= this.history.length) return null;
        const entry = this.history[this.currentIndex];
        return {
            ...entry,
            preferences: this.getStateAt(this.currentIndex)
        };
    }

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

    getHistoryList() {
        return this.history.map((state, index) => ({
            index,
            action: state.action,
            timestamp: state.timestamp,
            isCurrent: index === this.currentIndex,
            itemCount: state.itemCount
        }));
    }

    goToState(targetIndex) {
        if (targetIndex < 0 || targetIndex >= this.history.length) return null;
        this.currentIndex = targetIndex;
        this.notifyListeners();
        return this.getStateAt(targetIndex);
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.notifyListeners();
    }

    setRestoring(value) {
        this.isRestoring = value;
    }

    addListener(listener) {
        this.listeners.add(listener);
    }

    removeListener(listener) {
        this.listeners.delete(listener);
    }

    notifyListeners() {
        const info = this.getHistoryInfo();
        this.listeners.forEach((listener) => {
            try {
                listener(info);
            } catch (error) {
                console.error('Erreur dans le listener d’historique:', error);
            }
        });
    }

    exportHistory() {
        return {
            history: this.history.map((entry, index) => ({
                preferences: Object.fromEntries(this.getStateAt(index)),
                timestamp: entry.timestamp,
                action: entry.action
            })),
            currentIndex: this.currentIndex,
            exportDate: new Date().toISOString()
        };
    }

    importHistory(data) {
        try {
            if (!Array.isArray(data?.history)) throw new Error('Format d’historique invalide');
            this.history = [];
            this.currentIndex = -1;
            data.history.forEach((state) => {
                const previous = this.currentIndex >= 0 ? this.getStateAt(this.currentIndex) : null;
                const entry = this.createHistoryEntry(previous, new Map(Object.entries(state.preferences || {})), state.action || 'importé');
                entry.timestamp = state.timestamp || Date.now();
                this.history.push(entry);
                this.currentIndex += 1;
            });
            this.currentIndex = Math.min(Math.max(data.currentIndex ?? this.history.length - 1, 0), this.history.length - 1);
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Erreur lors de l’import de l’historique:', error);
            return false;
        }
    }

    getStatistics() {
        if (this.history.length === 0) {
            return { totalActions: 0, oldestAction: null, newestAction: null, averageItemsPerState: 0, memoryUsage: '0 KB' };
        }
        const totalItems = this.history.reduce((sum, state) => sum + state.itemCount, 0);
        return {
            totalActions: this.history.length,
            oldestAction: new Date(this.history[0].timestamp).toLocaleString('fr-FR'),
            newestAction: new Date(this.history[this.history.length - 1].timestamp).toLocaleString('fr-FR'),
            averageItemsPerState: Math.round(totalItems / this.history.length),
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    estimateMemoryUsage() {
        const serializable = this.history.map((entry) => ({
            ...entry,
            snapshot: entry.snapshot ? Object.fromEntries(entry.snapshot) : null,
            changes: entry.changes ? [...entry.changes] : null
        }));
        return `${(JSON.stringify(serializable).length / 1024).toFixed(2)} KB`;
    }
}
