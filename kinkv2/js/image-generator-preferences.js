/**
 * Module de génération d'image récapitulative pour l'application de gestion des préférences Kink
 * Version organisée par types de préférences
 */
import { getDateString } from './utils.js';
import { ToastManager } from './toast-manager.js';

/**
 * Classe responsable de la génération d'images récapitulatives des préférences (organisées par type)
 */
export class ImageGeneratorByPreference {
    constructor(preferencesManager, kinkData) {
        this.preferencesManager = preferencesManager;
        this.kinkData = kinkData;
        this.isGenerating = false;
    }

    /**
     * Génération de l'image récapitulative
     */
    async generatePreferencesImage() {
        if (this.isGenerating) {
            console.log('⚠️ Génération d\'image déjà en cours...');
            return;
        }

        this.isGenerating = true;
        console.log('🖼️ Début de la génération d\'image (par préférences)...');

        try {
            const preferences = this.preferencesManager.getAllPreferences();
            
            if (preferences.size === 0) {
                ToastManager.showToast('Aucune préférence sélectionnée pour générer l\'image', 'warning');
                return;
            }

            // Créer le conteneur temporaire pour l'image
            const imageContainer = this.createImageContainer(preferences);
            
            // Ajouter temporairement au DOM (invisible)
            document.body.appendChild(imageContainer);

            // Attendre que les styles soient appliqués
            await this.waitForStyles();

            // Générer l'image avec html2canvas
            const canvas = await this.captureContainer(imageContainer);
            
            // Supprimer le conteneur temporaire
            document.body.removeChild(imageContainer);

            // Télécharger l'image
            this.downloadImage(canvas, `Ma_liste_de_kink_par_preferences_${getDateString()}.png`);
            
            ToastManager.showToast('Image générée et téléchargée avec succès !', 'success');
            console.log('✅ Génération d\'image terminée avec succès');

        } catch (error) {
            console.error('❌ Erreur lors de la génération d\'image:', error);
            ToastManager.showToast('Erreur lors de la génération de l\'image', 'danger');
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Création du conteneur HTML pour l'image
     * @param {Map} preferences - Map des préférences
     * @returns {HTMLElement} Conteneur de l'image
     */
    createImageContainer(preferences) {
        const container = document.createElement('div');
        container.className = 'preferences-image-container';
        container.style.cssText = `
            position: absolute;
            left: -9999px;
            top: -9999px;
            width: 1200px;
            background: white;
            padding: 40px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            box-sizing: border-box;
        `;

        // Titre principal
        const title = document.createElement('h1');
        title.textContent = 'Ma liste de Kink - Par préférences';
        title.style.cssText = `
            text-align: center;
            margin: 0 0 30px 0;
            font-size: 36px;
            font-weight: bold;
            color: #2c3e50;
        `;
        container.appendChild(title);

        // Légende des couleurs
        const legend = this.createLegend();
        container.appendChild(legend);

        // Grouper les préférences par type
        const groupedPreferences = this.groupPreferencesByType(preferences);

        // Créer les sections pour chaque type de préférence
        Object.entries(groupedPreferences).forEach(([typeId, items]) => {
            if (items.length > 0) {
                const section = this.createPreferenceSection(typeId, items);
                container.appendChild(section);
            }
        });

        // Footer avec timestamp
        const footer = document.createElement('div');
        footer.style.cssText = `
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #ecf0f1;
            padding-top: 15px;
        `;
        footer.textContent = `Généré avec beaucoup d'amour le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
        container.appendChild(footer);

        return container;
    }

    /**
     * Création de la légende des couleurs
     * @returns {HTMLElement} Élément légende
     */
    createLegend() {
        const legend = document.createElement('div');
        legend.style.cssText = `
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        `;

        const legendTitle = document.createElement('h3');
        legendTitle.textContent = 'Légende des couleurs';
        legendTitle.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #495057;
        `;
        legend.appendChild(legendTitle);

        const legendGrid = document.createElement('div');
        legendGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        `;

        this.kinkData.preferenceTypes.forEach(type => {
            const legendItem = document.createElement('div');
            legendItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
            `;

            const colorBox = document.createElement('div');
            colorBox.style.cssText = `
                width: 20px;
                height: 20px;
                border-radius: 4px;
                background: ${type.color};
                border: 1px solid #dee2e6;
            `;

            const label = document.createElement('span');
            label.textContent = type.name;
            label.style.cssText = `
                font-size: 14px;
                color: #495057;
            `;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legendGrid.appendChild(legendItem);
        });

        legend.appendChild(legendGrid);
        return legend;
    }

