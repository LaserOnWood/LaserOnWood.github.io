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
    
    return `
        <div class="item" data-item="${escapeHtml(itemName)}" data-category="${categoryId}">
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


// Ajout au script.js existant - Système de statistiques améliorées

// Variables globales pour les graphiques
let currentChart = null;
let currentChartType = 'doughnut';

// Calcul des statistiques détaillées
function calculateDetailedStats() {
    if (!kinkData || !kinkData.categories || !kinkData.preferenceTypes) return null;
    
    // Compter le total d'items
    let totalItems = 0;
    kinkData.categories.forEach(category => {
        if (category.hasSubcategories && category.subcategories) {
            category.subcategories.forEach(subcat => {
                totalItems += subcat.items ? subcat.items.length : 0;
            });
        } else if (category.items) {
            totalItems += category.items.length;
        }
    });
    
    const selectedItems = Object.keys(preferences).length;
    
    // Statistiques par type de préférence
    const stats = {};
    kinkData.preferenceTypes.forEach(type => {
        stats[type.id] = {
            count: 0,
            percentage: 0,
            name: type.name,
            color: type.color
        };
    });
    
    // Compter les préférences
    Object.values(preferences).forEach(pref => {
        if (stats[pref]) {
            stats[pref].count++;
        }
    });
    
    // Calculer les pourcentages
    if (selectedItems > 0) {
        Object.keys(stats).forEach(key => {
            stats[key].percentage = ((stats[key].count / selectedItems) * 100).toFixed(1);
        });
    }
    
    // Statistiques par catégorie
    const categoryStats = {};
    kinkData.categories.forEach(category => {
        categoryStats[category.id] = {
            name: category.name,
            selected: 0,
            total: 0,
            percentage: 0
        };
        
        if (category.hasSubcategories && category.subcategories) {
            category.subcategories.forEach(subcat => {
                if (subcat.items) {
                    categoryStats[category.id].total += subcat.items.length;
                    subcat.items.forEach(item => {
                        const itemName = typeof item === 'string' ? item : item.name;
                        if (preferences[itemName]) {
                            categoryStats[category.id].selected++;
                        }
                    });
                }
            });
        } else if (category.items) {
            categoryStats[category.id].total = category.items.length;
            category.items.forEach(item => {
                const itemName = typeof item === 'string' ? item : item.name;
                if (preferences[itemName]) {
                    categoryStats[category.id].selected++;
                }
            });
        }
        
        if (categoryStats[category.id].total > 0) {
            categoryStats[category.id].percentage = 
                ((categoryStats[category.id].selected / categoryStats[category.id].total) * 100).toFixed(1);
        }
    });
    
    return {
        totalItems,
        selectedItems,
        completionPercentage: ((selectedItems / totalItems) * 100).toFixed(1),
        preferenceStats: stats,
        categoryStats
    };
}

// Mise à jour de la vue d'ensemble
function updateDetailedOverview() {
    const stats = calculateDetailedStats();
    if (!stats) return;
    
    // Mise à jour du cercle de progression
    const circle = document.getElementById('progress-circle');
    const percentageText = document.getElementById('total-percentage');
    
    if (circle && percentageText) {
        const percentage = parseFloat(stats.completionPercentage);
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (percentage / 100) * circumference;
        
        circle.style.strokeDashoffset = offset;
        percentageText.textContent = `${percentage}%`;
    }
    
    // Mise à jour des badges détaillés
    const badgesContainer = document.getElementById('overview-badges');
    if (badgesContainer) {
        badgesContainer.innerHTML = '';
        
        Object.entries(stats.preferenceStats).forEach(([key, stat]) => {
            if (stat.count > 0) {
                const badge = document.createElement('span');
                badge.className = 'stat-badge';
                badge.style.background = stat.color;
                badge.innerHTML = `${stat.name}: ${stat.count} (${stat.percentage}%)`;
                badgesContainer.appendChild(badge);
            }
        });
    }
}

// Création du graphique avec Chart.js
function createPreferencesChart(type = 'doughnut') {
    const canvas = document.getElementById('preferencesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const stats = calculateDetailedStats();
    if (!stats) return;
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    const labels = Object.values(stats.preferenceStats).map(s => s.name);
    const data = Object.values(stats.preferenceStats).map(s => s.count);
    const colors = Object.values(stats.preferenceStats).map(s => s.color);
    
    const config = {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: type === 'radar' ? 'bottom' : 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : '0';
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: type === 'bar' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            } : type === 'radar' ? {
                r: {
                    beginAtZero: true,
                    max: Math.max(...data) + 1
                }
            } : {}
        }
    };
    
    currentChart = new Chart(ctx, config);
}

// Basculer entre types de graphiques
function toggleChart(type) {
    currentChartType = type;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`btn-${type}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    createPreferencesChart(type);
}

