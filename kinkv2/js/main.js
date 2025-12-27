/**
 * Point d'entrée principal de l'application de gestion des préférences Kink
 * Version modulaire - Initialisation sécurisée
 */
import { KinkPreferencesApp } from './app.js';

// Variables globales pour l'application
let kinkApp = null;
let isAppInitialized = false;

/**
 * Initialisation sécurisée de l'application
 */
async function initializeApp() {
    // Protection contre la double initialisation
    if (isAppInitialized) {
        console.warn('⚠️ Application déjà initialisée, annulation');
        return;
    }
    
    isAppInitialized = true;
    console.log('🚀 DOM chargé, démarrage de l\'application...');
    
    // Timeout de sécurité
    const safetyTimeout = setTimeout(() => {
        console.log('⏰ Timeout de sécurité - Masquage forcé du chargement');
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('show');
            loading.style.display = 'none';
        }
    }, 10000);
    
    try {
        // Création et initialisation de l'application
        console.log('🔧 Création de l\'instance KinkApp...');
        kinkApp = new KinkPreferencesApp();
        
        console.log('⚡ Initialisation de l\'application...');
        await kinkApp.init();
        console.log('✅ Application initialisée avec succès !');
        
        // Annuler le timeout de sécurité
        clearTimeout(safetyTimeout);
        
        console.log('🎉 Tout est prêt ! Application utilisable.');
        
    } catch (error) {
        console.error('❌ Erreur fatale lors de l\'initialisation:', error);
        
        // Annuler le timeout et masquer le loading même en cas d'erreur
        clearTimeout(safetyTimeout);
        
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('show');
            loading.style.display = 'none';
        }
        
        // Afficher un message d'erreur à l'utilisateur
        showErrorMessage(error);
    }
}

/**
 * Affichage d'un message d'erreur à l'utilisateur
 * @param {Error} error - Erreur à afficher
 */
function showErrorMessage(error) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger text-center mt-5" role="alert">
                <h4 class="alert-heading"><i class="fas fa-exclamation-triangle"></i> Erreur de chargement</h4>
                <p class="mb-3">Une erreur est survenue lors du chargement de l'application.</p>
                <p class="mb-3"><strong>Détail :</strong> ${error.message}</p>
                <hr>
                <p class="mb-0">
                    <button class="btn btn-outline-danger" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> Recharger la page
                    </button>
                </p>
            </div>
        `;
    }
}

/**
 * Nettoyage de l'application avant fermeture
 */
function cleanupApp() {
    if (kinkApp) {
        kinkApp.cleanup();
        kinkApp = null;
    }
    isAppInitialized = false;
}

// Initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Nettoyage avant fermeture de la page
window.addEventListener('beforeunload', cleanupApp);

// Export pour accès global si nécessaire
window.getKinkApp = () => kinkApp;
