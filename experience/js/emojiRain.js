function createEmojiRain() {
    for (let i = 0; i < 60; i++) {  // Nombre d'emoji générés
        const emoji = document.createElement("div");
        emoji.classList.add("emoji");
        emoji.textContent = "🌶️";  // Emoji piment

        // Position aléatoire en haut de l'écran
        emoji.style.left = Math.random() * window.innerWidth + "px";
        emoji.style.top = "-50px";

        // Taille et durée aléatoires
        const size = Math.random() * 20 + 20;
        emoji.style.fontSize = size + "px";
        emoji.style.animationDuration = Math.random() * 2 + 2 + "s";

        document.body.appendChild(emoji);

        // Supprimer l'emoji après l'animation
        setTimeout(() => {
            emoji.remove();
        }, 3000);
    }
}
