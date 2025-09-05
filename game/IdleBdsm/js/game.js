/**
 * BDSM Idle Clicker Game - Version Étendue
 * Système de progression avancé avec des centaines d'heures de contenu
 */
(function() {
    'use strict';

    // État du jeu étendu
    let gameState = {
        // Noms des phases et objectifs
        phaseNames: {
            1: "L'Éveil",
            2: "L'Exploration",
            3: "La Maîtrise",
            4: "L'Empire",
            5: "La Transcendance",
            6: "L'Infini"
        },
        phaseObjectives: {
            1: "1K Curiosité",
            2: "10K Curiosité",
            3: "100K Curiosité",
            4: "1M Curiosité",
            5: "10M Curiosité",
            6: "Infini"
        },

        // Ressources de base
        curiosity: 0,
        kinky: 0,
        curiosityPerSecond: 0,
        multiplier: 1,
        conversionRate: 100,
        extraClickBonus: 0,
        fetishBonus: false,
        kinkyPerSecond: 0,
        
        // Nouvelles ressources
        eleves: 0,
        elevesPerSecond: 0,
        innovations: 0,
        innovationsPerSecond: 0,
        profits: 0,
        profitsPerSecond: 0,
        territoires: 0,
        territoiresPerSecond: 0,
        diplomes: 0,
        diplomesPerSecond: 0,
        decouvertes: 0,
        decouvertesPerSecond: 0,
        dimensions: 0,
        dimensionsPerSecond: 0,
        ames: 0,
        amesPerSecond: 0,
        univers: 0,
        universPerSecond: 0,
        
        // Système de prestige
        prestigeLevel: 0,
        pointsCosmiques: 0,
        
        // Phase actuelle
        currentPhase: 1,
        
        // Événements
        lastEventTime: 0,
        activeEvents: [],
        
        // Collections
        artefacts: [],
        connaissances: [],
        essences: []
    };

    // Configuration des améliorations étendues
    const upgradesConfig = [
        // Phase 1 : L'Éveil (0-1000 Curiosité)
        { 
            name: "Lecture d'articles érotiques", 
            baseCost: 10, 
            baseCPS: 1, 
            kinkyGain: 0, 
            story: "Tu découvres des récits qui éveillent ton imagination...",
            phase: 1,
            unlockCondition: () => true
        },
        { 
            name: "Visionnage de contenu éducatif", 
            baseCost: 50, 
            baseCPS: 3, 
            kinkyGain: 0, 
            story: "Les vidéos éducatives révèlent des pratiques fascinantes...",
            phase: 1,
            unlockCondition: () => gameState.curiosity >= 25
        },
        { 
            name: "Forums et communautés", 
            baseCost: 100, 
            baseCPS: 5, 
            kinkyGain: 0.1, 
            story: "Tu rejoins des communautés où l'on partage expériences et conseils...",
            phase: 1,
            unlockCondition: () => gameState.curiosity >= 75
        },
        { 
            name: "Premier sextoy", 
            baseCost: 250, 
            baseCPS: 10, 
            kinkyGain: 0.5, 
            story: "Ton premier achat change ta perception du plaisir...",
            phase: 1,
            unlockCondition: () => gameState.curiosity >= 200
        },
        { 
            name: "Cours en ligne spécialisés", 
            baseCost: 500, 
            baseCPS: 20, 
            kinkyGain: 1, 
            story: "Des experts t'enseignent les bases de l'art du plaisir...",
            phase: 1,
            unlockCondition: () => gameState.curiosity >= 400
        },
        
        // Phase 2 : L'Exploration (1K-10K Curiosité)
        { 
            name: "Ateliers pratiques", 
            baseCost: 1000, 
            baseCPS: 50, 
            kinkyGain: 2, 
            story: "Des ateliers hands-on où théorie et pratique se rencontrent...",
            phase: 2,
            unlockCondition: () => gameState.curiosity >= 800
        },
        { 
            name: "Collection personnelle", 
            baseCost: 2500, 
            baseCPS: 100, 
            kinkyGain: 5, 
            story: "Tu commences à constituer ta propre collection d'objets de plaisir...",
            phase: 2,
            unlockCondition: () => gameState.curiosity >= 2000,
            specialEffect: () => gameState.multiplier *= 1.05
        },
        { 
            name: "Réseau de contacts", 
            baseCost: 5000, 
            baseCPS: 200, 
            kinkyGain: 10, 
            story: "Tes connexions s'étendent, ouvrant de nouvelles opportunités...",
            phase: 2,
            unlockCondition: () => gameState.curiosity >= 4000
        },
        { 
            name: "Espace privé aménagé", 
            baseCost: 10000, 
            baseCPS: 500, 
            kinkyGain: 25, 
            story: "Tu aménages un espace dédié à tes explorations personnelles...",
            phase: 2,
            unlockCondition: () => gameState.curiosity >= 8000,
            specialEffect: () => gameState.multiplier *= 1.1
        },
        
        // Phase 3 : La Maîtrise (10K-100K Curiosité)
        { 
            name: "École privée", 
            baseCost: 25000, 
            baseCPS: 1000, 
            kinkyGain: 50, 
            elevesGain: 1,
            story: "Tu ouvres ta propre école pour transmettre ton savoir...",
            phase: 3,
            unlockCondition: () => gameState.curiosity >= 20000 && hasSpecialUpgrade("Certification privée")
        },
        { 
            name: "Laboratoire de recherche", 
            baseCost: 50000, 
            baseCPS: 2000, 
            kinkyGain: 100, 
            innovationsGain: 1,
            story: "Un espace dédié à l'expérimentation et à l'innovation...",
            phase: 3,
            unlockCondition: () => gameState.curiosity >= 40000
        },
        { 
            name: "Empire commercial", 
            baseCost: 100000, 
            baseCPS: 5000, 
            kinkyGain: 250, 
            profitsGain: 1,
            story: "Tes connaissances deviennent une entreprise florissante...",
            phase: 3,
            unlockCondition: () => gameState.curiosity >= 80000
        },
        
        // Phase 4 : L'Empire (100K-1M Curiosité)
        { 
            name: "Chaîne internationale", 
            baseCost: 250000, 
            baseCPS: 10000, 
            kinkyGain: 500, 
            territoiresGain: 1,
            story: "Ton empire s'étend à travers les continents...",
            phase: 4,
            unlockCondition: () => getUpgradeLevel("Empire commercial") >= 5
        },
        { 
            name: "Université mondiale", 
            baseCost: 500000, 
            baseCPS: 25000, 
            kinkyGain: 1000, 
            diplomesGain: 1,
            story: "Une institution académique dédiée à l'art du plaisir...",
            phase: 4,
            unlockCondition: () => getUpgradeLevel("École privée") >= 10
        },
        { 
            name: "Centre de recherche quantique", 
            baseCost: 1000000, 
            baseCPS: 50000, 
            kinkyGain: 2500, 
            decouvertesGain: 1,
            story: "La science quantique révèle de nouveaux horizons du plaisir...",
            phase: 4,
            unlockCondition: () => getUpgradeLevel("Laboratoire de recherche") >= 15
        },
        
        // Phase 5 : La Transcendance (1M-10M Curiosité)
        { 
            name: "Portail dimensionnel", 
            baseCost: 2500000, 
            baseCPS: 100000, 
            kinkyGain: 5000, 
            dimensionsGain: 1,
            story: "Tu ouvres des portails vers des réalités alternatives...",
            phase: 5,
            unlockCondition: () => getUpgradeLevel("Centre de recherche quantique") >= 10
        },
        { 
            name: "Conscience collective", 
            baseCost: 5000000, 
            baseCPS: 250000, 
            kinkyGain: 12500, 
            amesGain: 1,
            story: "Les consciences se lient dans une symphonie de plaisir...",
            phase: 5,
            unlockCondition: () => getUpgradeLevel("Université mondiale") >= 15
        },
        { 
            name: "Réalité personnalisée", 
            baseCost: 10000000, 
            baseCPS: 500000, 
            kinkyGain: 25000, 
            story: "Tu façonnes la réalité selon tes désirs les plus profonds...",
            phase: 5,
            unlockCondition: () => hasSpecialUpgrade("Manipulation temporelle") && gameState.curiosity >= 8000000
        },
        
        // Phase 6 : L'Infini (10M+ Curiosité)
        { 
            name: "Générateur d'univers", 
            baseCost: 25000000, 
            baseCPS: 1000000, 
            kinkyGain: 50000, 
            universGain: 1,
            story: "Tu deviens créateur d'univers entiers...",
            phase: 6,
            unlockCondition: () => gameState.curiosity >= 25000000
        },
        { 
            name: "Conscience universelle", 
            baseCost: 50000000, 
            baseCPS: 2500000, 
            kinkyGain: 125000, 
            story: "Ta conscience fusionne avec l'univers lui-même...",
            phase: 6,
            unlockCondition: () => gameState.curiosity >= 50000000
        }
    ];

    // Configuration des améliorations spéciales étendues
    const specialsConfig = [
        // Niveau Débutant (1-10 Kinky)
        { 
            name: "Manuel du débutant", 
            cost: 1, 
            effect: () => { gameState.extraClickBonus += Math.floor(gameState.extraClickBonus * 0.1) + 1; }, 
            story: "Un guide complet qui démystifie les pratiques de base.",
            phase: 1
        },
        { 
            name: "Kit de démarrage", 
            cost: 3, 
            effect: () => { gameState.multiplier *= 1.25; }, 
            story: "Un ensemble d'accessoires essentiels pour débuter en sécurité.",
            phase: 1
        },
        { 
            name: "Abonnement premium", 
            cost: 5, 
            effect: () => { gameState.fetishBonus = true; }, 
            story: "L'accès VIP à du contenu exclusif et des communautés privées.",
            phase: 1
        },
        { 
            name: "Mentor virtuel", 
            cost: 8, 
            effect: () => { gameState.extraClickBonus += 2; }, 
            story: "Un guide expérimenté t'accompagne dans tes premiers pas.",
            phase: 1
        },
        
        // Niveau Intermédiaire (10-50 Kinky)
        { 
            name: "Spécialisation Dominance", 
            cost: 12, 
            effect: () => { gameState.dominanceBonus = true; }, 
            story: "Tu explores ton côté dominant avec assurance et technique.",
            phase: 2
        },
        { 
            name: "Spécialisation Soumission", 
            cost: 12, 
            effect: () => { gameState.soumissionBonus = true; }, 
            story: "Tu apprends l'art subtil de la soumission éclairée.",
            phase: 2
        },
        { 
            name: "Équipement professionnel", 
            cost: 20, 
            effect: () => { gameState.equipementPro = true; }, 
            story: "Du matériel de qualité professionnelle transforme tes sessions.",
            phase: 2
        },
        { 
            name: "Certification privée", 
            cost: 30, 
            effect: () => { 
                gameState.currentPhase = Math.max(gameState.currentPhase, 3);
                gameState.multiplier *= 1.25;
            }, 
            story: "Une reconnaissance officieuse de ton niveau d'expertise.",
            phase: 2
        },
        { 
            name: "Réseau exclusif", 
            cost: 45, 
            effect: () => { gameState.kinkyPerSecond += 3; }, 
            story: "L'accès à un cercle fermé d'initiés partageant tes passions.",
            phase: 2
        },
        
        // Niveau Avancé (50-200 Kinky)
        { 
            name: "Maître reconnu", 
            cost: 60, 
            effect: () => { 
                gameState.elevesMultiplier = (gameState.elevesMultiplier || 1) * 2;
                gameState.maitreReconnu = true;
            }, 
            story: "Ta réputation attire des disciples du monde entier.",
            phase: 3
        },
        { 
            name: "Laboratoire secret", 
            cost: 80, 
            effect: () => { 
                gameState.innovationsMultiplier = (gameState.innovationsMultiplier || 1) * 3;
                gameState.laboSecret = true;
            }, 
            story: "Un espace caché où tu pousses les limites de la connaissance.",
            phase: 3
        },
        { 
            name: "Réseau international", 
            cost: 120, 
            effect: () => { 
                gameState.profitsMultiplier = (gameState.profitsMultiplier || 1) * 6;
                gameState.reseauInternational = true;
            }, 
            story: "Tes connexions s'étendent aux quatre coins du globe.",
            phase: 3
        },
        { 
            name: "Technologie de pointe", 
            cost: 150, 
            effect: () => { 
                gameState.techPointe = true;
                gameState.multiplier *= 1.5;
            }, 
            story: "L'intégration de technologies avancées révolutionne tes pratiques.",
            phase: 3
        },
        { 
            name: "Influence médiatique", 
            cost: 180, 
            effect: () => { 
                gameState.kinkyPerSecond += 10;
                gameState.influenceMedia = true;
            }, 
            story: "Ton expertise est reconnue publiquement, attirant l'attention des médias.",
            phase: 3
        },
        
        // Niveau Empire (200-1000 Kinky)
        { 
            name: "Empereur du plaisir", 
            cost: 250, 
            effect: () => { 
                gameState.territoiresMultiplier = (gameState.territoiresMultiplier || 1) * 11;
                gameState.empereur = true;
            }, 
            story: "Ton règne s'étend sur un empire dédié au plaisir et à l'épanouissement.",
            phase: 4
        },
        { 
            name: "Technologie alien", 
            cost: 400, 
            effect: () => { 
                gameState.decouvertesMultiplier = (gameState.decouvertesMultiplier || 1) * 21;
                gameState.techAlien = true;
            }, 
            story: "Des technologies d'origine inconnue révolutionnent tes recherches.",
            phase: 4
        },
        { 
            name: "Réseau neuronal", 
            cost: 600, 
            effect: () => { 
                gameState.diplomesMultiplier = (gameState.diplomesMultiplier || 1) * 51;
                gameState.reseauNeuronal = true;
            }, 
            story: "Un réseau de conscience collective amplifie les capacités de tes disciples.",
            phase: 4
        },
        { 
            name: "Manipulation temporelle", 
            cost: 800, 
            effect: () => { 
                gameState.tempsMultiplier = (gameState.tempsMultiplier || 1) * 101;
                gameState.manipTemps = true;
            }, 
            story: "La maîtrise du temps accélère exponentiellement tes progrès.",
            phase: 4
        },
        
        // Niveau Transcendant (1000-5000 Kinky)
        { 
            name: "Dieu du plaisir", 
            cost: 1200, 
            effect: () => { 
                gameState.amesMultiplier = (gameState.amesMultiplier || 1) * 1001;
                gameState.dieuPlaisir = true;
            }, 
            story: "Tu atteins un statut divin, créateur de plaisirs inimaginables.",
            phase: 5
        },
        { 
            name: "Omniscience érotique", 
            cost: 2000, 
            effect: () => { 
                gameState.dimensionsMultiplier = (gameState.dimensionsMultiplier || 1) * 5001;
                gameState.omniscience = true;
            }, 
            story: "La connaissance absolue de tous les plaisirs possibles.",
            phase: 5
        },
        { 
            name: "Réalité infinie", 
            cost: 3500, 
            effect: () => { 
                gameState.multiplier *= 10001;
                gameState.realiteInfinie = true;
            }, 
            story: "Tu crées des univers entiers dédiés à l'exploration du plaisir.",
            phase: 5
        },
        
        // Niveau Cosmique (5000+ Kinky)
        { 
            name: "Créateur primordial", 
            cost: 5000, 
            effect: () => { 
                gameState.multiplier *= 100001;
                gameState.universPerSecond += 1;
                gameState.createurPrimordial = true;
            }, 
            story: "Tu deviens la source primordiale de tout plaisir dans l'existence.",
            phase: 6
        },
        { 
            name: "Infini absolu", 
            cost: 10000, 
            effect: () => { 
                gameState.infiniAbsolu = true;
                gameState.multiplier = Infinity;
            }, 
            story: "Tu transcendes toute limitation, devenant l'incarnation même du plaisir infini.",
            phase: 6
        }
    ];

    // Configuration des événements aléatoires
    const eventsConfig = [
        {
            name: "Découverte fortuite",
            probability: 0.05, // 5% par heure
            duration: 3600000, // 1 heure en ms
            effect: () => gameState.multiplier *= 6,
            endEffect: () => gameState.multiplier /= 6,
            message: "Une découverte fortuite multiplie ta curiosité par 6 pendant 1 heure !",
            phase: 1
        },
        {
            name: "Inspiration divine",
            probability: 0.02, // 2% par heure
            duration: 1800000, // 30 minutes en ms
            effect: () => gameState.kinkyPerSecond *= 11,
            endEffect: () => gameState.kinkyPerSecond /= 11,
            message: "Une inspiration divine multiplie ta génération de Kinky par 11 pendant 30 minutes !",
            phase: 2
        },
        {
            name: "Visiteur mystérieux",
            probability: 0.01, // 1% par jour
            duration: 0, // Effet permanent
            effect: () => {
                gameState.kinky += Math.floor(gameState.kinky * 0.1) + 10;
                gameState.artefacts.push({
                    name: "Artefact mystérieux",
                    effect: "+10% multiplicateur global",
                    value: 1.1
                });
                gameState.multiplier *= 1.1;
            },
            message: "Un visiteur mystérieux te laisse un artefact précieux !",
            phase: 3
        },
        {
            name: "Révélation cosmique",
            probability: 0.001, // 0.1% par jour
            duration: 7200000, // 2 heures en ms
            effect: () => {
                gameState.tempPhase = gameState.currentPhase;
                gameState.currentPhase = Math.min(gameState.currentPhase + 1, 6);
            },
            endEffect: () => {
                if (gameState.tempPhase) {
                    gameState.currentPhase = gameState.tempPhase;
                    delete gameState.tempPhase;
                }
            },
            message: "Une révélation cosmique débloque temporairement la phase suivante !",
            phase: 4
        }
    ];

    // État des améliorations
    let upgrades = [];
    let specials = [];

    // Éléments DOM
    const elements = {
        curiosity: null,
        kinky: null,
        cps: null,
        multiplier: null,
        narration: null,
        convertBtn: null,
        upgrades: null,
        specials: null,
        mainBtn: null,
        phase: null,
        resources: null,
        events: null,
        phaseIndicator: null,
        currentPhaseText: null,
        nextPhaseText: null,
        phaseObjective: null
    };

    /**
     * Fonctions utilitaires
     */
    function formatNumber(num) {
        if (num === Infinity) return "∞";
        if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
        if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
        if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
        return Math.floor(num).toString();
    }

    function getUpgradeLevel(name) {
        const upgrade = upgrades.find(u => u.name === name);
        return upgrade ? upgrade.level : 0;
    }

    function hasSpecialUpgrade(name) {
        const special = specials.find(s => s.name === name);
        return special ? special.bought : false;
    }

    /**
     * Initialise les éléments DOM
     */
    function initializeElements() {
        try {
            elements.curiosity = document.getElementById("curiosity");
            elements.kinky = document.getElementById("kinky");
            elements.cps = document.getElementById("cps");
            elements.multiplier = document.getElementById("multiplier");
            elements.narration = document.getElementById("narration");
            elements.convertBtn = document.getElementById("convertBtn");
            elements.upgrades = document.getElementById("upgrades");
            elements.specials = document.getElementById("specials");
            elements.phaseIndicator = document.getElementById("phaseIndicator");
            elements.currentPhaseText = document.getElementById("currentPhaseText");
            elements.nextPhaseText = document.getElementById("nextPhaseText");
            elements.phaseObjective = document.getElementById("phaseObjective");
            
            // Sélectionner le bouton principal
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.textContent.includes('Se documenter')) {
                    elements.mainBtn = btn;
                    break;
                }
            }

            console.log("Éléments DOM initialisés avec succès");
        } catch (error) {
            console.error("Erreur lors de l'initialisation des éléments DOM:", error);
        }
    }

    /**
     * Initialise les event listeners
     */
    function initializeEventListeners() {
        try {
            if (elements.mainBtn) {
                elements.mainBtn.addEventListener('click', gainCuriosity);
            }

            if (elements.convertBtn) {
                elements.convertBtn.addEventListener('click', convertCuriosity);
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation des event listeners:", error);
        }
    }

    /**
     * Initialise les données d'améliorations
     */
    function initializeUpgrades() {
        upgrades = upgradesConfig.map(config => ({
            ...config,
            cost: config.baseCost,
            level: 0
        }));

        specials = specialsConfig.map(config => ({
            ...config,
            bought: false
        }));
    }

    /**
     * Gagne de la curiosité en cliquant
     */
    function gainCuriosity() {
        try {
            const baseGain = 1 + gameState.extraClickBonus;
            const totalGain = Math.floor(baseGain * gameState.multiplier);
            gameState.curiosity += totalGain;

            // Chance critique de générer 1 kinky (5%)
            if (Math.random() < 0.05) {
                gameState.kinky++;
                showNarration("Moment critique ! Tu gagnes 1 kinky bonus !");
            }

            updateDisplay();
            renderUpgrades();
            renderSpecials();
            checkPhaseProgression();
            saveGame();
        } catch (error) {
            console.error("Erreur lors du gain de curiosité:", error);
        }
    }

    /**
     * Vérifie la progression de phase
     */
    function checkPhaseProgression() {
        const oldPhase = gameState.currentPhase;
        
        if (Math.floor(gameState.curiosity) >= 1000 && gameState.currentPhase < 2) {
            gameState.currentPhase = 2;
            showNarration("🎉 Phase 2 débloquée : L'Exploration ! De nouvelles améliorations sont disponibles.");
        } else if (Math.floor(gameState.curiosity) >= 10000 && gameState.currentPhase < 3) {
            gameState.currentPhase = 3;
            showNarration("🎉 Phase 3 débloquée : La Maîtrise ! Tu peux maintenant former des élèves.");
        } else if (Math.floor(gameState.curiosity) >= 100000 && gameState.currentPhase < 4) {
            gameState.currentPhase = 4;
            showNarration("🎉 Phase 4 débloquée : L'Empire ! Ton influence s'étend mondialement.");
        } else if (Math.floor(gameState.curiosity) >= 1000000 && gameState.currentPhase < 5) {
            gameState.currentPhase = 5;
            showNarration("🎉 Phase 5 débloquée : La Transcendance ! Tu accèdes aux dimensions supérieures.");
        } else if (Math.floor(gameState.curiosity) >= 10000000 && gameState.currentPhase < 6) {
            gameState.currentPhase = 6;
            showNarration("🎉 Phase 6 débloquée : L'Infini ! Tu deviens créateur d'univers.");
        }
        
        if (oldPhase !== gameState.currentPhase) {
            renderUpgrades();
            renderSpecials();
            console.log(`Phase mise à jour : ${oldPhase} -> ${gameState.currentPhase}. Curiosité: ${gameState.curiosity}`);
        }
    }

    /**
     * Achète une amélioration
     */
    function buyUpgrade(index) {
        try {
            const upgrade = upgrades[index];
            if (!upgrade || gameState.curiosity < upgrade.cost) {
                return;
            }

            gameState.curiosity -= upgrade.cost;
            upgrade.level++;
            gameState.curiosityPerSecond += upgrade.baseCPS;

            // Gains de ressources spécialisées
            if (upgrade.kinkyGain) gameState.kinky += upgrade.kinkyGain;
            if (upgrade.elevesGain) gameState.elevesPerSecond += upgrade.elevesGain;
            if (upgrade.innovationsGain) gameState.innovationsPerSecond += upgrade.innovationsGain;
            if (upgrade.profitsGain) gameState.profitsPerSecond += upgrade.profitsGain;
            if (upgrade.territoiresGain) gameState.territoiresPerSecond += upgrade.territoiresGain;
            if (upgrade.diplomesGain) gameState.diplomesPerSecond += upgrade.diplomesGain;
            if (upgrade.decouvertesGain) gameState.decouvertesPerSecond += upgrade.decouvertesGain;
            if (upgrade.dimensionsGain) gameState.dimensionsPerSecond += upgrade.dimensionsGain;
            if (upgrade.amesGain) gameState.amesPerSecond += upgrade.amesGain;
            if (upgrade.universGain) gameState.universPerSecond += upgrade.universGain;

            // Effets spéciaux
            if (upgrade.specialEffect) {
                upgrade.specialEffect();
            }

            // Bonus de la collection fétiche
            if (gameState.fetishBonus) {
                gameState.kinky += 1;
            }

            // Calcul du nouveau coût
            const costMultiplier = 1.15 + (upgrade.phase - 1) * 0.05;
            upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(costMultiplier, upgrade.level));

            showNarration(`${upgrade.story} (Niveau ${upgrade.level})`);
            updateDisplay();
            renderUpgrades();
            renderSpecials();
            saveGame();
        } catch (error) {
            console.error("Erreur lors de l'achat d'amélioration:", error);
        }
    }

    /**
     * Achète une amélioration spéciale
     */
    function buySpecial(index) {
        try {
            const special = specials[index];
            if (!special || gameState.kinky < special.cost || special.bought) {
                return;
            }

            gameState.kinky -= special.cost;
            special.effect();
            special.bought = true;

            showNarration(special.story);
            updateDisplay();
            renderUpgrades();
            renderSpecials();
            saveGame();
        } catch (error) {
            console.error("Erreur lors de l'achat d'amélioration spéciale:", error);
        }
    }

    /**
     * Convertit la curiosité en kinky
     */
    function convertCuriosity() {
        try {
            if (gameState.curiosity >= gameState.conversionRate) {
                gameState.curiosity -= gameState.conversionRate;
                gameState.kinky += 1;
                showNarration("Conversion réussie ! Tu gagnes 1 kinky.");
                updateDisplay();
                renderSpecials();
                saveGame();
            }
        } catch (error) {
            console.error("Erreur lors de la conversion:", error);
        }
    }

    /**
     * Met à jour l'affichage
     */
    function updateDisplay() {
        try {
            if (elements.curiosity) elements.curiosity.textContent = formatNumber(gameState.curiosity);
            if (elements.kinky) elements.kinky.textContent = formatNumber(gameState.kinky);
            if (elements.cps) elements.cps.textContent = formatNumber(gameState.curiosityPerSecond);
            if (elements.multiplier) elements.multiplier.textContent = gameState.multiplier === Infinity ? "∞" : gameState.multiplier.toFixed(2);

            if (elements.convertBtn) {
                elements.convertBtn.disabled = gameState.curiosity < gameState.conversionRate;
            }

            // Mise à jour des ressources avancées
            updateAdvancedResources();

            // Mise à jour de l'affichage de la phase
            if (elements.phaseIndicator) {
                elements.phaseIndicator.textContent = `Phase ${gameState.currentPhase}: ${gameState.phaseNames[gameState.currentPhase]}`;
            }
            if (elements.currentPhaseText) {
                elements.currentPhaseText.textContent = `Phase ${gameState.currentPhase}: ${gameState.phaseNames[gameState.currentPhase]}`;
            }
            if (elements.nextPhaseText) {
                const nextPhase = gameState.currentPhase + 1;
                if (gameState.phaseNames[nextPhase]) {
                    elements.nextPhaseText.textContent = `Phase ${nextPhase}: ${gameState.phaseNames[nextPhase]}`;
                } else {
                    elements.nextPhaseText.textContent = "Fin du jeu";
                }
            }
            if (elements.phaseObjective) {
                elements.phaseObjective.textContent = gameState.phaseObjectives[gameState.currentPhase];
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'affichage:", error);
        }
    }

    /**
     * Met à jour l'affichage des ressources avancées
     */
    function updateAdvancedResources() {
        // Cette fonction sera étendue pour afficher toutes les nouvelles ressources
        // dans une interface plus complexe
    }

    /**
     * Affiche les améliorations disponibles
     */
    function renderUpgrades() {
        try {
            if (!elements.upgrades) return;

            elements.upgrades.innerHTML = "";

            upgrades.forEach((upgrade, index) => {
                // Vérifier les conditions de déblocage
                if (upgrade.phase > gameState.currentPhase || !upgrade.unlockCondition()) {
                    return;
                }

                // Afficher si déjà acheté OU si assez de curiosité pour acheter
                if (upgrade.level > 0 || gameState.curiosity >= upgrade.cost * 0.5) {
                    const isDisabled = gameState.curiosity < upgrade.cost;
                    const buttonClass = isDisabled ? "btn btn-outline-primary disabled" : "btn btn-primary";
                    
                    const upgradeDiv = document.createElement("div");
                    upgradeDiv.className = "upgrade";
                    
                    const button = document.createElement("button");
                    button.className = buttonClass;
                    button.disabled = isDisabled;
                    
                    let effectText = `+${upgrade.baseCPS} CPS`;
                    if (upgrade.kinkyGain) effectText += `, +${upgrade.kinkyGain} Kinky`;
                    if (upgrade.elevesGain) effectText += `, +${upgrade.elevesGain} Élèves/sec`;
                    if (upgrade.innovationsGain) effectText += `, +${upgrade.innovationsGain} Innovations/sec`;
                    
                    button.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="text-start">
                                <div class="fw-bold">${upgrade.name}</div>
                                <small class="text-muted">Niveau ${upgrade.level} • ${effectText}</small>
                            </div>
                            <div class="text-end">
                                <div class="fw-bold">${formatNumber(upgrade.cost)}</div>
                                <small class="text-muted">curiosité</small>
                            </div>
                        </div>
                    `;
                    
                    button.addEventListener('click', () => buyUpgrade(index));
                    upgradeDiv.appendChild(button);
                    elements.upgrades.appendChild(upgradeDiv);
                }
            });
        } catch (error) {
            console.error("Erreur lors du rendu des améliorations:", error);
        }
    }

    /**
     * Affiche les améliorations spéciales disponibles
     */
    function renderSpecials() {
        try {
            if (!elements.specials) return;

            elements.specials.innerHTML = "";

            specials.forEach((special, index) => {
                // Vérifier les conditions de phase
                if (special.phase > gameState.currentPhase) {
                    return;
                }

                // Afficher seulement si pas encore acheté et assez de kinky
                if (!special.bought && gameState.kinky >= Math.max(1, special.cost * 0.5)) {
                    const isDisabled = gameState.kinky < special.cost;
                    const buttonClass = isDisabled ? "btn btn-outline-danger disabled" : "btn btn-danger";
                    
                    const specialDiv = document.createElement("div");
                    specialDiv.className = "special";
                    
                    const button = document.createElement("button");
                    button.className = buttonClass;
                    button.disabled = isDisabled;
                    button.innerHTML = `
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="text-start">
                                <div class="fw-bold">${special.name}</div>
                                <small class="text-muted">Phase ${special.phase} • Amélioration unique</small>
                            </div>
                            <div class="text-end">
                                <div class="fw-bold">${formatNumber(special.cost)}</div>
                                <small class="text-muted">kinky</small>
                            </div>
                        </div>
                    `;
                    
                    button.addEventListener('click', () => buySpecial(index));
                    specialDiv.appendChild(button);
                    elements.specials.appendChild(specialDiv);
                }
            });
        } catch (error) {
            console.error("Erreur lors du rendu des améliorations spéciales:", error);
        }
    }

    /**
     * Gère les événements aléatoires
     */
    function processRandomEvents() {
        try {
            const now = Date.now();
            
            // Vérifier les événements actifs
            gameState.activeEvents = gameState.activeEvents.filter(event => {
                if (now >= event.endTime) {
                    if (event.endEffect) {
                        event.endEffect();
                    }
                    showNarration(`L'effet "${event.name}" se termine.`);
                    return false;
                }
                return true;
            });

            // Générer de nouveaux événements
            eventsConfig.forEach(eventConfig => {
                if (eventConfig.phase <= gameState.currentPhase) {
                    const timeSinceLastCheck = now - (gameState.lastEventTime || now);
                    const hoursPassed = timeSinceLastCheck / 3600000; // Convertir en heures
                    
                    if (Math.random() < eventConfig.probability * hoursPassed) {
                        // Déclencher l'événement
                        eventConfig.effect();
                        showNarration(eventConfig.message);
                        
                        if (eventConfig.duration > 0) {
                            gameState.activeEvents.push({
                                name: eventConfig.name,
                                endTime: now + eventConfig.duration,
                                endEffect: eventConfig.endEffect
                            });
                        }
                    }
                }
            });
            
            gameState.lastEventTime = now;
        } catch (error) {
            console.error("Erreur lors du traitement des événements:", error);
        }
    }

    /**
     * Affiche un message de narration
     */
    function showNarration(text) {
        try {
            if (elements.narration) {
                elements.narration.textContent = text;
                
                // Animation de mise en évidence
                elements.narration.style.transform = "scale(1.05)";
                elements.narration.style.transition = "transform 0.3s ease";
                
                setTimeout(() => {
                    elements.narration.style.transform = "scale(1)";
                }, 300);
            }
        } catch (error) {
            console.error("Erreur lors de l'affichage de la narration:", error);
        }
    }

    /**
     * Sauvegarde le jeu
     */
    function saveGame() {
        try {
            if (typeof Storage === "undefined") {
                console.warn("localStorage non disponible");
                return;
            }

            const saveData = {
                gameState,
                upgrades,
                specials,
                timestamp: Date.now()
            };

            localStorage.setItem("bdsmClickerExtendedSave", JSON.stringify(saveData));
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
        }
    }

    /**
     * Charge le jeu
     */
    function loadGame() {
        try {
            if (typeof Storage === "undefined") {
                console.warn("localStorage non disponible");
                return;
            }

            const saveData = localStorage.getItem("bdsmClickerExtendedSave");
            if (!saveData) return;

            const parsed = JSON.parse(saveData);
            
            // Restaurer l'état du jeu
            if (parsed.gameState) {
                gameState = { ...gameState, ...parsed.gameState };
            }

            // Restaurer les améliorations
            if (parsed.upgrades && Array.isArray(parsed.upgrades)) {
                parsed.upgrades.forEach((savedUpgrade, index) => {
                    if (upgrades[index]) {
                        upgrades[index] = { ...upgrades[index], ...savedUpgrade };
                    }
                });
            }

            // Restaurer les améliorations spéciales
            if (parsed.specials && Array.isArray(parsed.specials)) {
                parsed.specials.forEach((savedSpecial, index) => {
                    if (specials[index]) {
                        specials[index] = { ...specials[index], ...savedSpecial };
                    }
                });
            }

            console.log("Jeu chargé avec succès");
        } catch (error) {
            console.error("Erreur lors du chargement:", error);
        }
    }

    /**
     * Boucle de jeu principale
     */
    function gameLoop() {
        try {
            const timeMultiplier = (gameState.tempsMultiplier || 1);
            
            // Gain automatique de curiosité
            if (gameState.curiosityPerSecond > 0) {
                gameState.curiosity += (gameState.curiosityPerSecond * gameState.multiplier * timeMultiplier) / 10;
            }

            // Gain automatique de kinky
            if (gameState.kinkyPerSecond > 0) {
                gameState.kinky += (gameState.kinkyPerSecond * timeMultiplier) / 10;
            }

            // Gains des nouvelles ressources
            if (gameState.elevesPerSecond > 0) {
                gameState.eleves += (gameState.elevesPerSecond * (gameState.elevesMultiplier || 1) * timeMultiplier) / 10;
            }
            
            if (gameState.innovationsPerSecond > 0) {
                gameState.innovations += (gameState.innovationsPerSecond * (gameState.innovationsMultiplier || 1) * timeMultiplier) / 10;
            }
            
            if (gameState.profitsPerSecond > 0) {
                gameState.profits += (gameState.profitsPerSecond * (gameState.profitsMultiplier || 1) * timeMultiplier) / 10;
            }
            
            if (gameState.territoiresPerSecond > 0) {
                gameState.territoires += (gameState.territoiresPerSecond * (gameState.territoiresMultiplier || 1) * timeMultiplier) / 10;
            }
            
            if (gameState.diplomesPerSecond > 0) {
                gameState.diplomes += (gameState.diplomesPerSecond * (gameState.diplomesMultiplier || 1) * timeMultiplier) / 10;
            }
            
            if (gameState.decouvertesPerSecond > 0) {
                gameState.decouvertes += (gameState.decouvertesPerSecond * (gameState.decouvertesMultiplier || 1) * timeMultiplier) / 10;
            }
            
            if (gameState.dimensionsPerSecond > 0) {
                gameState.dimensions += (gameState.dimensionsPerSecond * (gameState.dimensionsMultiplier || 1) * timeMultiplier) / 10;
            }
            
            if (gameState.amesPerSecond > 0) {
                gameState.ames += (gameState.amesPerSecond * (gameState.amesMultiplier || 1) * timeMultiplier) / 10;
            }
            
            if (gameState.universPerSecond > 0) {
                gameState.univers += (gameState.universPerSecond * timeMultiplier) / 10;
            }

            updateDisplay();
            checkPhaseProgression();
        } catch (error) {
            console.error("Erreur dans la boucle de jeu:", error);
        }
    }

    /**
     * Initialise le jeu
     */
    function initializeGame() {
        try {
            initializeElements();
            initializeEventListeners();
            initializeUpgrades();
            loadGame();
            updateDisplay();
            renderUpgrades();
            renderSpecials();

            // Démarrer la boucle de jeu (100ms pour plus de fluidité)
            setInterval(gameLoop, 100);
            
            // Traitement des événements toutes les 10 secondes
            setInterval(processRandomEvents, 10000);
            
            // Sauvegarder toutes les 5 secondes
            setInterval(saveGame, 5000);

            console.log("Jeu étendu initialisé avec succès");
        } catch (error) {
            console.error("Erreur lors de l'initialisation du jeu:", error);
        }
    }

    // Exposer les fonctions nécessaires au global scope
    window.gameActions = {
        gainCuriosity,
        buyUpgrade,
        buySpecial,
        convertCuriosity,
        gameState: () => gameState,
        formatNumber
    };

    // Initialiser le jeu quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }

})();

