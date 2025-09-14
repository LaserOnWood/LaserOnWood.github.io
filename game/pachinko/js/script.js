document.addEventListener("DOMContentLoaded", () => {
    const dropBallBtn = document.getElementById("drop-ball-btn");
    const resetGameBtn = document.getElementById("reset-game-btn");
    const ballsRemainingSpan = document.getElementById("balls-remaining");
    const nextRoundInfoDiv = document.getElementById("next-round-info");
    const currentRoundInfoDiv = document.getElementById("current-round-info");
    const currentPrizesDiv = document.getElementById("current-prizes");
    const historyListDiv = document.getElementById("history-list");
    const noHistoryMessage = document.getElementById("no-history-message");
    const guideListDiv = document.getElementById("guide-list");
    const currentResultsDiv = document.getElementById("current-results");
    const resultsGridDiv = document.getElementById("results-grid");
    const animatedBallDiv = document.getElementById("animated-ball");
    const pachinkoPinsDiv = document.getElementById("pachinko-pins");

    let balls = [];
    let history = [];
    let isPlaying = false;
    let currentBall = 0;
    let animatingBall = null;

    // Définition des gains dynamiques par lancer
    const prizesByRound = {
        1: {
            title: "Intensité",
            color: "#FF69B4", // Rose
            options: ["5", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"]
        },
        2: {
            title: "Zone du corps",
            color: "#007BFF", // Bleu
            options: ["Poitrine", "Ventre", "Cuisses", "Fesses", "Pieds", "Mains", "Dos", "Sexe"]
        },
        3: {
            title: "Accessoire",
            color: "#28A745", // Vert
            options: ["Paddle", "Cravache", "Plumeau", "Fouet", "Martinet"]
        },
        4: {
            title: "Position",
            color: "#FFC107", // Jaune
            options: ["À genoux", "Debout", "Allongé", "Penché", "À quatre pattes", "Contre le mur", "Sur la table", "Les mains liées", "Enchaîné"]
        },
        5: {
            title: "Joker",
            color: "#DC3545", // Rouge
            options: ["Choix du joueur", "Double l'intensité'", "Divise l'intensité", "Rejouer un lancer","Les yeux bandés", "Passe ton tour"]
        }
    };

    // Générer les picots en quinconce
    const generatePins = () => {
        pachinkoPinsDiv.innerHTML = ''; // Clear existing pins
        const rows = 12;
        const pinsPerRow = 8;
        const boardWidth = pachinkoPinsDiv.offsetWidth;
        const boardHeight = pachinkoPinsDiv.offsetHeight;

        for (let row = 0; row < rows; row++) {
            const isEvenRow = row % 2 === 0;
            const pinsInThisRow = isEvenRow ? pinsPerRow : pinsPerRow - 1;
            const rowOffset = isEvenRow ? 0 : (boardWidth / pinsPerRow) / 2; // Décalage pour les rangées impaires

            for (let pin = 0; pin < pinsInThisRow; pin++) {
                const pinElement = document.createElement('div');
                pinElement.classList.add('pin', 'position-absolute');
                
                const x = (pin * (boardWidth / pinsPerRow)) + rowOffset + (boardWidth / pinsPerRow / 2); // Centrer les picots
                const y = (row * (boardHeight / rows)) + (boardHeight / rows / 2);

                pinElement.style.left = `${(x / boardWidth) * 100}%`;
                pinElement.style.top = `${(y / boardHeight) * 100}%`;
                pachinkoPinsDiv.appendChild(pinElement);
            }
        }
    };

    // Fonction pour simuler la chute d'une balle avec animation
    const dropBall = () => {
        if (currentBall >= 5 || isPlaying) return;

        isPlaying = true;
        dropBallBtn.disabled = true;
        dropBallBtn.textContent = "Balle en cours...";

        animatedBallDiv.style.display = "block";
        animatedBallDiv.style.left = "50%";
        animatedBallDiv.style.top = "10%";

        let animationStep = 0;
        const animationDuration = 1500; // milliseconds
        const startTime = Date.now();

        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime >= animationDuration) {
                animatedBallDiv.style.display = "none";
                
                // Calculer le résultat
                const round = currentBall + 1;
                const roundPrizes = prizesByRound[round];
                const randomPrize = roundPrizes.options[Math.floor(Math.random() * roundPrizes.options.length)];
                
                const newResult = {
                    ballNumber: round,
                    roundTitle: roundPrizes.title,
                    prize: randomPrize,
                    color: roundPrizes.color,
                    timestamp: new Date().toLocaleTimeString()
                };
                
                balls.push(newResult);
                currentBall++;
                
                // Ajouter à l'historique (garder seulement les 5 derniers)
                history.push(newResult);
                if (history.length > 5) {
                    history.shift();
                }
                
                updateUI();
                isPlaying = false;
                dropBallBtn.disabled = false;
                dropBallBtn.textContent = currentBall >= 5 ? "Partie terminée" : "Lancer une balle";
                return;
            }

            // Simple animation de chute avec un peu de mouvement latéral aléatoire
            const progress = elapsedTime / animationDuration;
            const newY = 5 + (80 * progress); // De 5% à 85% de la hauteur
            const newX = 50 + (Math.sin(progress * Math.PI * 4) * 5); // Mouvement latéral sinusoïdal

            animatedBallDiv.style.left = `${newX}%`;
            animatedBallDiv.style.top = `${newY}%`;

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    };

    // Réinitialiser le jeu
    const resetGame = () => {
        balls = [];
        currentBall = 0;
        isPlaying = false;
        animatingBall = null;
        animatedBallDiv.style.display = "none";
        updateUI();
        dropBallBtn.disabled = false;
        dropBallBtn.textContent = "Lancer une balle";
    };

    // Mettre à jour l'interface utilisateur
    const updateUI = () => {
        ballsRemainingSpan.textContent = 5 - currentBall;

        // Mise à jour des informations du prochain lancer
        if (currentBall < 5) {
            const nextRound = currentBall + 1;
            nextRoundInfoDiv.textContent = `Prochain lancer: ${prizesByRound[nextRound]?.title}`;
            currentRoundInfoDiv.textContent = `Lancer ${nextRound}: ${prizesByRound[nextRound]?.title}`;

            // Mise à jour des cases de gains en bas
            currentPrizesDiv.innerHTML = "";
            prizesByRound[nextRound]?.options.slice(0, 5).forEach(option => {
                const prizeSlot = document.createElement("div");
                prizeSlot.classList.add("flex-fill");
                prizeSlot.style.backgroundColor = prizesByRound[nextRound].color;
                prizeSlot.innerHTML = `<div class="text-center px-1">${option}</div>`;
                currentPrizesDiv.appendChild(prizeSlot);
            });
        } else {
            nextRoundInfoDiv.textContent = "Partie terminée";
            currentRoundInfoDiv.textContent = "Partie terminée";
            currentPrizesDiv.innerHTML = `<div class="col-12 h-100 bg-secondary d-flex align-items-center justify-content-center text-white fw-bold">Partie terminée</div>`;
            dropBallBtn.disabled = true;
            dropBallBtn.textContent = "Partie terminée";
        }

        // Mise à jour de l'historique
        historyListDiv.innerHTML = "";
        if (history.length === 0) {
            noHistoryMessage.style.display = "block";
        } else {
            noHistoryMessage.style.display = "none";
            history.forEach((result, index) => {
                const historyItem = document.createElement("div");
                historyItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
                historyItem.style.borderColor = result.color;
                historyItem.innerHTML = `
                    <div>
                        <strong class="d-block">Lancer ${result.ballNumber} - ${result.roundTitle}</strong>
                        <span class="badge text-white" style="background-color: ${result.color};">${result.prize}</span>
                    </div>
                    <small>${result.timestamp}</small>
                `;
                historyListDiv.appendChild(historyItem);
            });
        }
    };

    // Initialiser le guide des lancers
    const initGuide = () => {
        guideListDiv.innerHTML = "";
        Object.entries(prizesByRound).forEach(([round, data]) => {
            const guideItem = document.createElement("div");
            guideItem.classList.add("list-group-item", "d-flex", "align-items-center");
            guideItem.innerHTML = `
                <div class="rounded-circle d-flex justify-content-center align-items-center me-3" style="width: 30px; height: 30px; background-color: ${data.color}; color: white; font-weight: bold;">${round}</div>
                <div>
                    <div class="fw-semibold">${data.title}</div>
                    <div class="small text-muted">${data.options}</div>
                </div>
            `;
            guideListDiv.appendChild(guideItem);
        });
    };

    // Écouteurs d'événements
    dropBallBtn.addEventListener("click", dropBall);
    resetGameBtn.addEventListener("click", resetGame);

    // Initialisation
    generatePins();
    initGuide();
    updateUI();
});


