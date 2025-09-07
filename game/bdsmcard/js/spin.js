const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const resultDiv = document.getElementById("resultat");

const options = [
    "Action Soft", "Vérité Soft", "Gage Soft", "Action Medium", "Vérité Medium",
    "Gage Medium", "Action Hard", "Vérité Hard", "Gage Hard", "Gage Extreme"
];

const categoryColors = {
    "Action Soft": "#FF5217",  
    "Vérité Soft": "#2B66D6",
    "Gage Soft": "#F54136",
    "Action Medium": "#FF5217",
    "Vérité Medium": "#2B66D6",
    "Gage Medium": "#F54136",
    "Action Hard": "#FF5217",
    "Vérité Hard": "#2B66D6",
    "Gage Hard": "#F54136",
    "Gage Extreme": "#ffca28"
};

let angleStep = (2 * Math.PI) / options.length;
let rotation = 0;
let spinning = false;

// 🛠️ Fonction pour dessiner la roue
function drawWheel() {
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(radius, radius);

    for (let i = 0; i < options.length; i++) {
        const startAngle = angleStep * i + rotation;
        const endAngle = startAngle + angleStep;

        ctx.beginPath();
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.lineTo(0, 0);
        
        ctx.fillStyle = categoryColors[options[i]] || "#CCCCCC"; // Appliquer couleur de la catégorie
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // 📝 Dessiner le texte dans chaque segment
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.translate(
            Math.cos(startAngle + angleStep / 2) * (radius * 0.70),
            Math.sin(startAngle + angleStep / 2) * (radius * 0.70)
        );
        ctx.rotate(startAngle + angleStep / 2);
        ctx.textAlign = "center";
        ctx.fillText(options[i], 0, 0);
        ctx.restore();
    }

    ctx.resetTransform();
}


// 🎡 Fonction pour animer la roue
function spinWheel() {
    if (spinning) return;
    spinning = true;

    let spins = Math.random() * 10 + 10; // Nombre de tours aléatoire
    let duration = 3000; // Durée de la rotation en millisecondes
    let start = null;

    function animateWheel(timestamp) {
        if (!start) start = timestamp;
        let progress = timestamp - start;
        let easing = 1 - Math.pow(1 - progress / duration, 3); // Effet d'accélération/décélération
        rotation = (spins * 2 * Math.PI * easing) % (2 * Math.PI);

        drawWheel();

        if (progress < duration) {
            requestAnimationFrame(animateWheel);
        } else {
            spinning = false;
            showResult();
        }
    }

    requestAnimationFrame(animateWheel);
}

// 🏆 Fonction pour afficher le résultat
function showResult() {
    let selectedIndex = Math.floor((options.length - (rotation / angleStep) % options.length) % options.length);
    resultDiv.innerText =  options[selectedIndex];
}

// 🏁 Initialisation
drawWheel();
startButton.addEventListener("click", spinWheel);
