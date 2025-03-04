document.addEventListener("DOMContentLoaded", async () => {
    await afficherPhrasesAleatoires();

    // Bouton pour rafraîchir manuellement la phrase
    document.querySelectorAll("[id^='refreshQuotesBtn-']").forEach(button => {
        button.addEventListener("click", () => {
            const category = button.dataset.category;
            console.log("🔄 Bouton cliqué pour la catégorie :", category);
            afficherPhraseAleatoire(category);
        });
    });

    // Détection de l'ouverture du collapse pour afficher une nouvelle phrase
    document.querySelectorAll(".collapse").forEach(collapse => {
        collapse.addEventListener("shown.bs.collapse", (event) => {
            const category = event.target.id.replace("collapse", ""); // 🔥 On ne met PAS en minuscules
            console.log("📌 Collapse ouvert :", category);
            afficherPhraseAleatoire(category);
        });
    });
});

// Fonction pour afficher une phrase aléatoire
async function afficherPhraseAleatoire(category) {
    console.log(`🔄 Chargement d'une nouvelle phrase pour : ${category}`);

    const data = await chargerPhrases();
    if (!data[category] || data[category].length === 0) {
        console.warn(`⚠ Aucune phrase trouvée pour ${category}`);
        return;
    }

    const phraseElement = document.getElementById(`quoteText-${category}`);

    if (!phraseElement) {
        console.warn(`⚠ Élément non trouvé pour la catégorie ${category}`);
        return;
    }

    // 🔥 Génére un index aléatoire à chaque fois
    const randomIndex = Math.floor(Math.random() * data[category].length);

    // 🎯 Met à jour immédiatement la phrase
    phraseElement.textContent = data[category][randomIndex];

    console.log(`✅ Nouvelle phrase affichée pour ${category} :`, data[category][randomIndex]);
}

// Fonction pour charger toutes les phrases au début
async function afficherPhrasesAleatoires() {
    const categories = [
        "ActionSoft", "VeriteSoft", "ActionMedium", "VeriteMedium",
        "ActionHard", "VeriteHard", "GageSoft", "GageMedium",
        "GageHard", "GageExtreme", "Secret"
    ];
    
    for (const category of categories) {
        await afficherPhraseAleatoire(category);
    }
}

// Fonction pour charger les phrases depuis le fichier JSON
async function chargerPhrases() {
    try {
        const response = await fetch("json/phrases.json");
        if (!response.ok) throw new Error("Erreur lors du chargement des phrases.");

        const jsonData = await response.json();
        console.log("📂 Phrases chargées avec succès :", jsonData);
        return jsonData;
    } catch (error) {
        console.error("🚨 Erreur de chargement du JSON :", error);
        return {
            ActionMedium: [], ActionHard: [], ActionSoft: [], VeriteMedium: [],
            VeriteHard: [], VeriteSoft: [], GageSoft: [], GageMedium: [],
            GageHard: [], GageExtreme: [], Secret: []
        };
    }
}
