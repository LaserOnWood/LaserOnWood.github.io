// État des préférences
let preferences = {};
let kinkData = null;

// Chargement des données depuis le fichier JSON
async function loadKinkData() {
    try {
        const response = await fetch('json/kink-data.json');
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
    
    // Générer les badges de statistiques
    generateStatsSection();
    
    // Générer l'accordéon des catégories
    generateCategoriesAccordion();
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
    
    // Ajouter le badge "Non sélectionné"
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
        
        // Générer le header
        const header = `
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#${category.id}" 
                        aria-expanded="false">
                    <i class="${category.icon} me-2"></i>
                    <span>${category.name}</span>
                    <span class="category-counter" id="counter-${category.id}"></span>
                </button>
            </h2>
        `;
        
        // Générer le contenu
        let bodyContent = '';
        
        if (category.hasSubcategories) {
            // Catégorie avec sous-catégories (Pet Play)
            bodyContent = `
                <div class="accordion-body">
                    ${category.description ? `
                        <div class="alert alert-warning text-center" role="alert">
                            ${category.description}
                        </div>
                    ` : ''}
                    <div class="accordion" id="accordion${category.id}">
                        ${category.subcategories.map(subcat => `
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
                                     data-bs-parent="#accordion${category.id}">
                                    <div class="accordion-body">
                                        <div class="items-grid">
                                            ${subcat.items.map(item => `
                                                <div class="item" data-item="${item}" data-category="${subcat.id}">
                                                    ${item}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            // Catégorie normale
            bodyContent = `
                <div class="accordion-body">
                    <div class="items-grid">
                        ${category.items.map(item => `
                            <div class="item" data-item="${item}" data-category="${category.id}">
                                ${item}
                            </div>
                        `).join('')}
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

// Initialisation des event listeners
function initializeEventListeners() {
    // Gestion des clics sur les items (utilise la délégation d'événement)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('item')) {
            handleItemClick(e.target);
        }
    });
}

// Gestion du clic sur un item
function handleItemClick(item) {
    const itemName = item.dataset.item;
    const currentState = preferences[itemName] || 'none';
    
    // Cycle à travers les états
    const states = ['none', 'adore', 'aime', 'curiosité', 'dislike', 'non_strict'];
    const currentIndex = states.indexOf(currentState);
    const newState = states[(currentIndex + 1) % states.length];
    
    // Mettre à jour l'état
    preferences[itemName] = newState;
    
    // Mettre à jour l'apparence
    item.className = 'item';
    if (newState !== 'none') {
        item.classList.add(newState);
    }
    
    // Mettre à jour les statistiques
    updateStats();
    updateCategoryCounters();
}

// Mise à jour des statistiques globales
function updateStats() {
    if (!kinkData) return;
    
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
        if (stats[pref] !== undefined) {
            stats[pref]++;
        }
    });
    
    // Calculer les non sélectionnés
    const selectedCount = Object.values(stats).reduce((sum, count) => sum + count, 0);
    stats.none = totalItems - selectedCount;
    
    // Mettre à jour l'interface
    kinkData.preferenceTypes.forEach(type => {
        const element = document.getElementById(`${type.id}-count`);
        if (element) {
            element.textContent = stats[type.id];
        }
    });
    
    const unselectedElement = document.getElementById('unselected-count');
    if (unselectedElement) {
        unselectedElement.textContent = stats.none;
    }
}

// Mise à jour des compteurs par catégorie
function updateCategoryCounters() {
    if (!kinkData) return;
    
    kinkData.categories.forEach(category => {
        if (category.hasSubcategories) {
            // Traitement spécial pour les catégories avec sous-catégories
            let totalItems = 0;
            let selectedItems = 0;
            
            category.subcategories.forEach(subcat => {
                const items = document.querySelectorAll(`[data-category="${subcat.id}"]`);
                totalItems += items.length;
                
                items.forEach(item => {
                    const itemName = item.dataset.item;
                    if (preferences[itemName] && preferences[itemName] !== 'none') {
                        selectedItems++;
                    }
                });
                
                // Mettre à jour le compteur de la sous-catégorie
                const subcatCounter = document.getElementById(`counter-${subcat.id}`);
                if (subcatCounter) {
                    const subcatSelected = Array.from(items).filter(item => {
                        const itemName = item.dataset.item;
                        return preferences[itemName] && preferences[itemName] !== 'none';
                    }).length;
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
        summary: {}
    };
    
    // Calculer le résumé basé sur les types de préférences définis
    if (kinkData) {
        kinkData.preferenceTypes.forEach(type => {
            exportData.summary[type.id] = Object.values(preferences).filter(v => v === type.id).length;
        });
    }
    
    // Créer et télécharger le fichier
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `Mes_preferences_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast(`${selectedPreferences.length} préférences exportées avec succès !`, 'success');
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    loadKinkData();
});