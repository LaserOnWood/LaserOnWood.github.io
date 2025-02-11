document.addEventListener("DOMContentLoaded", () => {
    afficherPhrasesAleatoires();

    // Sélectionne tous les boutons de rafraîchissement
    document.querySelectorAll("[id^='refreshQuotesBtn-']").forEach(button => {
        button.addEventListener("click", () => {
            const category = button.dataset.category; // Récupère la catégorie depuis l'attribut data-category
            afficherPhraseAleatoire(category);
        });
    });
});

// Variable pour garder trace des indices déjà affichés pour chaque catégorie
const affichagePhrases = {
    soft: [],
    medium: [],
    hard: [],
    habit: []
};

// Fonction améliorée pour afficher une phrase spécifique selon la catégorie
async function afficherPhraseAleatoire(category) {
    const data = await chargerPhrases();
    const phraseElement = document.getElementById(`quoteText-${category}`);

    if (phraseElement && data[category] && data[category].length > 0) {
        // Récupère l'index aléatoire en s'assurant qu'il n'a pas déjà été affiché
        let randomIndex;

        if (affichagePhrases[category].length === data[category].length) {
            // Si toutes les phrases ont été affichées, réinitialise la liste
            affichagePhrases[category] = [];
        }

        // Choisit un index aléatoire qui n'a pas encore été utilisé
        do {
            randomIndex = Math.floor(Math.random() * data[category].length);
        } while (affichagePhrases[category].includes(randomIndex));

        // Affiche la phrase et ajoute l'index à la liste des affichages
        phraseElement.textContent = data[category][randomIndex];
        affichagePhrases[category].push(randomIndex);
    } else if (phraseElement) {
        phraseElement.textContent = "Aucune phrase disponible.";
    } else {
        console.warn(`⚠ Élément non trouvé : quoteText-${category}`);
    }
}

// Charger toutes les phrases au début
async function afficherPhrasesAleatoires() {
    const categories = ["soft", "medium", "hard", "habit"];
    for (const categorie of categories) {
        await afficherPhraseAleatoire(categorie); // Attend que chaque phrase soit chargée avant de passer à la suivante
    }
}

async function chargerPhrases() {
    try {
        const response = await fetch("json/phrases.json");
        if (!response.ok) throw new Error("Erreur lors du chargement des phrases.");
        return await response.json();
    } catch (error) {
        console.error(error);
        return { habit: [], medium: [], hard: [], soft: [] };
    }
}
