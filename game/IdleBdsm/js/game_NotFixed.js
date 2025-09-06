/**
 * BDSM Idle Clicker Game - Version Étendue et Corrigée
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
        
        // Multiplicateurs initialisés
        elevesMultiplier: 1,
        innovationsMultiplier: 1,
        profitsMultiplier: 1,
        territoiresMultiplier: 1,
        diplomesMultiplier: 1,
        decouvertesMultiplier: 1,
        dimensionsMultiplier: 1,
        amesMultiplier: 1,
        tempsMultiplier: 1,
        
        // Système de prestige
        prestigeLevel: 0,
        pointsCosmiques: 0,
        prestigeUnlocked: false,
        
        // Phase actuelle
        currentPhase: 1,
        
        // Événements
        lastEventTime: Date.now(),
        activeEvents: [],
        
        // Collections
        artefacts: [],
        connaissances: [],
        essences: [],
        
        // Flags spéciaux
        dominanceBonus: false,
        soumissionBonus: false,
        equipementPro: false,
        maitreReconnu: false,
        laboSecret: false,
        reseauInternational: false,
        techPointe: false,
        influenceMedia: false,
        empereur: false,
        techAlien: false,
        reseauNeuronal: false,
        manipTemps: false,
        dieuPlaisir: false,
        omniscience: false,
        realiteInfinie: false,
        createurPrimordial: false,
        infiniAbsolu: false
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
                gameState.elevesMultiplier *= 2;
                gameState.maitreReconnu = true;
            }, 
            story: "Ta réputation attire des disciples du monde entier.",
            phase: 3
        },
        { 
            name: "Laboratoire secret", 
            cost: 80, 
            effect: () => { 
                gameState.innovationsMultiplier *= 3;
                gameState.laboSecret = true;
            }, 
            story: "Un espace caché où tu pousses les limites de la connaissance.",
            phase: 3
        },
        { 
            name: "Réseau international", 
            cost: 120, 
            effect: () => { 
                gameState.profitsMultiplier *= 6;
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
                gameState.territoiresMultiplier *= 11;
                gameState.empereur = true;
            }, 
            story: "Ton règne s'étend sur un empire dédié au plaisir et à l'épanouissement.",
            phase: 4
        },
        { 
            name: "Technologie alien", 
            cost: 400, 
            effect: () => { 
                gameState.decouvertesMultiplier *= 21;
                gameState.techAlien = true;
            }, 
            story: "Des technologies d'origine inconnue révolutionnent tes recherches.",
            phase: 4
        },
        { 
            name: "Réseau neuronal", 
            cost: 600, 
            effect: () => { 
                gameState.diplomesMultiplier *= 51;
                gameState.reseauNeuronal = true;
            }, 
            story: "Un réseau de conscience collective amplifie les capacités de tes disciples.",
            phase: 4
        },
        { 
            name: "Manipulation temporelle", 
            cost: 800, 
            effect: () => { 
                gameState.tempsMultiplier *= 101;
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
                gameState.amesMultiplier *= 1001;
                gameState.dieuPlaisir = true;
                unlockPrestige();
            }, 
            story: "Tu atteins un statut divin, créateur de plaisirs inimaginables.",
            phase: 5
        },
        { 
            name: "Omniscience érotique", 
            cost: 2000, 
            effect: () => { 
                gameState.dimensionsMultiplier *= 5001;
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
                gameState.multiplier = Number.MAX_SAFE_INTEGER;
            }, 
            story: "Tu transcendes toute limitation, devenant l'incarnation même du plaisir infini.",
            phase: 6
        }
    ];

    // Configuration des événements aléatoires
    const eventsConfig = [
        {
            name: "Découverte fortuite",
            probability: 0.05,
            duration: 3600000,
            effect: () => {
                gameState.eventMultiplier = (gameState.eventMultiplier || 1) * 6;
                gameState.multiplier *= 6;
            },
            endEffect: () => {
                gameState.multiplier /= 6;
                gameState.eventMultiplier = (gameState.eventMultiplier || 6) / 6;
            },
            message: "Une découverte fortuite multiplie ta curiosité par 6 pendant 1 heure !",
            phase: 1
        },
        {
            name: "Inspiration divine",
            probability: 0.02,
            duration: 1800000,
            effect: () => {
                gameState.eventKinkyMultiplier = (gameState.eventKinkyMultiplier || 1) * 11;
                gameState.kinkyPerSecond *= 11;
            },
            endEffect: () => {
                gameState.kinkyPerSecond /= 11;
                gameState.eventKinkyMultiplier = (gameState.eventKinkyMultiplier || 11) / 11;
            },
            message: "Une inspiration divine multiplie ta génération de Kinky par 11 pendant 30 minutes !",
            phase: 2
        },
        {
            name: "Visiteur mystérieux",
            probability: 0.01,
            duration: 0,
            effect: () => {
                const bonus = Math.floor(gameState.kinky * 0.1) + 10;
                gameState.kinky += bonus;
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
            probability: 0.001,
            duration: 7200000,
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
        phaseIndicator: null,
        currentPhaseText: null,
        nextPhaseText: null,
        phaseObjective: null,
        prestigeBtn: null,
        prestigeTab: null,
        cosmicPoints: null,
        prestigeLevel: null,
        advancedResources: null,
        activeEventsContainer: null,
        activeEvents: null
    };

    /**
     * Fonctions utilitaires
     */
    function formatNumber(num) {
        if (!isFinite(num) || num === Infinity || isNaN(num)) return "∞";
        if (num >= 1e15) return (num / 1e15).toFixed(2) + "Q";
        if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
        if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
        if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
        return Math.floor(num).toString();
    }

    function safeCalculation(base, multiplier, level) {
        try {
            const result = base * Math.pow(multiplier, level);
            return isFinite(result) && result <= Number.MAX_SAFE_INTEGER ? result : base * 1000;
        } catch (error) {
            console.warn("Calcul sécurisé utilisé:", error);
            return base * 1000;
        }
    }

    function getUpgradeLevel(name) {
        const upgrade = upgrades.find(u => u.name === name);
        return upgrade ? upgrade.level : 0;
    }

    function hasSpecialUpgrade(name) {
        const special = specials.find(s => s.name === name);
        return special ? special.bought : false;
    }

    function unlockPrestige() {
        gameState.prestigeUnlocked = true;
        if (elements.prestigeTab) {
            elements.prestigeTab.style.display = 'block';
        }
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
            elements.prestigeBtn = document.getElementById("prestigeBtn");
            elements.prestigeTab = document.getElementById("prestige-tab");
            elements.cosmicPoints = document.getElementById("cosmicPoints");
            elements.prestigeLevel = document.getElementById("prestigeLevel");
            elements.advancedResources = document.getElementById("advancedResources");
            elements.activeEventsContainer = document.getElementById("activeEventsContainer");
            elements.activeEvents = document.getElementById("activeEvents");

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

            if (elements.prestigeBtn) {
                elements.prestigeBtn.addEventListener('click', doPrestige);
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
        try {
            const oldPhase = gameState.currentPhase;
            
            if (gameState.curiosity >= 1000 && gameState.currentPhase < 2) {
                gameState.currentPhase = 2;
                showNarration("🎉 Phase 2 débloquée : L'Exploration ! De nouvelles améliorations sont disponibles.");
            } else if (gameState.curiosity >= 10000000 && gameState.currentPhase < 6) {
                gameState.currentPhase = 6;
                showNarration("🎉 Phase 6 débloquée : L'Infini ! Tu deviens créateur d'univers.");
            }
            
            if (oldPhase !== gameState.currentPhase) {
                renderUpgrades();
                renderSpecials();
                console.log(`Phase mise à jour : ${oldPhase} -> ${gameState.currentPhase}. Curiosité: ${gameState.curiosity}`);
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de phase:", error);
        }
    }

    /**
     * Affiche le conteneur des ressources avancées
     */
    function showAdvancedResources() {
        try {
            if (elements.advancedResources && (gameState.eleves > 0 || gameState.elevesPerSecond > 0 || 
                gameState.innovations > 0 || gameState.innovationsPerSecond > 0 ||
                gameState.currentPhase >= 3)) {
                elements.advancedResources.style.display = 'block';
            }
        } catch (error) {
            console.error("Erreur lors de l'affichage des ressources avancées:", error);
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
            if (upgrade.elevesGain) {
                gameState.elevesPerSecond += upgrade.elevesGain;
                showAdvancedResources();
            }
            if (upgrade.innovationsGain) {
                gameState.innovationsPerSecond += upgrade.innovationsGain;
                showAdvancedResources();
            }
            if (upgrade.profitsGain) {
                gameState.profitsPerSecond += upgrade.profitsGain;
                showAdvancedResources();
            }
            if (upgrade.territoiresGain) {
                gameState.territoiresPerSecond += upgrade.territoiresGain;
                showAdvancedResources();
            }
            if (upgrade.diplomesGain) {
                gameState.diplomesPerSecond += upgrade.diplomesGain;
                showAdvancedResources();
            }
            if (upgrade.decouvertesGain) {
                gameState.decouvertesPerSecond += upgrade.decouvertesGain;
                showAdvancedResources();
            }
            if (upgrade.dimensionsGain) {
                gameState.dimensionsPerSecond += upgrade.dimensionsGain;
                showAdvancedResources();
            }
            if (upgrade.amesGain) {
                gameState.amesPerSecond += upgrade.amesGain;
                showAdvancedResources();
            }
            if (upgrade.universGain) {
                gameState.universPerSecond += upgrade.universGain;
                showAdvancedResources();
            }

            // Effets spéciaux
            if (upgrade.specialEffect) {
                upgrade.specialEffect();
            }

            // Bonus de la collection fétiche
            if (gameState.fetishBonus) {
                gameState.kinky += 1;
            }

            // Calcul du nouveau coût sécurisé
            const costMultiplier = 1.15 + (upgrade.phase - 1) * 0.05;
            upgrade.cost = safeCalculation(upgrade.baseCost, costMultiplier, upgrade.level);

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
            showAdvancedResources();
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
     * Effectue un prestige
     */
    function doPrestige() {
        try {
            if (!gameState.prestigeUnlocked || gameState.curiosity < 1000000) {
                return;
            }

            // Calculer les points cosmiques
            const newCosmicPoints = Math.floor(Math.sqrt(gameState.curiosity / 1000000));
            gameState.pointsCosmiques += newCosmicPoints;
            gameState.prestigeLevel++;

            // Reset du jeu avec bonus
            const prestigeMultiplier = 1 + (gameState.pointsCosmiques * 0.1);
            
            gameState.curiosity = 0;
            gameState.kinky = 0;
            gameState.curiosityPerSecond = 0;
            gameState.multiplier = prestigeMultiplier;
            gameState.extraClickBonus = Math.floor(gameState.pointsCosmiques / 10);
            gameState.currentPhase = 1;

            // Reset des ressources avancées
            gameState.eleves = 0;
            gameState.elevesPerSecond = 0;
            gameState.innovations = 0;
            gameState.innovationsPerSecond = 0;
            gameState.profits = 0;
            gameState.profitsPerSecond = 0;
            gameState.territoires = 0;
            gameState.territoiresPerSecond = 0;
            gameState.diplomes = 0;
            gameState.diplomesPerSecond = 0;
            gameState.decouvertes = 0;
            gameState.decouvertesPerSecond = 0;
            gameState.dimensions = 0;
            gameState.dimensionsPerSecond = 0;
            gameState.ames = 0;
            gameState.amesPerSecond = 0;
            gameState.univers = 0;
            gameState.universPerSecond = 0;

            // Reset des améliorations
            upgrades.forEach(upgrade => {
                upgrade.level = 0;
                upgrade.cost = upgrade.baseCost;
            });

            specials.forEach(special => {
                special.bought = false;
            });

            // Reset des multiplicateurs mais garder certains bonus
            gameState.elevesMultiplier = 1;
            gameState.innovationsMultiplier = 1;
            gameState.profitsMultiplier = 1;
            gameState.territoiresMultiplier = 1;
            gameState.diplomesMultiplier = 1;
            gameState.decouvertesMultiplier = 1;
            gameState.dimensionsMultiplier = 1;
            gameState.amesMultiplier = 1;
            gameState.tempsMultiplier = 1;

            showNarration(`🌟 Prestige accompli ! Tu gagnes ${newCosmicPoints} points cosmiques et redémarres avec un multiplicateur de ${prestigeMultiplier.toFixed(2)}x !`);
            
            if (elements.advancedResources) {
                elements.advancedResources.style.display = 'none';
            }

            updateDisplay();
            renderUpgrades();
            renderSpecials();
            saveGame();
        } catch (error) {
            console.error("Erreur lors du prestige:", error);
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
            if (elements.multiplier) {
                const mult = gameState.multiplier === Infinity ? "∞" : gameState.multiplier.toFixed(2);
                elements.multiplier.textContent = mult;
            }

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
                elements.phaseObjective.textContent = gameState.phaseObjectives[gameState.currentPhase] || "Terminé";
            }

            // Mise à jour du prestige
            if (elements.cosmicPoints) {
                elements.cosmicPoints.textContent = formatNumber(gameState.pointsCosmiques);
            }
            if (elements.prestigeLevel) {
                elements.prestigeLevel.textContent = gameState.prestigeLevel;
            }
            if (elements.prestigeBtn) {
                elements.prestigeBtn.disabled = !gameState.prestigeUnlocked || gameState.curiosity < 1000000;
            }

        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'affichage:", error);
        }
    }

    /**
     * Met à jour l'affichage des ressources avancées
     */
    function updateAdvancedResources() {
        try {
            const resourceMappings = [
                { id: 'eleves', value: gameState.eleves },
                { id: 'innovations', value: gameState.innovations },
                { id: 'profits', value: gameState.profits },
                { id: 'territoires', value: gameState.territoires },
                { id: 'diplomes', value: gameState.diplomes },
                { id: 'decouvertes', value: gameState.decouvertes },
                { id: 'dimensions', value: gameState.dimensions },
                { id: 'ames', value: gameState.ames }
            ];

            resourceMappings.forEach(resource => {
                const element = document.getElementById(resource.id);
                if (element) {
                    element.textContent = formatNumber(resource.value);
                }
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour des ressources avancées:", error);
        }
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
                if (upgrade.phase > gameState.currentPhase) {
                    return;
                }

                // Vérification sécurisée de la condition de déblocage
                let unlocked = true;
                try {
                    unlocked = upgrade.unlockCondition();
                } catch (error) {
                    console.warn(`Erreur dans la condition de déblocage pour ${upgrade.name}:`, error);
                    unlocked = false;
                }

                if (!unlocked) return;

                // Afficher si déjà acheté OU si assez de curiosité pour acheter (seuil réduit pour visibilité)
                if (upgrade.level > 0 || gameState.curiosity >= upgrade.cost * 0.25) {
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
                    if (upgrade.profitsGain) effectText += `, +${upgrade.profitsGain} Profits/sec`;
                    if (upgrade.territoiresGain) effectText += `, +${upgrade.territoiresGain} Territoires/sec`;
                    if (upgrade.diplomesGain) effectText += `, +${upgrade.diplomesGain} Diplômes/sec`;
                    if (upgrade.decouvertesGain) effectText += `, +${upgrade.decouvertesGain} Découvertes/sec`;
                    if (upgrade.dimensionsGain) effectText += `, +${upgrade.dimensionsGain} Dimensions/sec`;
                    if (upgrade.amesGain) effectText += `, +${upgrade.amesGain} Âmes/sec`;
                    if (upgrade.universGain) effectText += `, +${upgrade.universGain} Univers/sec`;
                    
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

                // Afficher seulement si pas encore acheté et assez de kinky (seuil réduit pour visibilité)
                if (!special.bought && gameState.kinky >= Math.max(1, special.cost * 0.25)) {
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
            let eventsEnded = false;
            gameState.activeEvents = gameState.activeEvents.filter(event => {
                if (now >= event.endTime) {
                    if (event.endEffect) {
                        try {
                            event.endEffect();
                        } catch (error) {
                            console.error("Erreur dans l'effet de fin d'événement:", error);
                        }
                    }
                    showNarration(`L'effet "${event.name}" se termine.`);
                    eventsEnded = true;
                    return false;
                }
                return true;
            });

            if (eventsEnded) {
                renderActiveEvents();
            }

            // Générer de nouveaux événements
            eventsConfig.forEach(eventConfig => {
                if (eventConfig.phase <= gameState.currentPhase) {
                    const timeSinceLastCheck = now - gameState.lastEventTime;
                    const hoursPassed = timeSinceLastCheck / 3600000;
                    
                    if (Math.random() < eventConfig.probability * Math.min(hoursPassed, 24)) {
                        try {
                            // Déclencher l'événement
                            eventConfig.effect();
                            showNarration(eventConfig.message);
                            
                            if (eventConfig.duration > 0) {
                                gameState.activeEvents.push({
                                    name: eventConfig.name,
                                    endTime: now + eventConfig.duration,
                                    endEffect: eventConfig.endEffect
                                });
                                renderActiveEvents();
                            }
                        } catch (error) {
                            console.error("Erreur dans l'effet d'événement:", error);
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
     * Affiche les événements actifs
     */
    function renderActiveEvents() {
        try {
            if (!elements.activeEvents || !elements.activeEventsContainer) return;

            if (gameState.activeEvents.length > 0) {
                elements.activeEventsContainer.style.display = 'block';
                elements.activeEvents.innerHTML = gameState.activeEvents.map(event => {
                    const timeLeft = Math.max(0, event.endTime - Date.now());
                    const minutesLeft = Math.floor(timeLeft / 60000);
                    const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
                    
                    return `
                        <div class="event-item">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-bold">${event.name}</span>
                                <span class="badge bg-warning">${minutesLeft}m ${secondsLeft}s</span>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                elements.activeEventsContainer.style.display = 'none';
            }
        } catch (error) {
            console.error("Erreur lors du rendu des événements actifs:", error);
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
                    if (elements.narration) {
                        elements.narration.style.transform = "scale(1)";
                    }
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
                gameState: { ...gameState },
                upgrades: upgrades.map(u => ({
                    name: u.name,
                    level: u.level,
                    cost: u.cost
                })),
                specials: specials.map(s => ({
                    name: s.name,
                    bought: s.bought
                })),
                timestamp: Date.now(),
                version: "2.0"
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
            
            // Vérifier la version
            if (!parsed.version || parsed.version !== "2.0") {
                console.warn("Version de sauvegarde incompatible, nouveau jeu démarré");
                return;
            }

            // Restaurer l'état du jeu
            if (parsed.gameState) {
                gameState = { ...gameState, ...parsed.gameState };
                
                // S'assurer que les multiplicateurs sont définis
                gameState.elevesMultiplier = gameState.elevesMultiplier || 1;
                gameState.innovationsMultiplier = gameState.innovationsMultiplier || 1;
                gameState.profitsMultiplier = gameState.profitsMultiplier || 1;
                gameState.territoiresMultiplier = gameState.territoiresMultiplier || 1;
                gameState.diplomesMultiplier = gameState.diplomesMultiplier || 1;
                gameState.decouvertesMultiplier = gameState.decouvertesMultiplier || 1;
                gameState.dimensionsMultiplier = gameState.dimensionsMultiplier || 1;
                gameState.amesMultiplier = gameState.amesMultiplier || 1;
                gameState.tempsMultiplier = gameState.tempsMultiplier || 1;
                
                // S'assurer que lastEventTime est défini
                gameState.lastEventTime = gameState.lastEventTime || Date.now();
            }

            // Restaurer les améliorations
            if (parsed.upgrades && Array.isArray(parsed.upgrades)) {
                parsed.upgrades.forEach(savedUpgrade => {
                    const upgradeIndex = upgrades.findIndex(u => u.name === savedUpgrade.name);
                    if (upgradeIndex !== -1) {
                        upgrades[upgradeIndex].level = savedUpgrade.level || 0;
                        upgrades[upgradeIndex].cost = savedUpgrade.cost || upgrades[upgradeIndex].baseCost;
                    }
                });
            }

            // Restaurer les améliorations spéciales
            if (parsed.specials && Array.isArray(parsed.specials)) {
                parsed.specials.forEach(savedSpecial => {
                    const specialIndex = specials.findIndex(s => s.name === savedSpecial.name);
                    if (specialIndex !== -1) {
                        specials[specialIndex].bought = savedSpecial.bought || false;
                    }
                });
            }

            // Gérer le temps hors ligne
            if (parsed.timestamp) {
                const offlineTime = Math.min(Date.now() - parsed.timestamp, 24 * 3600000); // Max 24h
                const offlineHours = offlineTime / 3600000;
                
                if (offlineHours > 0.1) { // Au moins 6 minutes
                    const offlineGains = Math.floor((gameState.curiosityPerSecond * gameState.multiplier) * offlineHours);
                    const offlineKinky = Math.floor(gameState.kinkyPerSecond * offlineHours);
                    
                    if (offlineGains > 0 || offlineKinky > 0) {
                        gameState.curiosity += offlineGains;
                        gameState.kinky += offlineKinky;
                        
                        showNarration(`Gains hors ligne : +${formatNumber(offlineGains)} curiosité, +${formatNumber(offlineKinky)} kinky (${Math.floor(offlineHours)}h${Math.floor((offlineHours % 1) * 60)}m)`);
                    }
                }
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
            const timeMultiplier = gameState.tempsMultiplier || 1;
            const deltaTime = 0.1; // 100ms en secondes
            
            // Gain automatique de curiosité
            if (gameState.curiosityPerSecond > 0) {
                const gain = (gameState.curiosityPerSecond * gameState.multiplier * timeMultiplier * deltaTime);
                if (isFinite(gain)) {
                    gameState.curiosity += gain;
                }
            }

            // Gain automatique de kinky
            if (gameState.kinkyPerSecond > 0) {
                const gain = (gameState.kinkyPerSecond * timeMultiplier * deltaTime);
                if (isFinite(gain)) {
                    gameState.kinky += gain;
                }
            }

            // Gains des nouvelles ressources
            const resourceUpdates = [
                { 
                    current: 'eleves', 
                    perSecond: 'elevesPerSecond', 
                    multiplier: 'elevesMultiplier' 
                },
                { 
                    current: 'innovations', 
                    perSecond: 'innovationsPerSecond', 
                    multiplier: 'innovationsMultiplier' 
                },
                { 
                    current: 'profits', 
                    perSecond: 'profitsPerSecond', 
                    multiplier: 'profitsMultiplier' 
                },
                { 
                    current: 'territoires', 
                    perSecond: 'territoiresPerSecond', 
                    multiplier: 'territoiresMultiplier' 
                },
                { 
                    current: 'diplomes', 
                    perSecond: 'diplomesPerSecond', 
                    multiplier: 'diplomesMultiplier' 
                },
                { 
                    current: 'decouvertes', 
                    perSecond: 'decouvertesPerSecond', 
                    multiplier: 'decouvertesMultiplier' 
                },
                { 
                    current: 'dimensions', 
                    perSecond: 'dimensionsPerSecond', 
                    multiplier: 'dimensionsMultiplier' 
                },
                { 
                    current: 'ames', 
                    perSecond: 'amesPerSecond', 
                    multiplier: 'amesMultiplier' 
                },
                { 
                    current: 'univers', 
                    perSecond: 'universPerSecond', 
                    multiplier: null 
                }
            ];

            resourceUpdates.forEach(resource => {
                if (gameState[resource.perSecond] > 0) {
                    const multiplier = resource.multiplier ? (gameState[resource.multiplier] || 1) : 1;
                    const gain = (gameState[resource.perSecond] * multiplier * timeMultiplier * deltaTime);
                    if (isFinite(gain)) {
                        gameState[resource.current] += gain;
                    }
                }
            });

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
            
            // Afficher les ressources si nécessaire
            showAdvancedResources();
            
            // Afficher le prestige si débloqué
            if (gameState.prestigeUnlocked && elements.prestigeTab) {
                elements.prestigeTab.style.display = 'block';
            }
            
            updateDisplay();
            renderUpgrades();
            renderSpecials();
            renderActiveEvents();

            // Démarrer la boucle de jeu (100ms pour plus de fluidité)
            setInterval(gameLoop, 100);
            
            // Traitement des événements toutes les 30 secondes
            setInterval(processRandomEvents, 30000);
            
            // Mise à jour des événements actifs toutes les secondes
            setInterval(renderActiveEvents, 1000);
            
            // Sauvegarder toutes les 10 secondes
            setInterval(saveGame, 10000);

            console.log("Jeu étendu et corrigé initialisé avec succès");
        } catch (error) {
            console.error("Erreur lors de l'initialisation du jeu:", error);
        }
    }

    /**
     * Fonction de debug pour les développeurs
     */
    function debugGame() {
        return {
            gameState: gameState,
            addCuriosity: (amount) => { 
                gameState.curiosity += amount; 
                updateDisplay(); 
                checkPhaseProgression();
                renderUpgrades();
                renderSpecials();
            },
            addKinky: (amount) => { 
                gameState.kinky += amount; 
                updateDisplay();
                renderSpecials();
            },
            setPhase: (phase) => { 
                gameState.currentPhase = Math.max(1, Math.min(6, phase)); 
                renderUpgrades(); 
                renderSpecials();
                updateDisplay();
                showAdvancedResources();
            },
            triggerEvent: (eventName) => {
                const event = eventsConfig.find(e => e.name === eventName);
                if (event && event.phase <= gameState.currentPhase) {
                    event.effect();
                    showNarration(event.message);
                    if (event.duration > 0) {
                        gameState.activeEvents.push({
                            name: event.name,
                            endTime: Date.now() + event.duration,
                            endEffect: event.endEffect
                        });
                        renderActiveEvents();
                    }
                }
            },
            unlockAllUpgrades: () => {
                gameState.currentPhase = 6;
                gameState.curiosity = 100000000;
                gameState.kinky = 50000;
                showAdvancedResources();
                unlockPrestige();
                renderUpgrades();
                renderSpecials();
                updateDisplay();
            },
            unlockPrestige: () => {
                unlockPrestige();
                updateDisplay();
            },
            fastProgress: () => {
                gameState.curiosity = 1000000;
                gameState.kinky = 5000;
                gameState.currentPhase = 5;
                gameState.curiosityPerSecond = 10000;
                gameState.kinkyPerSecond = 100;
                showAdvancedResources();
                unlockPrestige();
                renderUpgrades();
                renderSpecials();
                updateDisplay();
            },
            maxMultipliers: () => {
                Object.keys(gameState).forEach(key => {
                    if (key.endsWith('Multiplier')) {
                        gameState[key] = 1000;
                    }
                });
                gameState.multiplier = 1000;
                updateDisplay();
            },
            reset: () => {
                localStorage.removeItem("bdsmClickerExtendedSave");
                location.reload();
            },
            exportSave: () => {
                const saveData = localStorage.getItem("bdsmClickerExtendedSave");
                console.log("Sauvegarde:", saveData);
                return saveData;
            },
            importSave: (saveString) => {
                try {
                    localStorage.setItem("bdsmClickerExtendedSave", saveString);
                    location.reload();
                } catch (error) {
                    console.error("Erreur lors de l'import:", error);
                }
            },
            listEvents: () => {
                console.log("Événements disponibles:", eventsConfig.map(e => e.name));
                return eventsConfig.map(e => e.name);
            },
            getUpgrades: () => {
                return upgrades.map(u => ({
                    name: u.name,
                    level: u.level,
                    cost: u.cost,
                    phase: u.phase
                }));
            },
            getSpecials: () => {
                return specials.map(s => ({
                    name: s.name,
                    bought: s.bought,
                    cost: s.cost,
                    phase: s.phase
                }));
            },
            showStats: () => {
                console.log("=== STATISTIQUES DU JEU ===");
                console.log(`Phase: ${gameState.currentPhase} (${gameState.phaseNames[gameState.currentPhase]})`);
                console.log(`Curiosité: ${formatNumber(gameState.curiosity)} (+${formatNumber(gameState.curiosityPerSecond)}/sec)`);
                console.log(`Kinky: ${formatNumber(gameState.kinky)} (+${formatNumber(gameState.kinkyPerSecond)}/sec)`);
                console.log(`Multiplicateur: ${gameState.multiplier.toFixed(2)}x`);
                console.log(`Prestige: Niveau ${gameState.prestigeLevel}, ${formatNumber(gameState.pointsCosmiques)} points cosmiques`);
                console.log(`Ressources avancées:`);
                console.log(`  Élèves: ${formatNumber(gameState.eleves)} (+${formatNumber(gameState.elevesPerSecond)}/sec)`);
                console.log(`  Innovations: ${formatNumber(gameState.innovations)} (+${formatNumber(gameState.innovationsPerSecond)}/sec)`);
                console.log(`  Profits: ${formatNumber(gameState.profits)} (+${formatNumber(gameState.profitsPerSecond)}/sec)`);
                console.log(`Événements actifs: ${gameState.activeEvents.length}`);
                return gameState;
            }
        };
    }

    // Exposer les fonctions nécessaires au global scope
    window.gameActions = {
        gainCuriosity,
        buyUpgrade,
        buySpecial,
        convertCuriosity,
        doPrestige,
        gameState: () => gameState,
        formatNumber,
        debug: debugGame
    };

    // Message de bienvenue dans la console pour les développeurs
    console.log("🔗 BDSM Idle Clicker - Version Étendue et Corrigée 🔗");
    console.log("Tapez 'gameActions.debug()' dans la console pour accéder aux outils de debug");
    console.log("Tapez 'gameActions.debug().showStats()' pour voir les statistiques complètes");

    // Initialiser le jeu quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }

})