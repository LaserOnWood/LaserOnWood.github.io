/* ==========================================================================
   1. DONNÉES DES CARTES
   --------------------------------------------------------------------------
   Chaque carte = { id, passwordHash, hints, title, image, description, rarity }
   - passwordHash : hash SHA-256 du mot de passe EN MINUSCULES et sans espaces.
   - hints : tableau d'indices (le premier est visible d'emblée, les autres via le bouton Aide)
   - rarity : "Commun" | "Rare" | "Épique" | "Légendaire" | "Mythique"
   - image : chemin relatif ("images/carte1.jpg") ou URL absolue.

   ⚠️ Les mots de passe ci-dessous sont des EXEMPLES DE DÉMONSTRATION
   ("clef", "miroir", "velours", "boussole", "lanterne", "ruban",
   "sablier", "eclipse"). Remplacez passwordHash par le hash de vos
   propres mots de passe avant de jouer (voir l'outil de génération
   de hash tout en bas de ce script).
   ========================================================================== */
const CARTES = [
  {
    id: 1,
    passwordHash: "87d6ad049783f68f509a18094d29b7e994d86983fa39a2620cfb0f86ec8dfcb0", // "clef"
    hints: [
      "Sous l'objet qui ouvre les portes.",
      "C'est métallique et souvent près de l'entrée."
    ],
    title: "Le Prélude",
    image: "https://picsum.photos/seed/carte1/500/700",
    description: "Un massage lent, à la lumière des bougies, pour ouvrir le jeu en douceur.",
    rarity: "Commun"
  },
  {
    id: 2,
    passwordHash: "ee11fce9c63ebf368bca90f069806c881404f70708e6be19173d1467868462e0", // "miroir"
    hints: [
      "Là où l'on se regarde avant de sortir.",
      "Vous vous y regardez chaque matin."
    ],
    title: "Le Reflet",
    image: "https://picsum.photos/seed/carte2/500/700",
    description: "Choisissez la tenue de votre partenaire pour le reste de la soirée.",
    rarity: "Commun"
  },
  {
    id: 3,
    passwordHash: "bd7cf4d0b57ebfdd5a030ae10bc49c4ec1e69dfacf1feeb45e4d0b21c3fcbadb", // "velours"
    hints: [
      "Doux au toucher, souvent sur un canapé.",
      "C'est une matière luxueuse et douce.",
      "Pense à une texture premium."
    ],
    title: "Le Velours",
    image: "https://picsum.photos/seed/carte3/500/700",
    description: "Un privilège d'une durée de dix minutes, à réclamer quand bon vous semble ce soir.",
    rarity: "Rare"
  },
  {
    id: 4,
    passwordHash: "c9e249076b83a1040a351fe9cf42c9bdc60d24eac7568500737f26890420ec70", // "boussole"
    hints: [
      "Elle indique toujours une direction.",
      "Un instrument de navigation ancien.",
      "Elle pointe toujours vers le nord."
    ],
    title: "La Direction",
    image: "https://picsum.photos/seed/carte4/500/700",
    description: "Votre partenaire vous guide, les yeux fermés, vers une surprise.",
    rarity: "Rare"
  },
  {
    id: 5,
    passwordHash: "23df2ca41316489504d44f3adad8b2d9752bc0cd7e65045d51810c5c8c879c47", // "lanterne"
    hints: [
      "Elle éclaire dans l'obscurité.",
      "On l'allume pour voir dans le noir.",
      "Souvent utilisée en camping ou en exploration."
    ],
    title: "La Lueur",
    image: "https://picsum.photos/seed/carte5/500/700",
    description: "Un gage à réaliser lumières éteintes uniquement.",
    rarity: "Épique"
  },
  {
    id: 6,
    passwordHash: "5e34d5179c13deb3177625e922456b154c8fb3a3dfd7490f7aff798f23a853e2", // "ruban"
    hints: [
      "On l'utilise pour attacher un cadeau.",
      "C'est souvent coloré et décoratif.",
      "On l'enroule autour de quelque chose."
    ],
    title: "Le Lien",
    image: "https://picsum.photos/seed/carte6/500/700",
    description: "Un tour de rôle où l'un des deux ne peut utiliser que ses mains… ou pas.",
    rarity: "Épique"
  },
  {
    id: 7,
    passwordHash: "e49ec5f68827a836467c4f3e3a54fa7b10a2acbd949d6aa79f85f629be684f23", // "sablier"
    hints: [
      "Le temps s'écoule grain par grain.",
      "C'est un objet qui mesure le temps.",
      "Le sable tombe d'un côté à l'autre."
    ],
    title: "Le Compte à Rebours",
    image: "https://picsum.photos/seed/carte7/500/700",
    description: "Trois minutes chrono pour convaincre votre partenaire de céder à votre requête.",
    rarity: "Légendaire"
  },
  {
    id: 8,
    passwordHash: "80b1509ea37643250da601f2d24fe9b236b76fd3a3d7d18498d760cdd38813b2", // "eclipse"
    hints: [
      "Quand la lune cache le soleil.",
      "Un phénomène astronomique rare.",
      "L'ombre de la lune sur la Terre."
    ],
    title: "L'Éclipse",
    image: "https://picsum.photos/seed/carte8/500/700",
    description: "La carte finale : un souhait, sans limite ni condition, à exaucer ce soir.",
    rarity: "Légendaire"
  }
];