// Mise à jour de l'analyse par catégorie
function updateCategoryAnalysis() {
    const container = document.getElementById('category-analysis');
    if (!container) return;
    
    const stats = calculateDetailedStats();
    if (!stats) return;
    
    container.innerHTML = '';
    
    Object.entries(stats.categoryStats).forEach(([categoryId, categoryData]) => {
        if (categoryData.selected > 0 || categoryData.total > 0) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-detail';
            
            categoryDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0">${categoryData.name}</h6>
                    <span class="badge bg-primary">${categoryData.selected}/${categoryData.total}</span>
                </div>
                <div class="percentage-bar">
                    <div class="percentage-fill" style="width: ${categoryData.percentage}%; background: linear-gradient(90deg, #4facfe, #00f2fe);"></div>
                </div>
                <small class="text-muted">${categoryData.percentage}% complété</small>
            `;
            
            container.appendChild(categoryDiv);
        }
    });
}

// Génération d'insights intelligents
function generateInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;
    
    const stats = calculateDetailedStats();
    if (!stats) return;
    
    const insights = [];
    
    // Analyser la préférence dominante
    const maxPref = Object.entries(stats.preferenceStats).reduce((max, [key, value]) => {
        return value.count > (stats.preferenceStats[max] ? stats.preferenceStats[max].count : 0) ? key : max;
    }, '');
    
    if (stats.preferenceStats[maxPref] && stats.preferenceStats[maxPref].count > 0) {
        insights.push(`🎯 Votre préférence dominante est "${stats.preferenceStats[maxPref].name}" avec ${stats.preferenceStats[maxPref].count} sélections (${stats.preferenceStats[maxPref].percentage}%).`);
    }
    
    // Analyser la curiosité
    const adventurous = stats.preferenceStats['curiosité'] ? stats.preferenceStats['curiosité'].count : 0;
    if (adventurous > 0) {
        insights.push(`🔍 Vous montrez de la curiosité pour ${adventurous} nouvelles expériences, signe d'un esprit ouvert !`);
    }
    
    // Analyser le taux de completion
    const completion = parseFloat(stats.completionPercentage);
    if (completion < 30) {
        insights.push(`📝 Vous avez complété ${completion}% de la liste. Il reste encore beaucoup à découvrir !`);
    } else if (completion > 70) {
        insights.push(`✅ Excellent ! Vous avez une vision claire de vos préférences avec ${completion}% de completion.`);
    } else {
        insights.push(`📊 Vous avez complété ${completion}% de la liste, vous êtes sur la bonne voie !`);
    }
    
    // Analyser la diversité des préférences
    const activePref = Object.values(stats.preferenceStats).filter(s => s.count && s.count > 0).length;
    if (activePref >= 4) {
        insights.push(`🌈 Vos goûts sont diversifiés avec des préférences dans ${activePref} catégories différentes.`);
    } else if (activePref <= 2) {
        insights.push(`🎯 Vos préférences sont concentrées sur ${activePref} type(s), vous savez ce que vous aimez !`);
    }
    
    // Analyser les limites strictes
    const strictLimits = stats.preferenceStats['non_strict'] ? stats.preferenceStats['non_strict'].count : 0;
    if (strictLimits > 0) {
        insights.push(`🚫 Vous avez défini ${strictLimits} limite(s) stricte(s), important pour établir vos boundaries.`);
    }
    
    // Analyser les dislikes
    const dislikes = stats.preferenceStats['dislike'] ? stats.preferenceStats['dislike'].count : 0;
    if (dislikes > 0) {
        insights.push(`❌ ${dislikes} pratique(s) ne vous intéresse(nt) pas, c'est tout à fait normal d'avoir des préférences !`);
    }
    
    // Catégorie la plus explorée
    const topCategory = Object.entries(stats.categoryStats).reduce((max, [key, value]) => {
        return value.selected > (stats.categoryStats[max] ? stats.categoryStats[max].selected : 0) ? key : max;
    }, '');
    
    if (stats.categoryStats[topCategory] && stats.categoryStats[topCategory].selected > 0) {
        insights.push(`⭐ Votre domaine de prédilection est "${stats.categoryStats[topCategory].name}" avec ${stats.categoryStats[topCategory].selected} préférences.`);
    }
    
    // Conseils personnalisés
    if (completion < 50 && adventurous > 0) {
        insights.push(`💡 Conseil : Votre curiosité pourrait vous aider à explorer d'autres catégories pour mieux vous connaître.`);
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="alert alert-info d-flex align-items-center mb-2">
            <div>${insight}</div>
        </div>
    `).join('');
}

// Création du HTML pour la section statistiques améliorées
function createEnhancedStatsHTML() {
    return `
        <!-- Statistiques Améliorées -->
        <div class="stat-card">
            <h4><i class="fas fa-chart-bar me-2"></i>Vue d'ensemble</h4>
            <div class="row">
                <div class="col-md-6">
                    <div class="d-flex justify-content-center position-relative">
                        <svg class="progress-ring" width="120" height="120">
                            <circle class="progress-ring-circle" stroke="#e9ecef" stroke-width="8" 
                                    fill="transparent" r="52" cx="60" cy="60"/>
                            <circle id="progress-circle" class="progress-ring-circle" stroke="#4facfe" 
                                    stroke-width="8" fill="transparent" r="52" cx="60" cy="60" 
                                    stroke-dasharray="327" stroke-dashoffset="327"/>
                        </svg>
                        <div class="position-absolute d-flex align-items-center justify-content-center h-100">
                            <div class="text-center">
                                <div class="h3 mb-0" id="total-percentage">0%</div>
                                <small class="text-muted">Complété</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="d-flex flex-wrap justify-content-center" id="overview-badges">
                        <!-- Badges générés dynamiquement -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Graphiques -->
        <div class="stat-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4><i class="fas fa-chart-pie me-2"></i>Répartition des Préférences</h4>
                <div>
                    <button class="toggle-btn active" onclick="toggleChart('doughnut')" id="btn-doughnut">
                        <i class="fas fa-chart-pie me-1"></i>Camembert
                    </button>
                    <button class="toggle-btn" onclick="toggleChart('bar')" id="btn-bar">
                        <i class="fas fa-chart-bar me-1"></i>Barres
                    </button>
                    <button class="toggle-btn" onclick="toggleChart('radar')" id="btn-radar">
                        <i class="fas fa-chart-line me-1"></i>Radar
                    </button>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="preferencesChart"></canvas>
            </div>
        </div>

        <!-- Analyse par catégorie -->
        <div class="stat-card">
            <h4><i class="fas fa-layer-group me-2"></i>Analyse par Catégorie</h4>
            <div id="category-analysis">
                <!-- Analyses par catégorie générées dynamiquement -->
            </div>
        </div>

        <!-- Tendances et insights -->
        <div class="stat-card">
            <h4><i class="fas fa-lightbulb me-2"></i>Insights & Tendances</h4>
            <div id="insights-container">
                <!-- Insights générés dynamiquement -->
            </div>
        </div>
    `;
}

// CSS supplémentaire à ajouter
function addEnhancedStatsCSS() {
    const cssId = 'enhanced-stats-css';
    if (!document.getElementById(cssId)) {
        const style = document.createElement('style');
        style.id = cssId;
        style.textContent = `
            .stat-card {
                background: white;
                border-radius: 15px;
                padding: 1.5rem;
                margin-bottom: 2rem;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                transition: transform 0.3s ease;
            }

            .stat-card:hover {
                transform: translateY(-2px);
            }

            .progress-ring {
                width: 120px;
                height: 120px;
            }

            .progress-ring-circle {
                transition: stroke-dashoffset 0.8s ease-in-out;
                transform: rotate(-90deg);
                transform-origin: 50% 50%;
            }

            .chart-container {
                position: relative;
                height: 300px;
                margin: 1rem 0;
            }

            .category-detail {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 1rem;
                margin: 0.5rem 0;
                border-left: 4px solid #4facfe;
                transition: all 0.3s ease;
            }

            .category-detail:hover {
                background: #e9ecef;
                transform: translateX(5px);
            }

            .percentage-bar {
                background: #e9ecef;
                border-radius: 10px;
                height: 20px;
                overflow: hidden;
                margin: 0.5rem 0;
            }

            .percentage-fill {
                height: 100%;
                border-radius: 10px;
                transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            .toggle-btn {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                border: none;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-weight: bold;
                margin: 0.25rem;
                transition: all 0.3s ease;
                font-size: 0.85rem;
            }

            .toggle-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(79, 172, 254, 0.3);
                color: white;
            }

            .toggle-btn.active {
                background: linear-gradient(135deg, #28a745, #20c997);
                box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            }

            .stat-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 25px;
                color: white;
                font-weight: bold;
                font-size: 0.85rem;
                margin: 0.25rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
            }

            .stat-badge:hover {
                transform: scale(1.05);
            }

            @media (max-width: 768px) {
                .chart-container {
                    height: 250px;
                }
                
                .toggle-btn {
                    font-size: 0.75rem;
                    padding: 0.4rem 0.8rem;
                }
                
                .stat-badge {
                    font-size: 0.75rem;
                    padding: 0.4rem 0.8rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Fonction principale pour initialiser les statistiques améliorées
function initEnhancedStats() {
    // Ajouter le CSS
    addEnhancedStatsCSS();
    
    // Remplacer la section stats existante
    const existingStats = document.querySelector('.stats');
    if (existingStats) {
        existingStats.innerHTML = `
            <h5 class="mb-3 text-center"><i class="fas fa-chart-bar"></i> Statistiques Détaillées</h5>
            ${createEnhancedStatsHTML()}
        `;
    }
    
    // Initialiser les composants
    updateDetailedOverview();
    createPreferencesChart();
    updateCategoryAnalysis();
    generateInsights();
}

// Mise à jour des statistiques améliorées (à appeler après chaque changement)
function updateEnhancedStats() {
    updateDetailedOverview();
    if (currentChart) {
        createPreferencesChart(currentChartType);
    }
    updateCategoryAnalysis();
    generateInsights();
}

// Modifier la fonction updateStats existante
const originalUpdateStats = updateStats;
updateStats = function() {
    // Appeler la fonction originale pour maintenir la compatibilité
    if (typeof originalUpdateStats === 'function') {
        originalUpdateStats();
    }
    
    // Ajouter les statistiques améliorées
    updateEnhancedStats();
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que Chart.js soit chargé
    if (typeof Chart !== 'undefined') {
        initEnhancedStats();
    } else {
        // Charger Chart.js si pas encore chargé
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.min.js';
        script.onload = function() {
            initEnhancedStats();
        };
        document.head.appendChild(script);
    }
});


// Fonctionnalité de basculement entre vue simple et vue détaillée

let isDetailedView = false;
let originalStatsHTML = '';

// Fonction pour basculer entre les vues
function toggleStatsView() {
    const statsContainer = document.querySelector('.stats');
    const toggleBtn = document.getElementById('toggle-stats-btn');
    
    if (!statsContainer || !toggleBtn) return;
    
    if (!isDetailedView) {
        // Sauvegarder la vue simple
        if (!originalStatsHTML) {
            originalStatsHTML = statsContainer.innerHTML;
        }
        
        // Passer en vue détaillée
        statsContainer.innerHTML = `
            <h5 class="mb-3 text-center">
                <i class="fas fa-chart-bar"></i> Statistiques Détaillées
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="exportStats()">
                    <i class="fas fa-download"></i> Exporter Stats
                </button>
            </h5>
            ${createEnhancedStatsHTML()}
        `;
        
        // Initialiser les composants détaillés
        updateDetailedOverview();
        createPreferencesChart();
        updateCategoryAnalysis();
        generateInsights();
        
        toggleBtn.innerHTML = '<i class="fas fa-chart-bar me-2"></i>Vue Simple';
        toggleBtn.classList.remove('btn-outline-primary');
        toggleBtn.classList.add('btn-outline-success');
        isDetailedView = true;
        
    } else {
        // Revenir à la vue simple
        statsContainer.innerHTML = originalStatsHTML;
        
        // Régénérer les badges simples
        generateStatsSection();
        updateStats();
        
        toggleBtn.innerHTML = '<i class="fas fa-chart-line me-2"></i>Vue Détaillée';
        toggleBtn.classList.remove('btn-outline-success');
        toggleBtn.classList.add('btn-outline-primary');
        isDetailedView = false;
    }
}

// Fonction pour exporter les statistiques en image
function exportStats() {
    if (!currentChart) return;
    
    try {
        // Créer un canvas temporaire avec les statistiques
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Arrière-plan blanc
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Titre
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Mes Statistiques de Préférences', canvas.width / 2, 40);
        
        // Date
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666666';
        const today = new Date().toLocaleDateString('fr-FR');
        ctx.fillText(`Généré le ${today}`, canvas.width / 2, 65);
        
        // Copier le graphique
        const chartCanvas = document.getElementById('preferencesChart');
        if (chartCanvas) {
            ctx.drawImage(chartCanvas, 50, 100, 700, 400);
        }
        
        // Ajouter les statistiques textuelles
        const stats = calculateDetailedStats();
        if (stats) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'left';
            
            let y = 520;
            ctx.fillText(`Total d'éléments sélectionnés: ${stats.selectedItems}/${stats.totalItems}`, 50, y);
            y += 25;
            ctx.fillText(`Pourcentage de completion: ${stats.completionPercentage}%`, 50, y);
        }
        
        // Télécharger l'image
        const link = document.createElement('a');
        link.download = `statistiques_preferences_${today.replace(/\//g, '-')}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        showToast('Statistiques exportées avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        showToast('Erreur lors de l\'export des statistiques', 'danger');
    }
}

// Fonction pour générer un rapport PDF (optionnel, nécessite une bibliothèque comme jsPDF)
function generatePDFReport() {
    // Cette fonction nécessiterait l'ajout de jsPDF
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    
    showToast('Fonctionnalité PDF en développement', 'info');
}

// Fonction pour comparer deux profils (fonctionnalité avancée)
function compareProfiles() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const otherProfile = JSON.parse(e.target.result);
                showProfileComparison(preferences, otherProfile.preferences);
            } catch (error) {
                showToast('Fichier invalide pour la comparaison', 'danger');
            }
        };
        reader.readAsText(file);
    };
    
    fileInput.click();
}

// Affichage de la comparaison de profils
function showProfileComparison(profile1, profile2) {
    if (!profile1 || !profile2) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Comparaison de Profils</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="comparison-content">
                        <!-- Contenu de comparaison généré dynamiquement -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Calculer les similitudes
    const commonPrefs = Object.keys(profile1).filter(key => 
        profile2[key] && profile1[key] === profile2[key]
    );
    
    const similarities = ((commonPrefs.length / Math.max(Object.keys(profile1).length, Object.keys(profile2).length)) * 100).toFixed(1);
    
    document.getElementById('comparison-content').innerHTML = `
        <div class="alert alert-info text-center">
            <h4>${similarities}% de compatibilité</h4>
            <p>${commonPrefs.length} préférences communes trouvées</p>
        </div>
        <div class="row">
            <div class="col-md-6">
                <h6>Préférences communes:</h6>
                <ul class="list-group">
                    ${commonPrefs.slice(0, 10).map(pref => 
                        `<li class="list-group-item">${pref}</li>`
                    ).join('')}
                </ul>
            </div>
            <div class="col-md-6">
                <h6>Différences principales:</h6>
                <ul class="list-group">
                    ${Object.keys(profile1).filter(key => 
                        !profile2[key] || profile1[key] !== profile2[key]
                    ).slice(0, 10).map(pref => 
                        `<li class="list-group-item text-muted">${pref}</li>`
                    ).join('')}
                </ul>
            </div>
        </div>
    `;
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    // Nettoyer après fermeture
    modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
    });
}

// Mise à jour automatique de la vue active
const originalHandleItemClick = handleItemClick;
handleItemClick = function(item) {
    originalHandleItemClick(item);
    
    // Mettre à jour la vue détaillée si elle est active
    if (isDetailedView) {
        setTimeout(() => {
            updateEnhancedStats();
        }, 100);
    }
};