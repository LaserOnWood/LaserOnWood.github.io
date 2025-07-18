 // Configuration du jeu - listes complètes pour chaque phase
 const gameData = {
    phase1: {
        title: "Phase 1 - Zone du Corps",
        description: "Quel gobelet cache votre zone ?",
        allChoices: ["Fessier", "Cuisses", "Dos", "Mains", "Pieds", "Ventre", "Épaules", "Bras", "Mollets", "Chevilles", "Poitrine", "Hanches"],
        choices: [] // Sera rempli dynamiquement
    },
    phase2: {
        title: "Phase 2 - Nombre de Coups",
        description: "Combien de coups se cachent sous le gobelet ?",
        allChoices: ["5 coups", "10 coups", "15 coups", "20 coups", "25 coups", "30 coups", "35 coups", "40 coups", "45 coups", "50 coups", "75 coups", "100 coups"],
        choices: [] // Sera rempli dynamiquement
    },
    phase3: {
        title: "Phase 3 - Objet",
        description: "Quel objet se cache sous le gobelet ?",
        allChoices: ["Fouet", "Martinet", "Cuillère", "Ceinture", "Paddle", "Cravache", "Règle", "Spatule", "Brosse", "Badine", "Tapette", "Flogger", "Crop", "Lanière"],
        choices: [] // Sera rempli dynamiquement
    }
};

let currentPhase = 1;
let selectedChoices = [];

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function selectRandomChoices(phaseKey) {
    const phaseData = gameData[phaseKey];
    const shuffled = shuffleArray(phaseData.allChoices);
    phaseData.choices = shuffled.slice(0, 5);
}

function initializeGame() {
    currentPhase = 1;
    selectedChoices = [];
    
    // Sélectionner 5 choix aléatoires pour chaque phase
    selectRandomChoices('phase1');
    selectRandomChoices('phase2');
    selectRandomChoices('phase3');
    
    updatePhaseIndicator();
    displayPhase();
}

function updatePhaseIndicator() {
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`phase${i}`);
        dot.classList.remove('active', 'completed');
        
        if (i < currentPhase) {
            dot.classList.add('completed');
        } else if (i === currentPhase) {
            dot.classList.add('active');
        }
    }
}

function displayPhase() {
    const phaseData = gameData[`phase${currentPhase}`];
    
    document.getElementById('phaseTitle').textContent = phaseData.title;
    document.getElementById('phaseDescription').textContent = phaseData.description;
    
    const choicesContainer = document.getElementById('choices');
    choicesContainer.innerHTML = '';
    
    // Animation de mélange au début de chaque phase
    phaseData.choices.forEach((choice, index) => {
        const cupContainer = document.createElement('div');
        cupContainer.className = 'cup-container shuffle-animation';
        cupContainer.onclick = () => revealAndSelect(cupContainer, choice, index);
        
        cupContainer.innerHTML = `
            <div class="cup-number">${index + 1}</div>
            <div class="cup">
                <div class="cup-content">${choice}</div>
            </div>
        `;
        
        choicesContainer.appendChild(cupContainer);
    });
    
    // Retirer l'animation de mélange après 2 secondes
    setTimeout(() => {
        document.querySelectorAll('.cup-container').forEach(cup => {
            cup.classList.remove('shuffle-animation');
        });
    }, 2000);
}

function revealAndSelect(cupContainer, choice, index) {
    // Empêcher les clics multiples
    if (cupContainer.classList.contains('revealed')) return;
    
    // Révéler le contenu du gobelet avec animation de retournement
    cupContainer.classList.add('revealed');
    
    // Désactiver les autres gobelets
    const allCups = document.querySelectorAll('.cup-container');
    allCups.forEach(cup => {
        if (cup !== cupContainer) {
            cup.style.pointerEvents = 'none';
            cup.style.opacity = '0.4';
            cup.style.transform = 'scale(0.9)';
        }
    });
    
    // Effet sonore visuel
    cupContainer.style.transform = 'scale(1.1)';
    setTimeout(() => {
        cupContainer.style.transform = 'scale(1)';
    }, 300);
    
    // Attendre pour que l'utilisateur voie le résultat
    setTimeout(() => {
        selectChoice(choice);
    }, 2000);
}

function selectChoice(choice) {
    selectedChoices[currentPhase - 1] = choice;
    
    if (currentPhase < 3) {
        currentPhase++;
        updatePhaseIndicator();
        
        // Délai avant d'afficher la phase suivante
        setTimeout(() => {
            displayPhase();
        }, 500);
    } else {
        setTimeout(() => {
            showResult();
        }, 500);
    }
}

function showResult() {
    document.getElementById('gameCard').classList.add('d-none');
    document.getElementById('resultCard').classList.remove('d-none');
    
    const resultHtml = `
        <div class="row">
            <div class="col-md-4 mb-2">
                <strong>Zone:</strong><br>
                <span class="badge bg-primary fs-6">${selectedChoices[0]}</span>
            </div>
            <div class="col-md-4 mb-2">
                <strong>Nombre:</strong><br>
                <span class="badge bg-success fs-6">${selectedChoices[1]}</span>
            </div>
            <div class="col-md-4 mb-2">
                <strong>Objet:</strong><br>
                <span class="badge bg-warning fs-6">${selectedChoices[2]}</span>
            </div>
        </div>
        <div class="mt-3">
            <h4>🎯 Votre défi :</h4>
            <p class="lead">${selectedChoices[1]} sur ${selectedChoices[0]} avec ${selectedChoices[2]}</p>
        </div>
    `;
    
    document.getElementById('finalResult').innerHTML = resultHtml;
    
    // Mettre à jour l'indicateur de phase
    updatePhaseIndicator();
    document.getElementById('phase3').classList.add('completed');
}

function restartGame() {
    document.getElementById('gameCard').classList.remove('d-none');
    document.getElementById('resultCard').classList.add('d-none');
    initializeGame();
}

// Initialiser le jeu au chargement de la page
document.addEventListener('DOMContentLoaded', initializeGame);