// État des préférences
let preferences = {};
        
// Gestion des clics sur les items
document.querySelectorAll('.item').forEach(item => {
    item.addEventListener('click', function() {
        const itemName = this.dataset.item;
        const currentState = preferences[itemName] || 'none';
        
        // Cycle through states: none -> adore -> aime -> curieux -> peu interesse -> non strict -> none
        let newState;
        switch(currentState) {
            case 'none':
                newState = 'adore';
                break;
            case 'adore':
                newState = 'aime';
                break;
            case 'aime':
                newState = 'curiosité';
                break;
            case 'curiosité':
                newState = 'dislike';
                break;
            case 'dislike':
                newState = 'non_strict';
                break;
            case 'non_strict':
                newState = 'none';
                break;
        }
        
        // Mettre à jour l'état
        preferences[itemName] = newState;
        
        // Mettre à jour l'apparence
        this.className = 'item';
        if (newState !== 'none') {
            this.classList.add(newState);
        }
        
        // Mettre à jour les statistiques
        updateStats();
        updateCategoryCounters();
    });
});

// Mise à jour des statistiques globales
function updateStats() {
    const stats = {
        adore: 0,
        aime: 0,
        curiosité: 0,
        dislike: 0,
        non_strict: 0,
        none: 0
    };
    
    const totalItems = document.querySelectorAll('.item').length;
    
    Object.values(preferences).forEach(pref => {
        stats[pref]++;
    });
    
    stats.none = totalItems - stats.adore - stats.aime - stats.curiosité - stats.dislike - stats.non_strict;
    
    document.getElementById('adore-count').textContent = stats.adore;
    document.getElementById('aime-count').textContent = stats.aime;
    document.getElementById('curiosité-count').textContent = stats.curiosité;
    document.getElementById('dislike-count').textContent = stats.dislike;
    document.getElementById('non_strict-count').textContent = stats.non_strict;
    document.getElementById('unselected-count').textContent = stats.none;
}

// Mise à jour des compteurs par catégorie
function updateCategoryCounters() {
    const categories = ['aspectPhysique', 'habitTenue', 'jouets', 'bondage', 'douleur', 'cnc'];
    
    categories.forEach(category => {
        const items = document.querySelectorAll(`[data-category="${category}"]`);
        const totalItems = items.length;
        let selectedItems = 0;
        
        items.forEach(item => {
            const itemName = item.dataset.item;
            if (preferences[itemName] && preferences[itemName] !== 'none') {
                selectedItems++;
            }
        });
        
        const counter = document.getElementById(`counter-${category}`);
        if (counter) {
            counter.textContent = `${selectedItems}/${totalItems}`;
        }
    });
}

// Import des résultats
function importResults(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Vérifier que le fichier contient bien des préférences
            if (!data.preferences) {
                showToast('Fichier invalide : aucune préférence trouvée', 'danger');
                return;
            }
            
            // Réinitialiser toutes les préférences
            resetAllPreferences();
            
            // Importer les nouvelles préférences
            preferences = { ...data.preferences };
            
            // Mettre à jour l'interface
            updateAllItems();
            updateStats();
            updateCategoryCounters();
            
            showToast(`Préférences importées avec succès ! (${Object.keys(preferences).length} éléments)`, 'success');
            
        } catch (error) {
            showToast('Erreur lors de la lecture du fichier', 'danger');
            console.error('Erreur import:', error);
        }
    };
    
    reader.readAsText(file);
    
    // Réinitialiser l'input pour permettre de réimporter le même fichier
    input.value = '';
}

// Réinitialiser toutes les préférences visuellement
function resetAllPreferences() {
    document.querySelectorAll('.item').forEach(item => {
        item.className = 'item';
    });
    preferences = {};
}

// Mettre à jour tous les items selon les préférences importées
function updateAllItems() {
    document.querySelectorAll('.item').forEach(item => {
        const itemName = item.dataset.item;
        if (itemName && preferences[itemName] && preferences[itemName] !== 'none') {
            item.classList.add(preferences[itemName]);
        }
    });
}

// Fonction utilitaire pour afficher les messages
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';
    toast.innerHTML = `<i class="fas fa-${icon} me-2"></i>${message}`;
    
    document.body.appendChild(toast);
    
    // Auto-suppression après 3 secondes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Export des résultats
function exportResults() {
    const selectedPreferences = Object.entries(preferences).filter(([key, value]) => value !== 'none');
    
    if (selectedPreferences.length === 0) {
        showToast('Aucune préférence sélectionnée à exporter', 'warning');
        return;
    }
    
    const exportData = {
        timestamp: new Date().toISOString(),
        totalSelected: selectedPreferences.length,
        preferences: preferences,
        summary: {
            adore: Object.values(preferences).filter(v => v === 'adore').length,
            aime: Object.values(preferences).filter(v => v === 'aime').length,
            curiosité: Object.values(preferences).filter(v => v === 'curiosité').length,
            dislike: Object.values(preferences).filter(v => v === 'dislike').length,
            non_strict: Object.values(preferences).filter(v => v === 'non_strict').length
        }
    };
    
    // Créer et télécharger le fichier
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `preferences_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast(`${selectedPreferences.length} préférences exportées avec succès !`, 'success');
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    updateCategoryCounters();
});