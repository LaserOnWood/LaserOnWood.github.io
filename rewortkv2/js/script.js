let players = [];
        let currentPlayer = 0;
        let lastChallengeType = '';

        const challenges = {
            action: {
                soft: [
                    "Fais 5 pompes en comptant à voix haute",
                    "Imite ton animal préféré pendant 20 secondes",
                    "Chante 'Joyeux anniversaire' avec un accent rigolo",
                    "Fais le tour de la pièce en sautillant",
                    "Raconte une blague que tu connais",
                    "Fais une grimace pendant 10 secondes",
                    "Danse pendant 30 secondes sur une chanson imaginaire",
                    "Imite quelqu'un du groupe (gentiment)",
                    "Fais semblant d'être un robot pendant 1 minute",
                    "Mange quelque chose les yeux fermés"
                ],
                moyen: [
                    "Fais 10 pompes en chantant ton générique de série préféré",
                    "Imite un animal pendant 30 secondes sans faire de bruit",
                    "Danse sur une chanson choisie par les autres joueurs",
                    "Mange quelque chose de salé et de sucré en même temps",
                    "Fais le tour de la pièce en marchant comme un crabe",
                    "Dessine un portrait de quelqu'un dans le groupe avec les yeux fermés",
                    "Parle avec un accent étranger pendant 2 tours",
                    "Fais une déclaration d'amour à un objet dans la pièce",
                    "Imite 3 célébrités différentes",
                    "Mange une cuillère de quelque chose de bizarre (mais comestible)"
                ],
                hot: [
                    "Fais un massage des épaules à la personne à ta droite pendant 1 minute",
                    "Raconte ton rêve le plus bizarre en détail",
                    "Danse de façon sensuelle sur une chanson",
                    "Fais un strip-tease jusqu'au t-shirt (garde tes vêtements !)",
                    "Embrasse la main de chaque personne du groupe",
                    "Fais semblant de draguer quelqu'un du groupe",
                    "Raconte ton pire rendez-vous galant",
                    "Fais des exercices suggestifs pendant 30 secondes",
                    "Lèche quelque chose d'étrange mais comestible",
                    "Fais un lap dance sur une chaise pendant 20 secondes"
                ],
                pervers: [
                    "Décris ton fantasme le plus fou sans nommer de personnes présentes",
                    "Fais semblant d'avoir un orgasme en mangeant quelque chose",
                    "Raconte ta première fois de façon détaillée",
                    "Embrasse passionnément le dos de ta main pendant 10 secondes",
                    "Décris la position que tu préfères et pourquoi",
                    "Raconte ton expérience la plus hot",
                    "Fais des bruits suggestifs pendant 20 secondes",
                    "Décris ce qui t'excite le plus chez ton/ta partenaire idéal(e)",
                    "Raconte ton rêve érotique le plus mémorable",
                    "Fais semblant de séduire quelqu'un au téléphone"
                ]
            },
            verite: {
                soft: [
                    "Quel est ton plat préféré ?",
                    "Quelle est ta couleur favorite ?",
                    "As-tu déjà cassé quelque chose et accusé quelqu'un d'autre ?",
                    "Quel est ton film d'enfance préféré ?",
                    "As-tu déjà menti sur ton âge ?",
                    "Quelle est ta plus grande peur ?",
                    "Quel est ton souvenir d'enfance le plus drôle ?",
                    "As-tu déjà chanté sous la douche ?",
                    "Quel est ton rêve le plus bizarre ?",
                    "Quelle est la chose la plus mignonne que tu aies vue ?"
                ],
                moyen: [
                    "Quelle est la chose la plus embarrassante qui te soit arrivée en public ?",
                    "Quel est ton plus grand secret que personne ne connaît ?",
                    "As-tu déjà menti à tes parents ? À propos de quoi ?",
                    "Quel est ton plus gros regret ?",
                    "As-tu déjà triché à un examen ou un test ?",
                    "Quelle est la chose la plus bizarre que tu aies mangée ?",
                    "As-tu déjà eu le béguin pour l'ami(e) de quelqu'un d'autre ?",
                    "Quelle est la chose la plus stupide que tu aies faite par amour ?",
                    "As-tu déjà volé quelque chose ? Quoi ?",
                    "Si tu pouvais effacer quelque chose de ton passé, ce serait quoi ?"
                ],
                hot: [
                    "Décris ton type d'homme/femme idéal physiquement",
                    "Quel âge avais-tu lors de ton premier baiser ?",
                    "As-tu déjà eu un coup d'un soir ?",
                    "Quelle est la partie du corps que tu préfères chez ton/ta partenaire ?",
                    "As-tu déjà fantasmé sur quelqu'un de ce groupe ?",
                    "Quelle est ta zone érogène préférée ?",
                    "As-tu déjà fait l'amour dans un lieu public ?",
                    "Combien de partenaires as-tu eu ?",
                    "As-tu déjà simulé un orgasme ?",
                    "Quelle est ta position préférée ?"
                ],
                pervers: [
                    "Décris ton fantasme sexuel le plus fou en détail",
                    "As-tu déjà eu des relations avec plus d'une personne en même temps ?",
                    "Quel est l'endroit le plus bizarre où tu aies fait l'amour ?",
                    "As-tu déjà utilisé des jouets intimes ? Lesquels ?",
                    "Quelle est la chose la plus perverse que tu aies faite au lit ?",
                    "As-tu déjà regardé du porno avec ton/ta partenaire ?",
                    "As-tu déjà eu une relation avec quelqu'un de beaucoup plus âgé/jeune ?",
                    "Quelle est ta technique de séduction préférée ?",
                    "As-tu déjà eu des pensées pour quelqu'un du même sexe ?",
                    "Raconte ton expérience sexuelle la plus intense"
                ]
            }
        };

        function addPlayer() {
            const input = document.getElementById('playerInput');
            const playerName = input.value.trim();
            
            if (playerName && !players.includes(playerName)) {
                players.push(playerName);
                updatePlayersList();
                input.value = '';
            }
        }

        function updatePlayersList() {
            const playersList = document.getElementById('playersList');
            playersList.innerHTML = players.map(player => 
                `<span class="player-tag">${player}</span>`
            ).join('');
        }

        function getChallenge(type) {
            if (players.length === 0) {
                alert('Ajoutez au moins un joueur pour commencer !');
                return;
            }

            const challengeContainer = document.getElementById('challengeContainer');
            const newChallengeBtn = document.getElementById('newChallengeBtn');
            const difficulty = document.getElementById('difficultySelect').value;
            
            challengeContainer.classList.remove('show');
            
            setTimeout(() => {
                const currentPlayerName = players[currentPlayer];
                const challengeArray = challenges[type][difficulty];
                const challenge = challengeArray[Math.floor(Math.random() * challengeArray.length)];

                challengeContainer.innerHTML = `
                    <div>
                        <div class="challenge-type ${type}">
                            ${type.toUpperCase()} - ${difficulty.toUpperCase()}
                        </div>
                        <div class="challenge-text">
                            <strong>${currentPlayerName}</strong><br><br>
                            ${challenge}
                        </div>
                    </div>
                `;
                
                challengeContainer.classList.add('show');
                newChallengeBtn.style.display = 'block';
                
                lastChallengeType = type;
                currentPlayer = (currentPlayer + 1) % players.length;
            }, 300);
        }

        function newChallenge() {
            getChallenge(lastChallengeType);
        }

        // Permettre d'ajouter un joueur en appuyant sur Entrée
        document.getElementById('playerInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addPlayer();
            }
        });

        // Animation de pulsation pour le titre
        document.querySelector('h1').classList.add('pulse');