// Charger les phrases depuis le fichier JSON
async function chargerPhrases() {
    try {
        const response = await fetch("json/phrases.json");
        if (!response.ok) throw new Error("Erreur lors du chargement des phrases.");
        const data = await response.json();
        return data.habit;
    } catch (error) {
        console.error(error);
        return ["Erreur de chargement des phrases."];
    }
}
// Afficher une phrase aléatoire pour chaque catégorie
async function afficherPhraseAleatoire() {
    const phrases = await chargerPhrases();
    const quoteText = document.getElementById("quoteTextHabit");

    // Animation de sortie
    quoteText.style.opacity = 0;

    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * phrases.length);
        quoteText.textContent = phrases[randomIndex];

        // Animation d'entrée
        quoteText.style.opacity = 1;
    }, 500);
}

const cardContainer = document.getElementById("cardContainer");

// Retourner la carte en cliquant dessus
//cardContainer.addEventListener("click", () => {
//    cardContainer.classList.toggle("flipped");
//});

// Changer la phrase en cliquant sur le bouton
document.getElementById("newQuoteBtn").addEventListener("click", (event) => {
    event.stopPropagation(); // Empêche la carte de se retourner en cliquant sur le bouton
    afficherPhraseAleatoire();
});

// Charger une phrase au démarrage
afficherPhraseAleatoire();