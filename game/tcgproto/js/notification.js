/**
 * ==========================================================================
 * NOTIFICATION DISCORD (Webhook)
 * ==========================================================================
 * Ce fichier gère l'envoi de notifications vers Discord lorsqu'une carte
 * est déverrouillée avec succès.
 */

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1528117812051050566/udtcAhay0ioWAOA0wOW2XpGoVsE3vovey9SwQajf0HOsuN-jydjF0hlf3Hy3WtmYUGr1";

/**
 * Table de correspondance Rareté -> Couleur (doit rester synchronisée
 * avec les couleurs définies dans style.css : --gold, --magenta, etc.)
 * Les valeurs sont au format décimal attendu par l'API Discord (embed.color).
 */
const RARITY_COLORS = {
  "Commun":     8096404,  // #7b8a94
  "Rare":       5223385,  // #4fb3d9
  "Épique":     16723838, // #ff2f7e (magenta)
  "Légendaire": 14264655, // #d9a94f (or)
  "Mythique":   15066338  // #e5e4e2 (platine)
};

const COULEUR_PAR_DEFAUT = 16723838; // Rose Magenta, utilisée si la rareté est inconnue

/**
 * Envoie un embed riche sur Discord
 * @param {Object} carte - L'objet carte qui vient d'être débloqué
 * @param {string} motDePasseSaisi - Le texte brut saisi par l'utilisateur
 */
async function notifierDiscord(carte, motDePasseSaisi) {
    if (!DISCORD_WEBHOOK_URL) return;

// Sélectionne la couleur de l'embed en fonction de la rareté de la carte
  const couleurEmbed = RARITY_COLORS[carte.rarity] ?? COULEUR_PAR_DEFAUT;

    const payload = {
        embeds: [{
            title: "🔓 Carte Révélée !",
            description: `Votre partenaire vient de débloquer une nouvelle carte dans **Kinky TCG**.`,
            color: couleurEmbed, // Couleur alignée sur la rareté de la carte
            fields: [
                {
                    name: "🎴 Carte",
                    value: `**${carte.title}** (n°${carte.id})`,
                    inline: true
                },
                {
                    name: "🔑 Code utilisé",
                    value: `\`${motDePasseSaisi}\``,
                    inline: true
                },
                {
                    name: "💎 Rareté",
                    value: carte.rarity,
                    inline: true
                },
                {
                    name: "📜 Contenu / Gage",
                    value: carte.description
                }
            ],
            image: {
                url: carte.image.startsWith('http') ? carte.image : window.location.origin + '/' + carte.image
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: "Kinky TCG System • Notification Temps Réel"
            }
        }]
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error("Erreur lors de l'envoi à Discord:", response.statusText);
        }
    } catch (error) {
        console.error("Erreur réseau Discord:", error);
    }
}

// Exportation globale pour être utilisé par passemot.js
window.notifierDiscord = notifierDiscord;
