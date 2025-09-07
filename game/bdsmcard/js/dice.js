// Récupérer les éléments HTML
const rollDiceButton = document.getElementById("rollDiceButton");
const diceResults = document.getElementById("diceResults");
const resultsList = document.getElementById("resultsList");
const diceSpinner = document.getElementById("diceSpinner");

// Fonction pour lancer un dé
function rollSingleDice(sides) {
  return Math.floor(Math.random() * sides) + 1; // Retourne un nombre aléatoire entre 1 et "sides"
}

// Fonction pour gérer le lancer des dés
function rollDice() {
  resultsList.innerHTML = ''; // Réinitialiser la liste des résultats
  diceResults.style.display = 'none'; // Cacher les résultats avant de lancer les dés

  // Afficher l'animation
  diceSpinner.style.display = 'block';

  // Vérifier les cases à cocher et lancer les dés correspondants
  const selectedDice = [];
  
  if (document.getElementById("dice6").checked) selectedDice.push(6);
  if (document.getElementById("dice10").checked) selectedDice.push(10);
  if (document.getElementById("dice20").checked) selectedDice.push(20);

  if (selectedDice.length === 0) {
    alert("Veuillez sélectionner au moins un dé !");
    diceSpinner.style.display = 'none'; // Cacher l'animation si aucun dé n'est sélectionné
    return;
  }

  // Après l'animation, on arrête et on affiche les résultats
  setTimeout(() => {
    selectedDice.forEach(sides => {
      const result = rollSingleDice(sides);
      const listItem = document.createElement("li");
      listItem.textContent = `Dé à ${sides} faces : ${result}`;
      resultsList.appendChild(listItem);
    });

    diceResults.style.display = 'block'; // Afficher les résultats
    diceSpinner.style.display = 'none'; // Cacher l'animation
  }, 2000); // L'animation dure 2 secondes
}

// Lancer les dés lorsque le bouton est cliqué
rollDiceButton.addEventListener("click", () => {
  rollDice();
});
