/**
 * Module de configuration pour l'application de gestion des préférences Kink
 */
export const CONFIG = {
    jsonPath: 'json/kink-data.json',
    preferenceStates: ['none', 'adore', 'aime', 'curiosité', 'dislike', 'non_strict'],
    validImportStates: ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'],
    toastDuration: 3000,
    debounceDelay: 100
};

/**
 * Données de fallback en cas d'échec de chargement du JSON
 */
export const FALLBACK_DATA = {
    categories: [
        {
            id: "test-category",
            name: "Catégorie de test",
            icon: "fas fa-heart",
            description: "Données de test en cas d'erreur de chargement",
            hasSubcategories: false,
            items: ["Test Item 1", "Test Item 2", "Test Item 3"]
        }
    ],
    preferenceTypes: [
        { id: "adore", name: "Adore", color: "linear-gradient(135deg, #ff6b6b, #ee5a52)" },
        { id: "aime", name: "Aime", color: "linear-gradient(135deg, #4ecdc4, #44a08d)" },
        { id: "curiosité", name: "Curiosité", color: "linear-gradient(135deg, #45b7d1, #96c93d)" },
        { id: "dislike", name: "N'aime pas", color: "linear-gradient(135deg, #f093fb, #f5576c)" },
        { id: "non_strict", name: "Limite non stricte", color: "linear-gradient(135deg, #ffecd2, #fcb69f)" }
    ]
};

