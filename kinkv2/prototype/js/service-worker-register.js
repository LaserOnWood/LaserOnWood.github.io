if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const serviceWorkerUrl = new URL('../sw.js', import.meta.url);
        navigator.serviceWorker.register(serviceWorkerUrl, { scope: './' })
            .then(() => console.info('Cache applicatif prêt.'))
            .catch((error) => console.warn('Cache applicatif non activé:', error));
    });
}
