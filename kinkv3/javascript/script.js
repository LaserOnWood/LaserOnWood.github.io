// État des préférences
let preferences = {};
let kinkData = null;

// Chargement des données depuis le fichier JSON
async function loadKinkData() {
    try {
        const response = await fetch('json/kink-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        kinkData = await response.json();
        console.log('Données chargées:', kinkData);
        
        // Générer l'interface une fois les données chargées
        generateInterface();
        initializeEventListeners();
        updateStats();
        updateCategoryCounters();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showToast('Erreur lors du chargement des données', 'danger');
    }
}

// Génération dynamique de l'interface
function generateInterface() {
    if (!kinkData) return;
    
    generateStatsSection();
    generateCategoriesAccordion();
    // Initialiser les tooltips après génération du contenu
    setTimeout(() => {
        initializeTooltips();
    }, 100);
}

// Génération de la section statistiques
function generateStatsSection() {
    const statsContainer = document.querySelector('.stats-badges');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = '';
    
    kinkData.preferenceTypes.forEach(type => {
        const badge = document.createElement('div');
        badge.className = 'stat-badge';
        badge.style.background = type.color;
        badge.innerHTML = `
            <span>${type.name}</span>
            <span class="count" id="${type.id}-count">0</span>
        `;
        statsContainer.appendChild(badge);
    });
    
    // Badge "Non sélectionné"
    const unselectedBadge = document.createElement('div');
    unselectedBadge.className = 'stat-badge';
    unselectedBadge.style.background = 'linear-gradient(135deg, #6c757d, #5a6268)';
    unselectedBadge.innerHTML = `
        <span>Non sélectionné</span>
        <span class="count" id="unselected-count">0</span>
    `;
    statsContainer.appendChild(unselectedBadge);
}

// Génération de l'accordéon des catégories
function generateCategoriesAccordion() {
    const accordion = document.getElementById('categoriesAccordion');
    if (!accordion) return;
    
    accordion.innerHTML = '';
    
    kinkData.categories.forEach(category => {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        
        // Header avec tooltip pour la description de la catégorie
        const tooltipAttr = category.description ? `data-bs-toggle="tooltip" data-bs-placement="right" data-bs-title="${escapeHtml(category.description)}"` : '';
        
        const header = `
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#${category.id}" 
                        aria-expanded="false" ${tooltipAttr}>
                    <i class="${category.icon} me-2"></i>
                    <span>${category.name}</span>
                    <span class="category-counter" id="counter-${category.id}"></span>
                </button>
            </h2>
        `;
        
        // Contenu
        let bodyContent = '';
        
        if (category.hasSubcategories && category.subcategories) {
            // Catégorie avec sous-catégories (Pet Play)
            bodyContent = `
                <div class="accordion-body">
                    ${category.description ? `
                        <div class="alert alert-info text-center" role="alert">
                            ${category.description}
                        </div>
                    ` : ''}
                    <div class="accordion" id="accordion${category.id}">
                        ${category.subcategories.map(subcat => generateSubcategoryHTML(subcat, category.id)).join('')}
                    </div>
                </div>
            `;
        } else if (category.items) {
            // Catégorie normale
            bodyContent = `
                <div class="accordion-body">
                    ${category.description ? `
                        <div class="alert alert-info text-center" role="alert">
                            <i class="fas fa-info-circle me-2"></i>${category.description}
                        </div>
                    ` : ''}
                    <div class="items-grid">
                        ${category.items.map(item => generateItemHTML(item, category.id)).join('')}
                    </div>
                </div>
            `;
        }
        
        accordionItem.innerHTML = `
            ${header}
            <div id="${category.id}" class="accordion-collapse collapse" 
                 data-bs-parent="#categoriesAccordion">
                ${bodyContent}
            </div>
        `;
        
        accordion.appendChild(accordionItem);
    });
}

// Génération HTML pour les sous-catégories
function generateSubcategoryHTML(subcat, parentId) {
    if (!subcat || !subcat.items) return '';
    
    return `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#${subcat.id}" 
                        aria-expanded="false">
                    <i class="${subcat.icon} me-2"></i>
                    <span>${subcat.name}</span>
                    <span class="category-counter" id="counter-${subcat.id}"></span>
                </button>
            </h2>
            <div id="${subcat.id}" class="accordion-collapse collapse" 
                 data-bs-parent="#accordion${parentId}">
                <div class="accordion-body">
                    <div class="items-grid">
                        ${subcat.items.map(item => generateItemHTML(item, subcat.id)).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Génération HTML pour un item avec description
function generateItemHTML(item, categoryId) {
    if (!item) return '';
    
    // Support des objets avec description et des chaînes simples
    const itemName = typeof item === 'string' ? item : item.name;
    const itemDescription = typeof item === 'object' && item.description ? item.description : '';
    
    if (!itemName) return '';
    
    // Tooltip avec la description - échapper les guillemets
    const tooltipAttr = itemDescription ? `data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="${escapeHtml(itemDescription)}"` : '';
    
    return `
        <div class="item" data-item="${escapeHtml(itemName)}" data-category="${categoryId}" ${tooltipAttr}>
            <div class="item-name">${escapeHtml(itemName)}</div>
            ${itemDescription ? `<div class="item-description">${escapeHtml(itemDescription)}</div>` : ''}
        </div>
    `;
}

// Fonction utilitaire pour échapper le HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialisation des tooltips Bootstrap avec gestion d'erreur
function initializeTooltips() {
    try {
        // Détruire les tooltips existants
        const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        existingTooltips.forEach(el => {
            const tooltip = bootstrap.Tooltip.getInstance(el);
            if (tooltip) {
                tooltip.dispose();
            }
        });
        
        // Créer les nouveaux tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                boundary: 'viewport',
                fallbackPlacements: ['top', 'bottom', 'left', 'right']
            });
        });
    } catch (error) {
        console.warn('Erreur lors de l\'initialisation des tooltips:', error);
    }
}

// Initialisation des event listeners
function initializeEventListeners() {
    // Utiliser la délégation d'événements pour gérer les clics
    document.removeEventListener('click', handleDocumentClick);
    document.addEventListener('click', handleDocumentClick);
}

// Gestionnaire global de clics
function handleDocumentClick(e) {
    const item = e.target.closest('.item');
    if (item) {
        handleItemClick(item);
    }
}

// Gestion du clic sur un item
function handleItemClick(item) {
    const itemName = item.dataset.item;
    if (!itemName) return;
    
    const currentState = preferences[itemName] || 'none';
    
    // Cycle through states: none -> adore -> aime -> curieux -> peu interesse -> non strict -> none
    const states = ['none', 'adore', 'aime', 'curiosité', 'dislike', 'non_strict'];
    const currentIndex = states.indexOf(currentState);
    const newState = states[(currentIndex + 1) % states.length];
    
    // Mettre à jour l'état
    if (newState === 'none') {
        delete preferences[itemName];
    } else {
        preferences[itemName] = newState;
    }
    
    // Mettre à jour l'apparence - nettoyer d'abord toutes les classes d'état
    const stateClasses = ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'];
    stateClasses.forEach(cls => item.classList.remove(cls));
    
    if (newState !== 'none') {
        item.classList.add(newState);
    }
    
    // Mettre à jour les statistiques
    updateStats();
    updateCategoryCounters();
}

// Mise à jour des statistiques globales
function updateStats() {
    if (!kinkData || !kinkData.preferenceTypes) return;
    
    const stats = {};
    
    // Initialiser les compteurs
    kinkData.preferenceTypes.forEach(type => {
        stats[type.id] = 0;
    });
    stats.none = 0;
    
    // Compter le total d'items
    const totalItems = document.querySelectorAll('.item').length;
    
    // Compter les préférences
    Object.values(preferences).forEach(pref => {
        if (stats.hasOwnProperty(pref)) {
            stats[pref]++;
        }
    });
    
    // Calculer les non sélectionnés
    const selectedCount = Object.values(stats).reduce((sum, count) => sum + count, 0) - stats.none;
    stats.none = totalItems - selectedCount;
    
    // Mettre à jour l'interface
    kinkData.preferenceTypes.forEach(type => {
        const element = document.getElementById(`${type.id}-count`);
        if (element) {
            element.textContent = stats[type.id] || 0;
        }
    });
    
    const unselectedElement = document.getElementById('unselected-count');
    if (unselectedElement) {
        unselectedElement.textContent = stats.none || 0;
    }
}

// Mise à jour des compteurs par catégorie
function updateCategoryCounters() {
    if (!kinkData || !kinkData.categories) return;
    
    kinkData.categories.forEach(category => {
        if (category.hasSubcategories && category.subcategories) {
            // Traitement spécial pour les catégories avec sous-catégories
            let totalItems = 0;
            let selectedItems = 0;
            
            category.subcategories.forEach(subcat => {
                const items = document.querySelectorAll(`[data-category="${subcat.id}"]`);
                totalItems += items.length;
                
                let subcatSelected = 0;
                items.forEach(item => {
                    const itemName = item.dataset.item;
                    if (preferences[itemName] && preferences[itemName] !== 'none') {
                        selectedItems++;
                        subcatSelected++;
                    }
                });
                
                // Mettre à jour le compteur de la sous-catégorie
                const subcatCounter = document.getElementById(`counter-${subcat.id}`);
                if (subcatCounter) {
                    subcatCounter.textContent = `${subcatSelected}/${items.length}`;
                }
            });
            
            // Mettre à jour le compteur principal
            const counter = document.getElementById(`counter-${category.id}`);
            if (counter) {
                counter.textContent = `${selectedItems}/${totalItems}`;
            }
        } else {
            // Traitement normal
            const items = document.querySelectorAll(`[data-category="${category.id}"]`);
            const totalItems = items.length;
            let selectedItems = 0;
            
            items.forEach(item => {
                const itemName = item.dataset.item;
                if (preferences[itemName] && preferences[itemName] !== 'none') {
                    selectedItems++;
                }
            });
            
            const counter = document.getElementById(`counter-${category.id}`);
            if (counter) {
                counter.textContent = `${selectedItems}/${totalItems}`;
            }
        }
    });
}

// Import des résultats avec validation améliorée
function importResults(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showToast('Veuillez sélectionner un fichier JSON valide', 'danger');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data || typeof data !== 'object') {
                showToast('Fichier JSON invalide', 'danger');
                return;
            }
            
            if (!data.preferences || typeof data.preferences !== 'object') {
                showToast('Fichier invalide : aucune préférence trouvée', 'danger');
                return;
            }
            
            // Valider les préférences
            const validStates = ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'];
            const validPreferences = {};
            
            Object.entries(data.preferences).forEach(([key, value]) => {
                if (typeof key === 'string' && validStates.includes(value)) {
                    validPreferences[key] = value;
                }
            });
            
            resetAllPreferences();
            preferences = validPreferences;
            updateAllItems();
            updateStats();
            updateCategoryCounters();
            
            const importedCount = Object.keys(validPreferences).length;
            showToast(`Préférences importées avec succès ! (${importedCount} éléments)`, 'success');
            
        } catch (error) {
            showToast('Erreur lors de la lecture du fichier JSON', 'danger');
            console.error('Erreur import:', error);
        }
    };
    
    reader.onerror = function() {
        showToast('Erreur lors de la lecture du fichier', 'danger');
    };
    
    reader.readAsText(file);
    input.value = '';
}

// Réinitialiser toutes les préférences
function resetAllPreferences() {
    document.querySelectorAll('.item').forEach(item => {
        const stateClasses = ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'];
        stateClasses.forEach(cls => item.classList.remove(cls));
    });
    preferences = {};
}

// Mettre à jour tous les items selon les préférences importées
function updateAllItems() {
    document.querySelectorAll('.item').forEach(item => {
        const itemName = item.dataset.item;
        if (itemName && preferences[itemName] && preferences[itemName] !== 'none') {
            // Nettoyer d'abord les anciennes classes
            const stateClasses = ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'];
            stateClasses.forEach(cls => item.classList.remove(cls));
            // Ajouter la nouvelle classe
            item.classList.add(preferences[itemName]);
        }
    });
}

// Fonction utilitaire pour afficher les messages avec gestion d'erreur
function showToast(message, type = 'success') {
    try {
        // Supprimer les anciens toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
        
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed toast-notification`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px; animation: slideIn 0.3s ease;';
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 
                    'exclamation-circle';
        toast.innerHTML = `<i class="fas fa-${icon} me-2"></i>${escapeHtml(message)}`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 3000);
    } catch (error) {
        console.error('Erreur lors de l\'affichage du toast:', error);
        // Fallback avec alert
        alert(message);
    }
}

// Export des résultats avec validation
function exportResults() {
    try {
        const selectedPreferences = Object.entries(preferences).filter(([key, value]) => value !== 'none');
        
        if (selectedPreferences.length === 0) {
            showToast('Aucune préférence sélectionnée à exporter', 'warning');
            return;
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            totalSelected: selectedPreferences.length,
            preferences: preferences,
            summary: {}
        };
        
        // Calculer le résumé
        if (kinkData && kinkData.preferenceTypes) {
            kinkData.preferenceTypes.forEach(type => {
                exportData.summary[type.id] = Object.values(preferences).filter(v => v === type.id).length;
            });
        }
        
        // Créer et télécharger le fichier
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        const date = new Date().toISOString().split('T')[0];
        link.download = `Mes_preferences_${date}.json`;
        
        // Ajouter temporairement au DOM pour le téléchargement
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Nettoyer l'URL
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
        }, 100);
        
        showToast(`${selectedPreferences.length} préférences exportées avec succès !`, 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        showToast('Erreur lors de l\'export des préférences', 'danger');
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter les styles d'animation pour les toasts
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    loadKinkData();
});