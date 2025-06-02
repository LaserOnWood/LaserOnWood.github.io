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
            shuffleCards();
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
            container.innerHTML = '';

            currentCards.forEach((card, index) => {
                const cardHtml = `
                    <div class="card-flip-container ${card.categoryClass}">
                        <div class="card-flip" data-index="${index}">
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
                
                // Ajouter les événements après insertion
                const cardElement = container.querySelector(`[data-index="${index}"]`);
                
                // Événement click
                cardElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    flipCard(index);
                });
                
                // Événement tactile
                cardElement.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    flipCard(index);
                });
            });
        }

        // Retourner une carte
        function flipCard(index) {
            console.log('Retournement carte:', index);
            const cardElement = document.querySelector(`[data-index="${index}"]`);
            
            if (cardElement) {
                cardElement.classList.toggle('flipped');
                currentCards[index].flipped = !currentCards[index].flipped;
                
                // Vibration tactile sur mobile
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // Animation Bootstrap (optionnel)
                cardElement.style.transform += ' scale(0.98)';
                setTimeout(() => {
                    cardElement.style.transform = cardElement.style.transform.replace(' scale(0.98)', '');
                }, 100);
            }
        }

        // Mélanger les cartes
        function shuffleCards() {
            console.log('Mélange des cartes...');
            if (!cardData) {
                console.error('Impossible de mélanger: données non chargées');
                return;
            }
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

        // Gestion tactile améliorée
        document.addEventListener('touchstart', function(e) {
            if (e.target.closest('.card-flip')) {
                e.target.closest('.card-flip').style.transition = 'transform 0.1s';
            }
        }, { passive: true });

        // Initialiser au chargement de la page
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM chargé, initialisation...');
            setTimeout(initApp, 500); // Petit délai pour l'effet de chargement
        });

        // Gestion de l'orientation mobile
        window.addEventListener('orientationchange', function() {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        });

        // Support PWA (optionnel)
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                // Pas de service worker pour cet exemple
            });
        }