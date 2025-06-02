let cardData = null;
let currentCards = [];
let allFlipped = false;

// Chargement des données depuis le fichier JSON
async function loadCardData() {
    try {
        console.log('Chargement du fichier cartes.json...');
        const response = await fetch('json/cartes.json');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        cardData = await response.json();
        console.log('Données chargées avec succès:', cardData);
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        
        // Fallback: utiliser des données de démonstration
        console.log('Utilisation des données de démonstration...');
        cardData = {
            defis: {
                category: "Défis",
                icon: "🎯",
                cards: [
                    {
                        title: "Défi par Défaut",
                        content: "Rechargez la page pour essayer de charger cartes.json"
                    }
                ]
            },
            fois: {
                category: "Fois",
                icon: "💭",
                cards: [
                    {
                        title: "Question par Défaut",
                        content: "Placez le fichier cartes.json dans le même dossier que cette page"
                    }
                ]
            },
            bonus: {
                category: "Bonus",
                icon: "🎁",
                cards: [
                    {
                        title: "Bonus par Défaut",
                        content: "Vérifiez que le serveur peut servir les fichiers JSON"
                    }
                ]
            }
        };
        return false;
    }
}

// Initialisation de l'application
async function initApp() {
    console.log('Initialisation de l\'app...');
    
    // Charger les données JSON
    const success = await loadCardData();
    
    if (success) {
        console.log('✅ Données JSON chargées depuis cartes.json');
    } else {
        console.log('⚠️ Utilisation des données de fallback');
    }
    
    // Charger et afficher les cartes
    loadCards();
}

// Charger les cartes
function loadCards() {
    if (!cardData) {
        console.error('Aucune donnée de carte disponible');
        return;
    }

    const categories = ['defis', 'fois', 'bonus'];
    currentCards = [];

    categories.forEach(categoryKey => {
        const categoryData = cardData[categoryKey];
        if (categoryData && categoryData.cards && categoryData.cards.length > 0) {
            const randomCard = categoryData.cards[Math.floor(Math.random() * categoryData.cards.length)];
            
            currentCards.push({
                category: categoryData.category,
                icon: categoryData.icon,
                title: randomCard.title,
                content: randomCard.content,
                categoryClass: categoryKey,
                flipped: false
            });
        } else {
            console.warn(`Aucune carte trouvée pour la catégorie: ${categoryKey}`);
        }
    });

    renderCards();
}

// Afficher les cartes avec Bootstrap
function renderCards() {
    const container = document.getElementById('cardsContainer');
    if (!container) {
        console.error('Container cardsContainer non trouvé');
        return;
    }
    
    container.innerHTML = '';

    currentCards.forEach((card, index) => {
        const cardHtml = `
            <div class="card-flip-container ${card.categoryClass}">
                <div class="card-flip" data-index="${index}" onclick="flipCard(${index})">
                    <div class="card-flip-front card">
                        <div class="card-category">${card.category}</div>
                        <div class="card-icon">${card.icon}</div>
                    </div>
                    <div class="card-flip-back card">
                        <div class="card-title">${card.title}</div>
                        <div class="card-content">${card.content}</div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    console.log('Cartes rendues, ajout des événements...');
    // Ajouter les événements après rendu
    addEventListeners();
}

// Ajouter les événements de clic
function addEventListeners() {
    const cardElements = document.querySelectorAll('.card-flip');
    console.log(`Ajout d'événements pour ${cardElements.length} cartes`);
    
    cardElements.forEach((cardElement, index) => {
        // Supprimer les anciens événements
        const newCardElement = cardElement.cloneNode(true);
        cardElement.parentNode.replaceChild(newCardElement, cardElement);
        
        // Ajouter les nouveaux événements
        newCardElement.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Clic détecté sur carte ${index}`);
            flipCard(index);
        });
        
        // Événement tactile pour mobile
        newCardElement.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Touch détecté sur carte ${index}`);
            flipCard(index);
        });
    });
}

// Retourner une carte - Version simplifiée
function flipCard(index) {
    console.log(`Tentative de retournement carte ${index}`);
    
    if (index < 0 || index >= currentCards.length) {
        console.error(`Index invalide: ${index}`);
        return;
    }
    
    const cardElement = document.querySelector(`[data-index="${index}"]`);
    
    if (!cardElement) {
        console.error(`Élément carte non trouvé pour index ${index}`);
        return;
    }
    
    console.log(`Retournement carte ${index} - État actuel: ${currentCards[index].flipped}`);
    
    // Basculer la classe
    cardElement.classList.toggle('flipped');
    currentCards[index].flipped = !currentCards[index].flipped;
    
    console.log(`Carte ${index} retournée - Nouvel état: ${currentCards[index].flipped}`);
    
    // Vibration tactile sur mobile
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Mélanger les cartes
function shuffleCards() {
    console.log('Mélange des cartes...');
    if (!cardData) {
        console.error('Impossible de mélanger: données non chargées');
        return;
    }
    
    // Réinitialiser d'abord
    resetCards();
    // Puis recharger
    loadCards();
}

// Réinitialiser les cartes
function resetCards() {
    console.log('Réinitialisation...');
    const cards = document.querySelectorAll('.card-flip');
    cards.forEach((card, index) => {
        card.classList.remove('flipped');
        if (currentCards[index]) {
            currentCards[index].flipped = false;
        }
    });
    allFlipped = false;
}

// Retourner toutes les cartes
function flipAllCards() {
    console.log('Retournement de toutes les cartes...');
    const cards = document.querySelectorAll('.card-flip');
    allFlipped = !allFlipped;
    
    cards.forEach((card, index) => {
        if (allFlipped) {
            card.classList.add('flipped');
            if (currentCards[index]) {
                currentCards[index].flipped = true;
            }
        } else {
            card.classList.remove('flipped');
            if (currentCards[index]) {
                currentCards[index].flipped = false;
            }
        }
    });
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation...');
    setTimeout(initApp, 500);
});

// Gestion de l'orientation mobile
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        window.scrollTo(0, 0);
        // Réajouter les événements après changement d'orientation
        if (currentCards.length > 0) {
            addEventListeners();
        }
    }, 100);
});

// Fonction de test pour débugger
function testFlip() {
    console.log('Test de retournement...');
    if (currentCards.length > 0) {
        flipCard(0);
    } else {
        console.log('Aucune carte disponible pour le test');
    }
}

// Ajouter la fonction de test au window pour pouvoir l'appeler depuis la console
window.testFlip = testFlip;
window.flipCard = flipCard;