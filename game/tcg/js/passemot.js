/* ===========================================================================
   JEU PASS-CARD — LOGIQUE DU PROTOTYPE
   ---------------------------------------------------------------------------
   Les cartes, leurs indices et leurs propriétés éditables sont dans :
   json/cartes.json

   Chaque carte = { id, passwordHash, hints, title, image, description, rarity }
   - passwordHash : hash SHA-256 du mot de passe en minuscules, sans espaces.
   - hints : tableau d'indices ; le bouton Aide les fait défiler en boucle.
   - rarity : "Commun" | "Rare" | "Épique" | "Légendaire" | "Mythique"
   =========================================================================== */

const CARTES_URL = "json/cartes.json";
const STORAGE_KEY = "kinky_tcg_progress_v0.3.hints";
const HINTS_STORAGE_KEY = "kinky_tcg_hints_revealed";
const RARETES_AUTORISEES = new Set([
  "Commun",
  "Rare",
  "Épique",
  "Légendaire",
  "Mythique"
]);

let CARTES = [];
let debloquees = chargerProgression();
let indicesReveles = chargerIndicesReveles();

/* ===========================================================================
   UTILITAIRES
   =========================================================================== */

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
    const donnees = brut ? JSON.parse(brut) : {};
    return donnees && typeof donnees === "object" && !Array.isArray(donnees) ? donnees : {};
  }catch(e){
    return {};
  }
}

function sauverIndicesReveles(indicesObj){
  localStorage.setItem(HINTS_STORAGE_KEY, JSON.stringify(indicesObj));
}

function echapperHTML(valeur){
  return String(valeur ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[caractere]);
}

