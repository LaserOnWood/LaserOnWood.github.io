/**
 * ==========================================================================
 * NOTIFICATION DISCORD (Webhook)
 * ==========================================================================
 * Ce fichier gère l'envoi de notifications vers Discord lorsqu'une carte
 * est déverrouillée avec succès.
 *
 * Le champ "actions" de la carte (défini dans cartes.json) est affiché
 * uniquement ici, dans la notification Discord — il n'est jamais visible
 * dans l'interface du jeu.
 */

const DISCORD_WEBHOOKS = [
    "https://discord.com/api/webhooks/1529058939910623232/7fIbXsxCxgPppcVOlhq_YCbAHxzEnigcEVEqSixbpycJt9YEgVNmC9FNVbx5VLBP_e3s", // webhook 1
    // "https://discord.com/api/webhooks/SECOND_WEBHOOK_URL", // webhook 2 (décommenter et remplacer)
];

// Couleur de l'embed selon la rareté de la carte.
const COULEURS_RARETE = {
    "Commun":    0xaaaaaa, // Gris
    "Rare":      0x4a90e2, // Bleu
    "Épique":    0x9b59b6, // Violet
    "Légendaire":0xf1c40f, // Or
    "Mythique":  0xff2f7e  // Rose Magenta
};

/**
 * Envoie un embed riche sur Discord
 * @param {Object} carte - L'objet carte qui vient d'être débloqué
 * @param {string} motDePasseSaisi - Le texte brut saisi par l'utilisateur
 */
async function notifierDiscord(carte, motDePasseSaisi) {
    if (!DISCORD_WEBHOOKS.length) return;

    const couleur = COULEURS_RARETE[carte.rarity] ?? 0xff2f7e;

    // Champs de base toujours présents
    const fields = [
        {
            name: "🎴 Carte",
            value: `**${carte.title}** (n°${carte.id})`,
            inline: true
        },
        {
            name: "💎 Rareté",
            value: carte.rarity,
            inline: true
        },
        {
            name: "🔑 Code utilisé",
            value: `\`${motDePasseSaisi}\``,
            inline: true
        },
        {
            name: "📜 Description",
            value: carte.description
        },
        {
            name: "⚡ Action à réaliser",
            value: carte.actions
        }
    ];

    const payload = {
        embeds: [{
            title: `🔓 Carte Révélée — ${carte.title}`,
            description: `Une nouvelle carte vient d'être débloquée dans **Kinky TCG**.`,
            color: couleur,
            fields,
            image: {
                url: carte.image.startsWith('http') ? carte.image : window.location.origin + '/' + carte.image
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: "Kinky TCG System • Notification Temps Réel"
            }
        }]
    };

    await Promise.all(DISCORD_WEBHOOKS.map(async (url) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                console.error(`Erreur webhook ${url}:`, response.statusText);
            }
        } catch (error) {
            console.error(`Erreur réseau webhook ${url}:`, error);
        }
    }));
}

// Exportation globale pour être utilisé par passemot.js
window.notifierDiscord = notifierDiscord;