    /**
     * Groupement des préférences par type
     * @param {Map} preferences - Map des préférences
     * @returns {Object} Préférences groupées par type
     */
    groupPreferencesByType(preferences) {
        const grouped = {};
        
        // Initialiser les groupes
        this.kinkData.preferenceTypes.forEach(type => {
            grouped[type.id] = [];
        });

        // Grouper les préférences
        preferences.forEach((type, itemName) => {
            if (grouped[type]) {
                grouped[type].push(itemName);
            }
        });

        return grouped;
    }

    /**
     * Création d'une section de préférences pour un type donné
     * @param {string} typeId - ID du type de préférence
     * @param {Array} items - Liste des items de ce type
     * @returns {HTMLElement} Section de préférences
     */
    createPreferenceSection(typeId, items) {
        const preferenceType = this.kinkData.preferenceTypes.find(type => type.id === typeId);
        if (!preferenceType) return document.createElement('div');

        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 25px;
            break-inside: avoid;
        `;

        // Titre de la section
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = `${preferenceType.name} (${items.length})`;
        sectionTitle.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 20px;
            color: #2c3e50;
            border-bottom: 2px solid;
            border-image: ${preferenceType.color} 1;
            padding-bottom: 5px;
        `;
        section.appendChild(sectionTitle);

        // Grille des items
        const itemsGrid = document.createElement('div');
        itemsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 8px;
        `;

        items.forEach(itemName => {
            const itemElement = document.createElement('div');
            itemElement.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: #ffffff;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                font-size: 14px;
            `;

            const colorIndicator = document.createElement('div');
            colorIndicator.style.cssText = `
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${preferenceType.color};
                flex-shrink: 0;
            `;

            const itemText = document.createElement('span');
            itemText.textContent = itemName;
            itemText.style.cssText = `
                color: #495057;
                line-height: 1.2;
            `;

            itemElement.appendChild(colorIndicator);
            itemElement.appendChild(itemText);
            itemsGrid.appendChild(itemElement);
        });

        section.appendChild(itemsGrid);
        return section;
    }

    /**
     * Attendre que les styles soient appliqués
     */
    waitForStyles() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                setTimeout(resolve, 100);
            });
        });
    }

    /**
     * Capture du conteneur avec html2canvas
     * @param {HTMLElement} container - Conteneur à capturer
     * @returns {Promise<HTMLCanvasElement>} Canvas généré
     */
    async captureContainer(container) {
        // Vérifier si html2canvas est disponible
        if (typeof html2canvas === 'undefined') {
            throw new Error('La bibliothèque html2canvas n\'est pas chargée');
        }

        const canvas = await html2canvas(container, {
            backgroundColor: '#ffffff',
            scale: 2, // Haute résolution
            useCORS: true,
            allowTaint: false,
            logging: false,
            width: 1200,
            height: container.scrollHeight
        });

        return canvas;
    }

    /**
     * Téléchargement de l'image
     * @param {HTMLCanvasElement} canvas - Canvas à télécharger
     * @param {string} filename - Nom du fichier
     */
    downloadImage(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        
        // Style invisible
        link.style.position = 'absolute';
        link.style.left = '-9999px';
        
        // Ajout temporaire au DOM
        document.body.appendChild(link);
        
        // Déclenchement du téléchargement
        link.click();
        
        // Nettoyage
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 100);
    }
}