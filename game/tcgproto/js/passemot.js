/* ===========================================================================
   JEU PASS-CARD — LOGIQUE DU PROTOTYPE (MODIFIÉ POUR LES THÈMES)
   =========================================================================== */

const CARTES_URL = "json/cartes.json";
const BASE_STORAGE_KEY = "kinky_tcg_progress_v0.2";
const BASE_HINTS_KEY = "kinky_tcg_hints_revealed";

const RARETES_AUTORISEES = new Set([
  "Commun",
  "Rare",
  "Épique",
  "Légendaire",
  "Mythique"
]);

let THEMES = [];
let CARTES = [];
let selectedThemeId = null;
let debloquees = new Set();
let indicesReveles = {};

/* ===========================================================================
   UTILITAIRES
   =========================================================================== */

async function sha256(message){
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function normaliser(texte){
  return texte.trim().toLowerCase();
}

function getStorageKey() {
  return `${BASE_STORAGE_KEY}_${selectedThemeId}`;
}

function getHintsKey() {
  return `${BASE_HINTS_KEY}_${selectedThemeId}`;
}

function chargerProgression(){
  try{
    const brut = localStorage.getItem(getStorageKey());
    return brut ? new Set(JSON.parse(brut)) : new Set();
  }catch(e){
    return new Set();
  }
}

function sauverProgression(setDebloquees){
  localStorage.setItem(getStorageKey(), JSON.stringify([...setDebloquees]));
}

function chargerIndicesReveles(){
  try{
    const brut = localStorage.getItem(getHintsKey());
    const donnees = brut ? JSON.parse(brut) : {};
    return donnees && typeof donnees === "object" && !Array.isArray(donnees) ? donnees : {};
  }catch(e){
    return {};
  }
}

function sauverIndicesReveles(indicesObj){
  localStorage.setItem(getHintsKey(), JSON.stringify(indicesObj));
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
  if(!Array.isArray(donnees) || donnees.length === 0) return [];
  const ids = new Set();
  return donnees.map((carte, index) => {
    const id = Number(carte.id);
    ids.add(id);
    return {
      id,
      passwordHash: carte.passwordHash.toLowerCase(),
      hints: (carte.hints || []).map(indice => indice.trim()),
      title: carte.title || "Sans titre",
      image: carte.image || "",
      description: carte.description || "",
      rarity: carte.rarity || "Commun"
    };
  });
}

async function chargerDonnees(){
  const reponse = await fetch(CARTES_URL, { cache: "no-store" });
  if(!reponse.ok) throw new Error(`Impossible de charger ${CARTES_URL}`);
  const data = await reponse.json();
  THEMES = data.themes || [];
  return THEMES;
}

/* ===========================================================================
   GESTION DES THÈMES
   =========================================================================== */

function afficherSelectionThemes() {
  const container = document.getElementById("themes-container");
  const selectionScreen = document.getElementById("selection-screen");
  const gameContent = document.getElementById("game-content");

  selectionScreen.classList.remove("hidden");
  gameContent.classList.add("hidden");

  container.innerHTML = THEMES.map(theme => `
    <div class="theme-card" onclick="choisirTheme('${theme.id}')">
      <h3>${echapperHTML(theme.name)}</h3>
      <p>${echapperHTML(theme.description)}</p>
      <div class="theme-info">
        <span class="diff-badge">${echapperHTML(theme.difficulty)}</span>
        <span class="card-count">${theme.cards.length} cartes</span>
      </div>
    </div>
  `).join("");
}

window.choisirTheme = function(themeId) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;

  selectedThemeId = themeId;
  CARTES = validerCartes(theme.cards);
  
  // Initialiser l'état pour ce thème
  debloquees = chargerProgression();
  indicesReveles = chargerIndicesReveles();
  
  document.getElementById("game-title").textContent = theme.name;
  document.getElementById("selection-screen").classList.add("hidden");
  document.getElementById("game-content").classList.remove("hidden");
  
  nettoyerProgression();
  nettoyerIndicesReveles();
  rendreGrille();
  rendreProgression();
  
  input.disabled = false;
  btn.disabled = false;
  feedback.textContent = "";
};

document.getElementById("back-to-selection").addEventListener("click", () => {
  afficherSelectionThemes();
});

/* ===========================================================================
   ÉTAT & RENDU
   =========================================================================== */

function nettoyerProgression(){
  const idsValides = new Set(CARTES.map(carte => carte.id));
  debloquees = new Set([...debloquees].map(Number).filter(id => idsValides.has(id)));
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
          ${aPlusieursIndices ? `<button class="hint-btn" type="button" onclick="event.stopPropagation(); afficherIndiceSupplementaire(${carte.id})">? Aide</button>` : ""}
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
}

window.afficherIndiceSupplementaire = function(carteId){
  const carte = CARTES.find(element => element.id === carteId);
  if(!carte){ return; }
  const indiceActuel = obtenirIndiceActuel(carteId);
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
    if(window.notifierDiscord) window.notifierDiscord(carteTrouvee, saisie);
    requestAnimationFrame(() => {
      const element = document.querySelector(`.card[data-id="${carteTrouvee.id}"]`);
      if(element){
        element.classList.add("just-unlocked");
        setTimeout(() => element.classList.remove("just-unlocked"), 900);
      }
    });
  } else {
    const dejaFait = CARTES.some(carte => carte.passwordHash === hash && debloquees.has(carte.id));
    feedback.textContent = dejaFait ? "Cette carte est déjà révélée." : "Mot de passe incorrect.";
    feedback.className = "feedback err";
    entryInner.classList.remove("shake");
    void entryInner.offsetWidth;
    entryInner.classList.add("shake");
  }
}

btn.addEventListener("click", tenterDeverrouillage);
input.addEventListener("keydown", evenement => {
  if(evenement.key === "Enter") tenterDeverrouillage();
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
  
  try{
    await chargerDonnees();
    afficherSelectionThemes();
  }catch(erreur){
    console.error("Erreur d'initialisation :", erreur);
    document.getElementById("themes-container").innerHTML = `
      <div class="alert alert-danger">
        Impossible de charger les données du jeu. Vérifiez le fichier json/cartes.json.
      </div>
    `;
  }
}

initialiserJeu();
