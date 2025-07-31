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
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}