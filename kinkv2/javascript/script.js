// État des préférences
let preferences = {};

// Fonction pour mettre à jour les badges des catégories
function updateCategoryBadges() {
    const categories = ['aspect-physique', 'jouets', 'bondage', 'douleur', 'cnc'];
    
    categories.forEach(category => {
        const items = document.querySelectorAll(`[data-category="${category}"]`);
        const selectedItems = Array.from(items).filter(item => {
            const itemName = item.dataset.item;
            return preferences[itemName] && preferences[itemName] !== 'none';
        });
        
        const badge = document.getElementById(`badge-${category}`);
        if (badge) {
            badge.textContent = `${selectedItems.length}/${items.length}`;
        }
    });
}

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
    });
});

// Mise à jour des statistiques
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

// Export des résultats
function exportResults() {
    const results = {
        date: new Date().toLocaleDateString('fr-FR'),
        preferences: preferences,
        summary: {
            total: Object.keys(preferences).length,
            adore: Object.values(preferences).filter(p => p === 'adore').length,
            aime: Object.values(preferences).filter(p => p === 'aime').length,
            curiosité: Object.values(preferences).filter(p => p === 'curiosité').length,
            dislike: Object.values(preferences).filter(p => p === 'dislike').length,
            non_strict: Object.values(preferences).filter(p => p === 'non_strict').length,
            unselected: Object.values(preferences).filter(p => p === 'unselected').length
        }
    };
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Ma_KinkList_' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    // Afficher un message de confirmation
    const toast = document.createElement('div');
    toast.className = 'alert alert-success position-fixed';
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
    toast.innerHTML = '<i class="fas fa-check-circle"></i> Préférences exportées avec succès !';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialiser les statistiques
updateStats();