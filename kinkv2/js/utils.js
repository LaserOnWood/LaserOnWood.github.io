/**
 * Module utilitaires pour l'application de gestion des préférences Kink
 */

/**
 * Utilitaire pour échapper le HTML
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Génération d'une chaîne de date au format YYYY-MM-DD
 * @returns {string} Date formatée
 */
export function getDateString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Lecture d'un fichier comme JSON
 * @param {File} file - Fichier à lire
 * @returns {Promise<Object>} Données JSON parsées
 */
export function readFileAsJson(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('Fichier JSON invalide'));
            }
        };

        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
        reader.readAsText(file);
    });
}

/**
 * Téléchargement sécurisé d'un fichier JSON
 * @param {Object} data - Données à télécharger
 * @param {string} filename - Nom du fichier
 */
export function downloadJsonFile(data, filename) {
    console.log('💾 Début du téléchargement:', filename);

    try {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Création du lien de téléchargement
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        
        // Style invisible
        link.style.position = 'absolute';
        link.style.left = '-9999px';
        
        // Ajout temporaire au DOM
        document.body.appendChild(link);

        // Déclenchement du téléchargement
        link.click();

        // Nettoyage immédiat et sécurisé
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
            URL.revokeObjectURL(link.href);
        }, 100);

        console.log('✅ Téléchargement déclenché avec succès');

    } catch (error) {
        console.error('❌ Erreur lors du téléchargement:', error);
        throw error;
    }
}

/**
 * Debounce function pour limiter les appels de fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} delay - Délai en millisecondes
 * @returns {Function} Fonction debouncée
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

