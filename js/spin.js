document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("wheelCanvas");
    const ctx = canvas.getContext("2d");
    const spinBtn = document.getElementById("spinBtn");
    const resultDiv = document.getElementById("resultat");
  
    const options = ["Action Soft", "Action Medium", "Action Hard", "Vérité Soft", "Vérité Medium", "Vérité Hard", "Gage Soft", "Gage Medium", "Gage Hard", "Gage Extreme"];
    const numOptions = options.length;
    const angleStep = Math.PI * 2 / numOptions;
  
    let rotation = 0;
    let spinning = false;
  
    // Fonction pour dessiner la roue
    function drawWheel() {
      const radius = canvas.width / 2;  // Rayon de la roue
      ctx.clearRect(0, 0, canvas.width, canvas.height);  // Effacer le canvas
  
      ctx.translate(radius, radius);  // Déplacer le centre de la roue au milieu du canvas
  
      // Dessiner les segments de la roue
      for (let i = 0; i < numOptions; i++) {
        const startAngle = angleStep * i + rotation;  // Calcul de l'angle de chaque segment
        const endAngle = startAngle + angleStep;
  
        ctx.beginPath();
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.lineTo(0, 0);
        ctx.fillStyle = i % 2 === 0 ? "#FFDD57" : "#FF7F50";  // Couleurs alternées
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
  
        // Dessiner le texte dans chaque segment
        ctx.save();
        ctx.rotate(startAngle + angleStep / 2);  // Rotation pour placer le texte au centre de chaque segment
        ctx.fillStyle = "#fff";
        ctx.font = "18px Arial";
        ctx.fillText(options[i], radius - 130, 10);
        ctx.restore();
      }
  
      // Dessiner le trait de la roue
      ctx.lineWidth = 0;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
  
      ctx.resetTransform();  // Réinitialiser la transformation du canvas
    }
  
    // Fonction pour faire tourner la roue
    function spinWheel() {
      if (spinning) return;  // Empêcher de tourner plusieurs fois
      spinning = true;
      const spinDuration = 5000;  // Durée de la rotation en millisecondes
      const maxRotation = Math.random() * 2000 + 3000;  // Rotation aléatoire
      const rotationSpeed = maxRotation / spinDuration;
  
      const startTime = Date.now();
      const initialRotation = rotation;
  
      function animate() {
        const elapsed = Date.now() - startTime;
        if (elapsed < spinDuration) {
          // Appliquer un effet de ralentissement (accélération puis décélération)
          const easedRotation = initialRotation + (Math.sin(elapsed / spinDuration * Math.PI) * maxRotation);
          rotation = easedRotation;
          drawWheel();
          requestAnimationFrame(animate);  // Continuer l'animation
        } else {
          spinning = false;
          rotation = initialRotation + maxRotation;
          drawWheel();
  
          // Trouver l'index du segment choisi
          const selectedIndex = Math.floor((rotation / (Math.PI * 2)) * numOptions) % numOptions;
  
          // Afficher le résultat
          resultDiv.innerText = options[selectedIndex];
        }
      }
  
      animate();  // Lancer l'animation de la roue
    }
  
    // Dessiner la roue au départ
    drawWheel();
  
    // Ajouter l'événement pour le bouton de rotation
    spinBtn.addEventListener("click", spinWheel);
  });
  