let difficulteActuelle = "facile"; // Valeur initiale : Facile

async function chargerPhrases() {
    try {
        const response = await fetch("json/phrases.json");
        if (!response.ok) throw new Error("Erreur de chargement.");
        return await response.json();
    } catch (error) {
        console.error(error);
        return { "facile": [], "moyen": [], "difficile": [] };
    }
}

async function afficherPhraseAleatoire() {
    const phrases = await chargerPhrases();
    const quoteText = document.getElementById("quoteText");
    const categoryTitle = document.getElementById("categoryTitle");

    let difficulte = difficulteActuelle;
    if (difficulte === "random") {
        const niveaux = ["facile", "moyen", "difficile"];
        difficulte = niveaux[Math.floor(Math.random() * niveaux.length)];
    }

    if (!phrases[difficulte] || phrases[difficulte].length === 0) {
        quoteText.textContent = "Aucune phrase disponible.";
        return;
    }

    categoryTitle.textContent = difficulte.charAt(0).toUpperCase() + difficulte.slice(1); // Affichage de la catégorie

    // Animation de sortie du texte
    quoteText.style.opacity = 0;

    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * phrases[difficulte].length);
        const selectedPhrase = phrases[difficulte][randomIndex];
        quoteText.textContent = selectedPhrase;

        // Animation d'entrée du texte
        quoteText.style.opacity = 1;
    }, 500);
}

// Fonction pour retourner la carte au clic
const cardContainer = document.getElementById("cardContainer");
cardContainer.addEventListener("click", () => {
    cardContainer.classList.toggle("flipped"); // Ajoute/retire la classe "flipped"
    afficherPhraseAleatoire(); // Met à jour la phrase au moment du retournement
});

// Fonction pour changer la difficulté
function changerDifficulte(nouvelleDifficulte) {
    difficulteActuelle = nouvelleDifficulte;
    afficherPhraseAleatoire();
}

// Charger une phrase au démarrage
afficherPhraseAleatoire();
