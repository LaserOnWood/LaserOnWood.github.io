/**
 * Module de génération d'image récapitulative pour l'application de gestion des préférences Kink
 * Version modifiée : Organisation par catégories avec personnalisation du pseudo
 */
import { getDateString } from './core-utils.js';
import { ToastManager } from './core-utils.js';
import { ModalManager } from './core-utils.js';

/**
 * Classe responsable de la génération d'images récapitulatives des préférences
 */
export class ImageGeneratorByCategory {
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

        const preferences = this.preferencesManager.getAllPreferences();

        if (preferences.size === 0) {
            ToastManager.showToast('Aucune préférence sélectionnée pour générer l\'image', 'warning');
            return;
        }

        // Afficher la modale pour demander le pseudo
        ModalManager.showPseudoModal(async (pseudo) => {
            await this.generateImageWithPseudo(pseudo);
        });
    }

    /**
     * Génération de l'image avec le pseudo fourni
     * @param {string|null} pseudo - Pseudo de l'utilisateur (ou null)
     */
    async generateImageWithPseudo(pseudo) {
        this.isGenerating = true;
        console.log('🖼️ Début de la génération d\'image...');

        try {
            const preferences = this.preferencesManager.getAllPreferences();

            // Créer le conteneur temporaire pour l'image
            const imageContainer = this.createImageContainer(preferences, pseudo);

            // Ajouter temporairement au DOM (invisible)
            document.body.appendChild(imageContainer);

            // Attendre que les styles soient appliqués
            await this.waitForStyles();

            // Générer l'image avec html2canvas
            const canvas = await this.captureContainer(imageContainer);

            // Supprimer le conteneur temporaire
            document.body.removeChild(imageContainer);

            // Nom du fichier personnalisé
            const filename = pseudo
                ? `Liste_de_kink_de_${pseudo.replace(/\s+/g, '_')}_par_categories_${getDateString()}.png`
                : `Ma_liste_de_kink_par_categories_${getDateString()}.png`;

            // Télécharger l'image
            this.downloadImage(canvas, filename);

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
     * @param {string|null} pseudo - Pseudo de l'utilisateur
     * @returns {HTMLElement} Conteneur de l'image
     */
    createImageContainer(preferences, pseudo) {
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

        // Titre principal personnalisé
        const title = document.createElement('h1');
        title.textContent = pseudo
            ? `La liste de Kink de ${pseudo} - Par catégories`
            : 'Ma liste de Kink - Par catégories';
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

        // Organiser les préférences par catégories
        const categorizedPreferences = this.organizePreferencesByCategories(preferences);

        // Créer les sections pour chaque catégorie
        categorizedPreferences.forEach(categoryData => {
            if (categoryData.items.length > 0) {
                const section = this.createCategorySection(categoryData);
                container.appendChild(section);
            }
        });

        // Footer avec timestamp
        const footer = document.createElement('div');
        footer.style.cssText = `
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #586263ff;
            border-top: 1px solid #ecf0f1;
            padding-top: 15px;
        `;
        footer.textContent = `Généré avec beaucoup d'amour le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} sur kinklist.azarothis.fr`;
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
            margin-bottom: 20px;
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
     * Organisation des préférences par catégories
     * @param {Map} preferences - Map des préférences
     * @returns {Array} Tableau des catégories avec leurs items
     */
    organizePreferencesByCategories(preferences) {
        const categorizedData = [];

        this.kinkData.categories.forEach(category => {
            if (category.hasSubcategories && category.subcategories) {
                // Traiter les sous-catégories
                category.subcategories.forEach(subcat => {
                    const subcatItems = this.getItemsForCategory(subcat.id, preferences);
                    if (subcatItems.length > 0) {
                        categorizedData.push({
                            name: `${category.name} - ${subcat.name}`,
                            icon: subcat.icon,
                            items: subcatItems,
                            isSubcategory: true
                        });
                    }
                });
            } else {
                // Traiter la catégorie principale
                const categoryItems = this.getItemsForCategory(category.id, preferences);
                if (categoryItems.length > 0) {
                    categorizedData.push({
                        name: category.name,
                        icon: category.icon,
                        items: categoryItems,
                        isSubcategory: false
                    });
                }
            }
        });

        return categorizedData;
    }

    /**
     * Récupération des items d'une catégorie avec leurs préférences
     * @param {string} categoryId - ID de la catégorie
     * @param {Map} preferences - Map des préférences
     * @returns {Array} Items avec leurs préférences
     */
    getItemsForCategory(categoryId, preferences) {
        const items = [];

        // Récupérer tous les éléments DOM de cette catégorie
        const categoryElements = document.querySelectorAll(`[data-category="${categoryId}"]`);

        categoryElements.forEach(element => {
            const itemName = element.dataset.item;
            if (itemName && preferences.has(itemName)) {
                const preferenceType = preferences.get(itemName);
                const typeData = this.kinkData.preferenceTypes.find(t => t.id === preferenceType);

                if (typeData) {
                    items.push({
                        name: itemName,
                        preference: preferenceType,
                        color: typeData.color,
                        typeName: typeData.name
                    });
                }
            }
        });

        // Trier les items par nom pour une présentation cohérente
        items.sort((a, b) => a.name.localeCompare(b.name));

        return items;
    }

    /**
     * Création d'une section de catégorie
     * @param {Object} categoryData - Données de la catégorie
     * @returns {HTMLElement} Section de catégorie
     */
    createCategorySection(categoryData) {
        const section = document.createElement('div');
        section.style.cssText = `
            margin-bottom: 30px;
            break-inside: avoid;
        `;

        // Titre de la section avec icône
        const sectionTitle = document.createElement('h3');
        sectionTitle.innerHTML = `<i class="${categoryData.icon}" style="margin-right: 10px; color: #4facfe;"></i>${categoryData.name} (${categoryData.items.length})`;
        sectionTitle.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 20px;
            color: #2c3e50;
            border-bottom: 2px solid #4facfe;
            padding-bottom: 8px;
            display: flex;
            align-items: center;
        `;
        section.appendChild(sectionTitle);

        // Grille des items
        const itemsGrid = document.createElement('div');
        itemsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 8px;
        `;

        categoryData.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 15px;
                background: #ffffff;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                font-size: 14px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            `;

            const colorIndicator = document.createElement('div');
            colorIndicator.style.cssText = `
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: ${item.color};
                flex-shrink: 0;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            `;

            const itemText = document.createElement('span');
            itemText.textContent = item.name;
            itemText.style.cssText = `
                color: #495057;
                line-height: 1.2;
                flex: 1;
            `;

            const preferenceType = document.createElement('span');
            preferenceType.textContent = item.typeName;
            preferenceType.style.cssText = `
                font-size: 12px;
                color: #6c757d;
                font-style: italic;
            `;

            itemElement.appendChild(colorIndicator);
            itemElement.appendChild(itemText);
            itemElement.appendChild(preferenceType);
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
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Impossible de préparer le fichier image.');
            }

            const link = document.createElement('a');
            const objectUrl = URL.createObjectURL(blob);
            link.download = filename;
            link.href = objectUrl;
            link.style.position = 'absolute';
            link.style.left = '-9999px';
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                link.remove();
                URL.revokeObjectURL(objectUrl);
            }, 100);
        }, 'image/png');
    }
}
