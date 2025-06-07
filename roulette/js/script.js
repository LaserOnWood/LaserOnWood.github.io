let gages = {};

    fetch('json/gages.json')
      .then(response => response.json())
      .then(data => {
        gages = data;
      })
      .catch(error => {
        console.error("Erreur lors du chargement des gages :", error);
      });

    const roulette = document.getElementById('roulette');

    // Génère des cases de type casino (37 cases pour roulette européenne)
    const numbers = Array.from({ length: 37 }, (_, i) => i);
    const colors = numbers.map(n => n === 0 ? 'green' : (n % 2 === 0 ? 'black' : 'red'));

    numbers.forEach((num, i) => {
      const el = document.createElement('div');
      el.className = 'number';
      el.style.transform = `rotate(${(360 / 37) * i}deg)`;
      el.style.background = colors[i];
      el.innerHTML = `<span style="display:block;transform:rotate(-${(360 / 37) * i}deg)">${num}</span>`;
      roulette.appendChild(el);
    });

    function spinRoulette() {
      const result = document.getElementById('result');
      const betType = document.getElementById('betType').value;
      const rotations = 5 + Math.random() * 5;
      const degrees = rotations * 360 + Math.floor(Math.random() * 360);
      roulette.style.transition = 'transform 3s ease-out';
      roulette.style.transform = `rotate(${degrees}deg)`;

      setTimeout(() => {
        if (!gages[betType] || gages[betType].length === 0) {
          result.textContent = "Aucun gage disponible pour ce type de mise.";
          return;
        }
        const selectedGages = gages[betType];
        const index = Math.floor(Math.random() * selectedGages.length);
        result.textContent = `Gage (${betType}) : ${selectedGages[index]}`;
      }, 3100);
    }
