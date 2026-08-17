/**
 * Façades asynchrones pour les fonctionnalités utilisées ponctuellement.
 */
export class LazyShareManager {
    constructor(preferencesManager, kinkData) {
        this.preferencesManager = preferencesManager;
        this.kinkData = kinkData;
        this.instancePromise = null;
    }

    async getInstance() {
        if (!this.instancePromise) {
            this.instancePromise = import('./secure-share-manager.js').then(({ SecureShareManager }) => (
                new SecureShareManager(this.preferencesManager, this.kinkData)
            ));
        }
        return this.instancePromise;
    }

    async showShareModal() {
        return (await this.getInstance()).showShareModal();
    }

    async loadFromShare(shareId, shareKey) {
        return (await this.getInstance()).loadFromShare(shareId, shareKey);
    }
}

export class LazyQuizManager {
    constructor(kinkData, preferencesManager, statsManager) {
        this.kinkData = kinkData;
        this.preferencesManager = preferencesManager;
        this.statsManager = statsManager;
        this.instancePromise = null;
    }

    async getInstance() {
        if (!this.instancePromise) {
            this.instancePromise = import('./guided-quiz-manager.js').then(({ GuidedQuizManager }) => (
                new GuidedQuizManager(this.kinkData, this.preferencesManager, this.statsManager)
            ));
        }
        return this.instancePromise;
    }

    async startQuiz(mode) {
        return (await this.getInstance()).startQuiz(mode);
    }
}
