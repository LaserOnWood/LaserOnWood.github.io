import { ToastManager } from './core-utils.js';

/**
 * Charge le générateur d’image et html2canvas uniquement à la première demande.
 */
export class LazyImageGenerator {
    constructor(kind, preferencesManager, kinkData) {
        this.kind = kind;
        this.preferencesManager = preferencesManager;
        this.kinkData = kinkData;
        this.instancePromise = null;
    }

    async getInstance() {
        if (!this.instancePromise) {
            this.instancePromise = this.loadInstance();
        }
        return this.instancePromise;
    }

    async loadInstance() {
        ToastManager.showToast('Préparation du générateur d’image…', 'warning');
        await this.loadHtml2Canvas();

        if (this.kind === 'category') {
            const { ImageGeneratorByCategory } = await import('./image-generator-categories.js');
            return new ImageGeneratorByCategory(this.preferencesManager, this.kinkData);
        }

        const { ImageGeneratorByPreference } = await import('./image-generator-preferences.js');
        return new ImageGeneratorByPreference(this.preferencesManager, this.kinkData);
    }

    loadHtml2Canvas() {
        if (window.html2canvas) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector('script[data-library="html2canvas"]');
            if (existingScript) {
                existingScript.addEventListener('load', resolve, { once: true });
                existingScript.addEventListener('error', () => reject(new Error('html2canvas indisponible')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.integrity = 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H';
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';
            script.async = true;
            script.dataset.library = 'html2canvas';
            script.addEventListener('load', resolve, { once: true });
            script.addEventListener('error', () => reject(new Error('Le générateur d’image n’a pas pu être chargé.')), { once: true });
            document.head.appendChild(script);
        });
    }

    async generatePreferencesImage() {
        try {
            const generator = await this.getInstance();
            return generator.generatePreferencesImage();
        } catch (error) {
            this.instancePromise = null;
            ToastManager.showToast(error.message || 'Erreur de chargement du générateur d’image', 'danger');
            throw error;
        }
    }
}