function echapperUrlCSS(url){
  return String(url ?? "").replace(/["\\\n\r]/g, "\\$&");
}

function validerCartes(donnees){
  if(!Array.isArray(donnees) || donnees.length === 0){
    throw new Error("Le fichier cartes.json doit contenir au moins une carte.");
  }

  const ids = new Set();

  return donnees.map((carte, index) => {
    const position = index + 1;

    if(!carte || typeof carte !== "object" || Array.isArray(carte)){
      throw new Error(`La carte n°${position} est invalide.`);
    }

    const id = Number(carte.id);
    if(!Number.isInteger(id) || id < 1 || ids.has(id)){
      throw new Error(`L'identifiant de la carte n°${position} doit être un entier unique.`);
    }
    ids.add(id);

    if(typeof carte.passwordHash !== "string" || !/^[a-f0-9]{64}$/i.test(carte.passwordHash)){
      throw new Error(`Le passwordHash de la carte n°${id} doit être un hash SHA-256 valide.`);
    }

    if(!Array.isArray(carte.hints) || carte.hints.length === 0 || carte.hints.some(indice => typeof indice !== "string" || !indice.trim())){
      throw new Error(`La carte n°${id} doit contenir au moins un indice valide dans « hints ».`);
    }

    for(const champ of ["title", "image", "description", "rarity"]){
      if(typeof carte[champ] !== "string" || !carte[champ].trim()){
        throw new Error(`Le champ « ${champ} » de la carte n°${id} est obligatoire.`);
      }
    }

    if(!RARETES_AUTORISEES.has(carte.rarity)){
      throw new Error(`La rareté de la carte n°${id} n'est pas reconnue.`);
    }

    return {
      id,
      passwordHash: carte.passwordHash.toLowerCase(),
      hints: carte.hints.map(indice => indice.trim()),
      title: carte.title,
      image: carte.image,
      description: carte.description,
      actions: typeof carte.actions === "string" ? carte.actions.trim() : "",
      rarity: carte.rarity
    };
  });
}

async function chargerCartes(){
  const reponse = await fetch(CARTES_URL, { cache: "no-store" });

  if(!reponse.ok){
    throw new Error(`Impossible de charger ${CARTES_URL} (${reponse.status}).`);
  }

  const donnees = await reponse.json();
  CARTES = validerCartes(donnees);
}

function nettoyerProgression(){
  const idsValides = new Set(CARTES.map(carte => carte.id));
  debloquees = new Set(
    [...debloquees]
      .map(Number)
      .filter(id => idsValides.has(id))
  );
  sauverProgression(debloquees);
}

function nettoyerIndicesReveles(){
  const cartesParId = new Map(CARTES.map(carte => [carte.id, carte]));
  const indicesNettoyes = {};

  for(const [idTexte, indice] of Object.entries(indicesReveles)){
    const carte = cartesParId.get(Number(idTexte));
    const indiceNombre = Number(indice);

    if(carte && Number.isInteger(indiceNombre) && indiceNombre >= 0){
      indicesNettoyes[carte.id] = indiceNombre % carte.hints.length;
    }
  }

  indicesReveles = indicesNettoyes;
  sauverIndicesReveles(indicesReveles);
}

function obtenirIndiceActuel(carteId){
  const indice = Number(indicesReveles[carteId]);
  return Number.isInteger(indice) && indice >= 0 ? indice : 0;
}

/* ===========================================================================
   ÉTAT & RENDU
   =========================================================================== */

function creerCarteHTML(carte){
  const estDebloquee = debloquees.has(carte.id);
  const holo = ["Épique", "Légendaire", "Mythique"].includes(carte.rarity) ? "holo" : "";
  const indiceActuel = obtenirIndiceActuel(carte.id);
  const texteIndice = carte.hints[indiceActuel] || carte.hints[0];
  const aPlusieursIndices = carte.hints.length > 1;

  return `
    <div class="card-slot">
      <div class="card ${estDebloquee ? "unlocked" : ""}" data-id="${carte.id}">
        <div class="face back">
          <div class="seal">✦</div>
          <div class="num">Carte n°${String(carte.id).padStart(2, "0")}</div>
          <div class="hint">${echapperHTML(texteIndice)}</div>
          ${aPlusieursIndices ? `<button class="hint-btn" type="button" data-card-id="${carte.id}">? Aide</button>` : ""}
        </div>
        <div class="face front ${holo}" data-rarity="${echapperHTML(carte.rarity)}">
          <div class="rarity-tag" data-r="${echapperHTML(carte.rarity)}">${echapperHTML(carte.rarity)}</div>
          <div class="art" style="background-image:url(&quot;${echapperHTML(echapperUrlCSS(carte.image))}&quot;)"></div>
          <div class="info">
            <p class="title">${echapperHTML(carte.title)}</p>
            <p class="desc">${echapperHTML(carte.description)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function rendreGrille(){
  const grid = document.getElementById("grid");
  grid.innerHTML = CARTES.map(creerCarteHTML).join("");

  document.querySelectorAll(".hint-btn").forEach(bouton => {
    bouton.addEventListener("click", evenement => {
      evenement.stopPropagation();
      afficherIndiceSupplementaire(Number(bouton.dataset.cardId));
    });
  });
}

function afficherIndiceSupplementaire(carteId){
  const carte = CARTES.find(element => element.id === carteId);
  if(!carte){ return; }

  const indiceActuel = obtenirIndiceActuel(carteId);
  // Boucle sur les indices : passe au suivant ou revient au premier.
  indicesReveles[carteId] = (indiceActuel + 1) % carte.hints.length;
  sauverIndicesReveles(indicesReveles);
  rendreGrille();
}

function rendreProgression(){
  const total = CARTES.length;
  const n = debloquees.size;
  document.getElementById("progress-label").textContent = `${n} / ${total}`;
  document.getElementById("progress-fill").style.width = `${total ? (n / total) * 100 : 0}%`;

  if(total > 0 && n === total){
    document.getElementById("overlay").classList.add("show");
  }
}

/* ===========================================================================
   LOGIQUE DE SAISIE DU MOT DE PASSE
   =========================================================================== */

const input = document.getElementById("pwd-input");
const btn = document.getElementById("submit-btn");
const entryInner = document.getElementById("entry-inner");
const feedback = document.getElementById("feedback");

async function tenterDeverrouillage(){
  if(!CARTES.length){ return; }

  const saisie = normaliser(input.value);
  if(!saisie){ return; }

  const hash = await sha256(saisie);
  const carteTrouvee = CARTES.find(carte => carte.passwordHash === hash && !debloquees.has(carte.id));

  if(carteTrouvee){
    debloquees.add(carteTrouvee.id);
    sauverProgression(debloquees);
    input.value = "";
    feedback.textContent = `✦ « ${carteTrouvee.title} » révélée !`;
    feedback.className = "feedback ok";

    rendreGrille();
    rendreProgression();

    // Préserve la notification du prototype lorsqu'elle est configurée.
    if(window.notifierDiscord){
      window.notifierDiscord(carteTrouvee, saisie);
    }

    // Relance l'animation de pop sur la carte concernée.
    requestAnimationFrame(() => {
      const element = document.querySelector(`.card[data-id="${carteTrouvee.id}"]`);
      if(element){
        element.classList.add("just-unlocked");
        setTimeout(() => element.classList.remove("just-unlocked"), 900);
      }
    });
  } else {
    // Carte déjà débloquée avec ce mot de passe, ou mot de passe invalide.
    const dejaFait = CARTES.some(carte => carte.passwordHash === hash && debloquees.has(carte.id));
    feedback.textContent = dejaFait ? "Cette carte est déjà révélée." : "Mot de passe incorrect.";
    feedback.className = "feedback err";
    entryInner.classList.remove("shake");
    void entryInner.offsetWidth; // Force le reflow pour rejouer l'animation.
    entryInner.classList.add("shake");
  }
}

btn.addEventListener("click", tenterDeverrouillage);
input.addEventListener("keydown", evenement => {
  if(evenement.key === "Enter"){
    tenterDeverrouillage();
  }
});
document.getElementById("overlay-close").addEventListener("click", () => {
  document.getElementById("overlay").classList.remove("show");
});

/* ===========================================================================
   INITIALISATION
   =========================================================================== */

async function initialiserJeu(){
  input.disabled = true;
  btn.disabled = true;
  feedback.textContent = "Chargement des cartes…";
  feedback.className = "feedback";

  try{
    await chargerCartes();
    nettoyerProgression();
    nettoyerIndicesReveles();
    rendreGrille();
    rendreProgression();
    input.disabled = false;
    btn.disabled = false;
    feedback.textContent = "";
  }catch(erreur){
    console.error("Erreur de chargement des cartes :", erreur);
    feedback.textContent = "Impossible de charger les cartes. Vérifie le fichier json/cartes.json.";
    feedback.className = "feedback err";
  }
}

initialiserJeu();