const STORAGE_KEY = "kinky_tcg_progress_v0.2.hints";
const HINTS_STORAGE_KEY = "kinky_tcg_hints_revealed"; // Stocke les indices révélés par carte

/* ==========================================================================
   2. UTILITAIRES
   ========================================================================== */

// Calcule le hash SHA-256 (hexadécimal) d'une chaîne, via l'API native du navigateur.
async function sha256(message){
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Normalise la saisie : minuscules + suppression des espaces superflus.
function normaliser(texte){
  return texte.trim().toLowerCase();
}

function chargerProgression(){
  try{
    const brut = localStorage.getItem(STORAGE_KEY);
    return brut ? new Set(JSON.parse(brut)) : new Set();
  }catch(e){
    return new Set();
  }
}

function sauverProgression(setDebloquees){
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...setDebloquees]));
}

function chargerIndicesReveles(){
  try{
    const brut = localStorage.getItem(HINTS_STORAGE_KEY);
    return brut ? JSON.parse(brut) : {};
  }catch(e){
    return {};
  }
}

function sauverIndicesReveles(indicesObj){
  localStorage.setItem(HINTS_STORAGE_KEY, JSON.stringify(indicesObj));
}

function obtenirIndiceActuel(carteId, indicesReveles){
  return indicesReveles[carteId] || 0;
}

/* ==========================================================================
   3. ÉTAT & RENDU
   ========================================================================== */
let debloquees = chargerProgression();
let indicesReveles = chargerIndicesReveles();

function iconeRarete(r){
  return { "Commun":"🔒", "Rare":"🔒", "Épique":"🔒", "Légendaire":"🔒", "Mythique":"🔒" }[r] || "🔒";
}

