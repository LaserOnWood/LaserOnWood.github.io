/* ==========================================================================
   1. DONNÉES DES CARTES
   --------------------------------------------------------------------------
   Chaque carte = { id, passwordHash, hint, title, image, description, rarity }
   - passwordHash : hash SHA-256 du mot de passe EN MINUSCULES et sans espaces.
   - rarity : "Commun" | "Rare" | "Épique" | "Légendaire"
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
    passwordHash: "9d0f44502d8625d3a501b4c7ef6e4db63c82de325376f0745ed6afc77383135b", // "robe"
    hint: "S'enfile par le haut, je glisse jusqu'aux genoux.",
    title: "La Seconde Peau",
    image: "https://picsum.photos/seed/carte1/500/700",
    description: "Tu doit porter la robe blanche uniquement. Pas de sous-vetement",
    rarity: "Commun"
  },
  {
    id: 2,
    passwordHash: "d5576a4173ccb613161c147eb0587d337f5bbaeaeea27fa5a6c4867e9e7d5941", // "pince"
    hint: "J’attrape, je serre, ou je tiens, mais je ne lâche rien.",
    title: "L'Accessoire",
    image: "https://boxcoquine.fr/25735-full_default/pinces-a-tetons-avec-chaine-noir.jpg",
    description: "Te voilà maintenant habillé ; il faut agrémenter le tout pour te mettre encore plus en valeur.",
    rarity: "Rare"
  },
  {
    id: 3,
    passwordHash: "35f1b751cd9c3bfb37c23cc1897ae1e458ecb57cce08e9fa095961487574bbde", // "trepied"
    hint: "J'ai 3 jambes sans marcher. Je fixe les meilleurs moments.",
    title: "La Stabilité",
    image: "https://asset.action.com/image/upload/t_digital_product_image/w_1080/3204383_8715342054872-110_01_fwjsff.webp",
    description: "Les mains seront prises, alors autant en profiter et poser les trépieds.",
    rarity: "Rare"
  },
  {
    id: 4,
    passwordHash: "671a18d627c58564a1868b3ccdbc98799b43ae9e9933b8d762d5915889341028", // "feutre"
    hint: "Je suis l'outil idéal pour écrire sur ta peau et écrire ce que tu es.",
    title: "Des Traces",
    image: "https://asset.action.com/image/upload/t_digital_product_image/w_1080/3222841_8712417372701-110_01_qqdgq3.webp",
    description: "Si tu en as le courage, laisse des trace de qui tu es, écrite sur toi.",
    rarity: "Épique"
  },
  {
    id: 5,
    passwordHash: "5a8a59d98881c1b312a83d7d939796c842d7604982a5cf8d5ddc6d9d6c5d833f", // "verre"
    hint: "Transparent comme tes intentions ce soir, je ne demande qu'à être rempli.",
    title: "L'Accueil",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8p522bvKXo7Vwb-QozSYHhnF3RHLBHiYe4WgPdgJXVw&s=10",
    description: "Dans l'entrée, il faut saluer tout le monde, même sa tige. Quelle belle raison de le sucer.",
    rarity: "Légendaire"
  },
  {
    id: 6,
    passwordHash:"d8bbd72947b36d2ca6c6f95d96e27f9de1595820483ab973cd43977e4dc0e3e1", // "gorge profonde"
    hint: "L'art de la pipe où l'on va jusqu'au bout, sans jamais utiliser les dents.",
    title: "L'Apné",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaXjLHduSLV84ofaNfb2HhCUoyyCk_mSb7Acwu4dGbtw&s=10",
    description: "Goûter un bout, c'est une chose, mais il faut tout prendre en bouche.",
    rarity: "Mythique"
  }
];

const STORAGE_KEY = "kinky_tcg_progress_v1";

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

/* ==========================================================================
   3. ÉTAT & RENDU
   ========================================================================== */
let debloquees = chargerProgression();

function iconeRarete(r){
  return { "Commun":"🔒", "Rare":"🔒", "Épique":"🔒", "Légendaire":"🔒" }[r] || "🔒";
}

function creerCarteHTML(carte){
  const estDebloquee = debloquees.has(carte.id);
  const holo = (carte.rarity === "Épique" || carte.rarity === "Légendaire") ? "holo" : "";

  return `
    <div class="card-slot">
      <div class="card ${estDebloquee ? 'unlocked' : ''}" data-id="${carte.id}">
        <div class="face back">
          <div class="seal">✦</div>
          <div class="num">Carte n°${String(carte.id).padStart(2,'0')}</div>
          ${carte.hint ? `<div class="hint">${carte.hint}</div>` : ''}
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

