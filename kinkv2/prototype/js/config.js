/**
 * Configuration centrale du prototype KinkList.
 * Les valeurs de résilience sont regroupées ici pour rester auditables.
 */
export const CONFIG = {
    jsonPath: 'json/kink-data.json',
    preferenceStates: ['none', 'adore', 'aime', 'curiosité', 'dislike', 'non_strict'],
    validImportStates: ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'],
    toastDuration: 3000,
    debounceDelay: 100,
    dataFetchTimeout: 8000,
    dataCacheKey: 'kink-reference-data-v1',
    dataCacheTtl: 7 * 24 * 60 * 60 * 1000,
    indexedDbSaveDelay: 800
};

/**
 * Catalogue de secours minimal uniquement utilisé lorsqu’aucune copie valide
 * du catalogue de référence n’est disponible localement.
 */
export const FALLBACK_DATA = {
    categories: [
        {
            id: 'test-category',
            name: 'Catalogue temporairement indisponible',
            icon: 'fas fa-triangle-exclamation',
            description: 'Les données complètes n’ont pas pu être chargées. Réessayez lorsque votre connexion sera disponible.',
            hasSubcategories: false,
            items: ['Donnée de secours']
        }
    ],
    preferenceTypes: [
        { id: 'adore', name: 'Adore', color: 'linear-gradient(135deg, #ff6b6b, #ee5a52)' },
        { id: 'aime', name: 'Aime', color: 'linear-gradient(135deg, #4ecdc4, #44a08d)' },
        { id: 'curiosité', name: 'Curiosité', color: 'linear-gradient(135deg, #45b7d1, #96c93d)' },
        { id: 'dislike', name: "N'aime pas", color: 'linear-gradient(135deg, #f093fb, #f5576c)' },
        { id: 'non_strict', name: 'Limite non stricte', color: 'linear-gradient(135deg, #ffecd2, #fcb69f)' }
    ]
};