function creerCarteHTML(carte){
  const estDebloquee = debloquees.has(carte.id);
  const holo = (carte.rarity === "Épique" || carte.rarity === "Légendaire" || carte.rarity === "Mythique") ? "holo" : "";
  const indiceActuel = obtenirIndiceActuel(carte.id, indicesReveles);
  const hintsArray = Array.isArray(carte.hints) ? carte.hints : [carte.hints];
  const texteIndice = hintsArray[indiceActuel] || hintsArray[0];
  const aPlusieurIndices = hintsArray.length > 1;

  return `
    <div class="card-slot">
      <div class="card ${estDebloquee ? 'unlocked' : ''}" data-id="${carte.id}">
        <div class="face back">
          <div class="seal">✦</div>
          <div class="num">Carte n°${String(carte.id).padStart(2,'0')}</div>
          ${texteIndice ? `<div class="hint">${texteIndice}</div>` : ''}
          ${aPlusieurIndices ? `<button class="hint-btn" data-card-id="${carte.id}">? Aide</button>` : ''}
        </div>
        <div class="face front ${holo}" data-rarity="${carte.rarity}">
          <div class="rarity-tag" data-r="${carte.rarity}">${carte.rarity}</div>
          <div class="art" style="background-image:url('${carte.image}')"></div>
          <div class="info">
            <p class="title">${carte.title}</p>
            <p class="desc">${carte.description}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function rendreGrille(){
  const grid = document.getElementById("grid");
  grid.innerHTML = CARTES.map(creerCarteHTML).join("");
  
  // Ajouter les event listeners aux boutons d'aide
  document.querySelectorAll('.hint-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      afficherIndiceSupplementaire(parseInt(btn.dataset.cardId));
    });
  });
}

function afficherIndiceSupplementaire(carteId){
  const carte = CARTES.find(c => c.id === carteId);
  if(!carte) return;
  
  const hintsArray = Array.isArray(carte.hints) ? carte.hints : [carte.hints];
  const indiceActuel = obtenirIndiceActuel(carteId, indicesReveles);
  
  // Boucle sur les indices : passe au suivant ou revient au premier
  const prochainIndice = (indiceActuel + 1) % hintsArray.length;
  indicesReveles[carteId] = prochainIndice;
  sauverIndicesReveles(indicesReveles);
  rendreGrille();
}

function rendreProgression(){
  const total = CARTES.length;
  const n = debloquees.size;
  document.getElementById("progress-label").textContent = `${n} / ${total}`;
  document.getElementById("progress-fill").style.width = `${(n/total)*100}%`;
  if(n === total){
    document.getElementById("overlay").classList.add("show");
  }
}

/* ==========================================================================
   4. LOGIQUE DE SAISIE DU MOT DE PASSE
   ========================================================================== */
const input = document.getElementById("pwd-input");
const btn = document.getElementById("submit-btn");
const entryInner = document.getElementById("entry-inner");
const feedback = document.getElementById("feedback");

async function tenterDeverrouillage(){
  const saisie = normaliser(input.value);
  if(!saisie){ return; }

  const hash = await sha256(saisie);
  const carteTrouvee = CARTES.find(c => c.passwordHash === hash && !debloquees.has(c.id));

  if(carteTrouvee){
    debloquees.add(carteTrouvee.id);
    sauverProgression(debloquees);
    input.value = "";
    feedback.textContent = `✦ « ${carteTrouvee.title} » révélée !`;
    feedback.className = "feedback ok";

    rendreGrille();
    rendreProgression();

    // Notification Discord
    if (window.notifierDiscord) {
      window.notifierDiscord(carteTrouvee, saisie);
    }

    // relance l'animation de pop sur la carte concernée
    requestAnimationFrame(() => {
      const el = document.querySelector(`.card[data-id="${carteTrouvee.id}"]`);
      if(el){
        el.classList.add("just-unlocked");
        setTimeout(() => el.classList.remove("just-unlocked"), 900);
      }
    });
  } else {
    // déjà débloquée avec ce mot de passe, ou mot de passe invalide
    const dejaFait = CARTES.some(c => c.passwordHash === hash && debloquees.has(c.id));
    feedback.textContent = dejaFait ? "Cette carte est déjà révélée." : "Mot de passe incorrect.";
    feedback.className = "feedback err";
    entryInner.classList.remove("shake");
    void entryInner.offsetWidth; // force le reflow pour rejouer l'animation
    entryInner.classList.add("shake");
  }
}

btn.addEventListener("click", tenterDeverrouillage);
input.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){ tenterDeverrouillage(); }
});
document.getElementById("overlay-close").addEventListener("click", () => {
  document.getElementById("overlay").classList.remove("show");
});

/* ==========================================================================
   5. INITIALISATION
   ========================================================================== */
rendreGrille();
rendreProgression();
