// État des préférences
let preferences = {};
        
// Gestion des clics sur les items
document.querySelectorAll('.item').forEach(item => {
    item.addEventListener('click', function() {
        const itemName = this.dataset.item;
        const currentState = preferences[itemName] || 'none';
        
        // Cycle through states: none -> adore -> love -> curious -> dislike -> no -> none
        let newState;
        switch(currentState) {
            case 'none':
                newState = 'adore';
                break;
            case 'adore':
                newState = 'love';
                break;
            case 'love':
                newState = 'curious';
                break;
            case 'curious':
                newState = 'dislike';
                break;
            case 'dislike':
                newState = 'no';
                break;
            case 'no':
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
        love: 0,
        curious: 0,
        dislike: 0,
        no: 0,
        none: 0
    };
    
    const totalItems = document.querySelectorAll('.item').length;
    
    Object.values(preferences).forEach(pref => {
        stats[pref]++;
    });
    
    stats.none = totalItems - stats.adore - stats.love - stats.curious - stats.dislike - stats.no;
    
    document.getElementById('adore-count').textContent = stats.adore;
    document.getElementById('love-count').textContent = stats.love;
    document.getElementById('curious-count').textContent = stats.curious;
    document.getElementById('dislike-count').textContent = stats.dislike;
    document.getElementById('no-count').textContent = stats.no;
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
            love: Object.values(preferences).filter(p => p === 'love').length,
            curious: Object.values(preferences).filter(p => p === 'curious').length,
            dislike: Object.values(preferences).filter(p => p === 'dislike').length,
            no: Object.values(preferences).filter(p => p === 'no').length
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