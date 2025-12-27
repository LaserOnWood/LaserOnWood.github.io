/**
 * Module de questionnaire guidé pour l'application KinkList
 * Aide les nouveaux utilisateurs à explorer leurs préférences
 */
import { ToastManager } from './toast-manager.js';

export class GuidedQuizManager {
    constructor(kinkData, preferencesManager, statsManager) {
        this.kinkData = kinkData;
        this.preferencesManager = preferencesManager;
        this.statsManager = statsManager;
        this.currentStep = 0;
        this.quizData = [];
        this.answers = new Map();
        this.quizMode = 'discovery'; // discovery, quick, detailed
    }

    /**
     * Démarre le questionnaire guidé
     * @param {string} mode - Mode du questionnaire
     */
    async startQuiz(mode = 'discovery') {
        this.quizMode = mode;
        this.currentStep = 0;
        this.answers.clear();

        // Générer les questions selon le mode
        this.quizData = this.generateQuestions(mode);

        // Afficher la modale d'introduction
        await this.showIntroModal();
    }

    /**
     * Génère les questions selon le mode
     * @param {string} mode - Mode du questionnaire
     * @returns {Array}
     */
    generateQuestions(mode) {
        const questions = [];

        switch (mode) {
            case 'quick':
                // Mode rapide : une question par catégorie principale
                questions.push(...this.generateQuickQuestions());
                break;

            case 'detailed':
                // Mode détaillé : plusieurs questions par catégorie
                questions.push(...this.generateDetailedQuestions());
                break;

            case 'discovery':
            default:
                // Mode découverte : questions équilibrées
                questions.push(...this.generateDiscoveryQuestions());
                break;
        }

        return questions;
    }

    /**
     * Génère les questions en mode rapide (15-20 questions)
     */
    generateQuickQuestions() {
        const questions = [];

        // Sélectionner les catégories les plus importantes
        const mainCategories = this.kinkData.categories.filter(cat => 
            ['pratiquessexuelles', 'domination', 'fetichisme', 'aspectPhysique']
                .includes(cat.id)
        );

        mainCategories.forEach(category => {
            const items = this.getCategoryItems(category).slice(0, 4);
            items.forEach(item => {
                questions.push({
                    category: category.name,
                    categoryId: category.id,
                    item: typeof item === 'string' ? item : item.name,
                    description: typeof item === 'object' ? item.description : null
                });
            });
        });

        return this.shuffleArray(questions).slice(0, 20);
    }

    /**
     * Génère les questions en mode découverte (30-40 questions)
     */
    generateDiscoveryQuestions() {
        const questions = [];

        // Prendre quelques items de chaque catégorie
        this.kinkData.categories.forEach(category => {
            const items = this.getCategoryItems(category);
            const sampleSize = Math.min(5, items.length);
            const selectedItems = this.shuffleArray(items).slice(0, sampleSize);

            selectedItems.forEach(item => {
                questions.push({
                    category: category.name,
                    categoryId: category.id,
                    item: typeof item === 'string' ? item : item.name,
                    description: typeof item === 'object' ? item.description : null,
                    icon: category.icon
                });
            });
        });

        return this.shuffleArray(questions).slice(0, 40);
    }

    /**
     * Génère les questions en mode détaillé (tous les items)
     */
    generateDetailedQuestions() {
        const questions = [];

        this.kinkData.categories.forEach(category => {
            const items = this.getCategoryItems(category);
            
            items.forEach(item => {
                questions.push({
                    category: category.name,
                    categoryId: category.id,
                    item: typeof item === 'string' ? item : item.name,
                    description: typeof item === 'object' ? item.description : null,
                    icon: category.icon
                });
            });
        });

        return this.shuffleArray(questions);
    }

    /**
     * Affiche la modale d'introduction
     */
    async showIntroModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'quizIntroModal';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.setAttribute('data-bs-keyboard', 'false');

        const modeInfo = {
            quick: { name: 'Rapide', desc: '15-20 questions', duration: '5 min', emoji: '⚡' },
            discovery: { name: 'Découverte', desc: '30-40 questions', duration: '10-15 min', emoji: '🔍' },
            detailed: { name: 'Détaillé', desc: 'Tous les items', duration: '20-30 min', emoji: '📋' }
        };

        const info = modeInfo[this.quizMode];

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-gradient" style="background: linear-gradient(135deg, #667eea 0%, #764ba8 100%); color: white;">
                        <h5 class="modal-title">
                            ${info.emoji} Questionnaire Guidé - Mode ${info.name}
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <div class="display-4 mb-3">${info.emoji}</div>
                            <h5>Explorez vos préférences en toute simplicité</h5>
                        </div>

                        <div class="alert alert-info">
                            <strong>📊 Détails du questionnaire :</strong>
                            <ul class="mb-0 mt-2">
                                <li>${info.desc}</li>
                                <li>Durée estimée : ${info.duration}</li>
                                <li>Vous pouvez arrêter à tout moment</li>
                                <li>Vos réponses sont sauvegardées automatiquement</li>
                            </ul>
                        </div>

                        <div class="alert alert-success">
                            <strong>💡 Comment ça marche ?</strong>
                            <p class="mb-2 mt-2">Pour chaque pratique ou préférence, indiquez votre intérêt :</p>
                            <div class="d-flex flex-column gap-2">
                                <div><span class="badge" style="background: ${this.kinkData.preferenceTypes[0].color}">J'adore</span> - Vous adorez cette pratique</div>
                                <div><span class="badge" style="background: ${this.kinkData.preferenceTypes[1].color}">J'aime</span> - Vous appréciez cette pratique</div>
                                <div><span class="badge" style="background: ${this.kinkData.preferenceTypes[2].color}">Curieux</span> - Vous aimeriez essayer</div>
                                <div><span class="badge" style="background: ${this.kinkData.preferenceTypes[3].color}">Peu intéressé</span> - Pas votre truc</div>
                                <div><span class="badge" style="background: ${this.kinkData.preferenceTypes[4].color}">Non strict</span> - Limite ferme</div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times"></i> Annuler
                        </button>
                        <button type="button" class="btn btn-primary" id="startQuizBtn">
                            <i class="fas fa-play"></i> Commencer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Démarrer le quiz
        document.getElementById('startQuizBtn').addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                this.showQuestionModal();
            });
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Affiche la modale de question
     */
    showQuestionModal() {
        if (this.currentStep >= this.quizData.length) {
            this.showCompletionModal();
            return;
        }

        const question = this.quizData[this.currentStep];
        const progress = ((this.currentStep / this.quizData.length) * 100).toFixed(0);

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'quizQuestionModal';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.setAttribute('data-bs-keyboard', 'false');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="w-100">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0">
                                    <i class="${question.icon || 'fas fa-question-circle'}"></i>
                                    ${this.escapeHtml(question.category)}
                                </h6>
                                <span class="badge bg-primary">
                                    ${this.currentStep + 1} / ${this.quizData.length}
                                </span>
                            </div>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar" role="progressbar" 
                                     style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <h4 class="mb-3">${this.escapeHtml(question.item)}</h4>
                            ${question.description ? `
                                <p class="text-muted">
                                    <i class="fas fa-info-circle"></i>
                                    ${this.escapeHtml(question.description)}
                                </p>
                            ` : ''}
                        </div>

                        <div class="d-grid gap-2">
                            ${this.kinkData.preferenceTypes.map((type, index) => `
                                <button class="btn btn-lg quiz-answer-btn" 
                                        data-preference="${type.id}"
                                        style="background: ${type.color}; color: white; border: none;">
                                    <strong>${type.name}</strong>
                                </button>
                            `).join('')}
                            
                            <button class="btn btn-outline-secondary quiz-skip-btn">
                                <i class="fas fa-forward"></i> Passer
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="quitQuizBtn">
                            <i class="fas fa-stop"></i> Arrêter
                        </button>
                        ${this.currentStep > 0 ? `
                            <button type="button" class="btn btn-outline-primary" id="previousQuizBtn">
                                <i class="fas fa-arrow-left"></i> Précédent
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners pour les réponses
        modal.querySelectorAll('.quiz-answer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preference = e.currentTarget.dataset.preference;
                this.recordAnswer(question, preference);
                
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                
                modal.addEventListener('hidden.bs.modal', () => {
                    modal.remove();
                    this.currentStep++;
                    this.showQuestionModal();
                });
            });
        });

        // Passer la question
        modal.querySelector('.quiz-skip-btn')?.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                this.currentStep++;
                this.showQuestionModal();
            });
        });

        // Question précédente
        modal.querySelector('#previousQuizBtn')?.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                this.currentStep--;
                this.showQuestionModal();
            });
        });

        // Arrêter le quiz
        modal.querySelector('#quitQuizBtn')?.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir arrêter ? Vos réponses actuelles seront sauvegardées.')) {
                this.applyAnswers();
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                modal.addEventListener('hidden.bs.modal', () => {
                    modal.remove();
                    ToastManager.showToast('Questionnaire interrompu, réponses sauvegardées', 'info');
                });
            }
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Enregistre une réponse
     * @param {Object} question - Question
     * @param {string} preference - Préférence choisie
     */
    recordAnswer(question, preference) {
        this.answers.set(question.item, preference);
        console.log(`✅ Réponse enregistrée: ${question.item} → ${preference}`);
    }

    /**
     * Affiche la modale de complétion
     */
    showCompletionModal() {
        const answeredCount = this.answers.size;
        const totalQuestions = this.quizData.length;
        const completionRate = ((answeredCount / totalQuestions) * 100).toFixed(0);

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'quizCompletionModal';

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle"></i> Questionnaire Terminé !
                        </h5>
                    </div>
                    <div class="modal-body text-center">
                        <div class="display-1 mb-3">🎉</div>
                        <h4 class="mb-4">Félicitations !</h4>
                        
                        <div class="alert alert-success">
                            <strong>📊 Résumé :</strong>
                            <ul class="list-unstyled mb-0 mt-2">
                                <li><strong>${answeredCount}</strong> réponses sur ${totalQuestions} questions</li>
                                <li>Taux de complétion : <strong>${completionRate}%</strong></li>
                            </ul>
                        </div>

                        <p class="text-muted mb-4">
                            Vos préférences ont été sauvegardées et sont maintenant visibles dans votre profil.
                            Vous pouvez toujours les modifier ou compléter plus tard.
                        </p>

                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-lg" id="viewResultsBtn">
                                <i class="fas fa-eye"></i> Voir mon profil
                            </button>
                            <button class="btn btn-outline-secondary" id="exportResultsBtn">
                                <i class="fas fa-download"></i> Exporter mes préférences
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Appliquer les réponses immédiatement
        this.applyAnswers();

        // Event listeners
        document.getElementById('viewResultsBtn')?.addEventListener('click', () => {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                // Scroll vers les stats
                document.querySelector('.stats')?.scrollIntoView({ behavior: 'smooth' });
            });
        });

        document.getElementById('exportResultsBtn')?.addEventListener('click', () => {
            // Trigger export
            document.getElementById('exportBtn')?.click();
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Applique les réponses aux préférences
     */
    applyAnswers() {
        this.answers.forEach((preference, itemName) => {
            this.preferencesManager.setPreference(itemName, preference);
            
            // Mettre à jour visuellement
            const itemElement = document.querySelector(`[data-item="${itemName}"]`);
            if (itemElement) {
                // Retirer les anciennes classes
                ['adore', 'aime', 'curiosité', 'dislike', 'non_strict'].forEach(cls => {
                    itemElement.classList.remove(cls);
                });
                
                // Ajouter la nouvelle classe
                if (preference !== 'none') {
                    itemElement.classList.add(preference);
                }
            }
        });

        // Mettre à jour les statistiques
        this.statsManager.updateInterface();

        console.log(`✅ ${this.answers.size} préférences appliquées`);
    }

    /**
     * Affiche le menu de sélection du mode
     */
    showModeSelectionModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'quizModeModal';

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-compass"></i> Choisissez votre mode de découverte
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-4">
                            Choisissez le mode qui vous convient le mieux pour explorer vos préférences
                        </p>

                        <div class="row g-3">
                            <div class="col-md-4">
                                <div class="card quiz-mode-card h-100" data-mode="quick">
                                    <div class="card-body text-center">
                                        <div class="display-3 mb-3">⚡</div>
                                        <h5>Mode Rapide</h5>
                                        <p class="text-muted">15-20 questions</p>
                                        <ul class="list-unstyled small">
                                            <li>⏱️ 5 minutes</li>
                                            <li>🎯 Essentiels uniquement</li>
                                            <li>✨ Idéal pour débuter</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="card quiz-mode-card h-100 border-primary" data-mode="discovery">
                                    <div class="card-body text-center">
                                        <div class="display-3 mb-3">🔍</div>
                                        <h5>Mode Découverte</h5>
                                        <p class="text-muted">30-40 questions</p>
                                        <ul class="list-unstyled small">
                                            <li>⏱️ 10-15 minutes</li>
                                            <li>🌈 Équilibré et varié</li>
                                            <li>⭐ Recommandé</li>
                                        </ul>
                                        <span class="badge bg-primary">Recommandé</span>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="card quiz-mode-card h-100" data-mode="detailed">
                                    <div class="card-body text-center">
                                        <div class="display-3 mb-3">📋</div>
                                        <h5>Mode Détaillé</h5>
                                        <p class="text-muted">Tous les items</p>
                                        <ul class="list-unstyled small">
                                            <li>⏱️ 20-30 minutes</li>
                                            <li>📊 Exploration complète</li>
                                            <li>🔬 Pour les curieux</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Sélection du mode
        modal.querySelectorAll('.quiz-mode-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
                
                modal.addEventListener('hidden.bs.modal', () => {
                    modal.remove();
                    this.startQuiz(mode);
                });
            });

            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05)';
                card.style.transition = 'all 0.3s ease';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
            });
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Utilitaires
     */
    getCategoryItems(category) {
        const items = [];
        
        if (category.hasSubcategories && category.subcategories) {
            category.subcategories.forEach(subcat => {
                if (subcat.items) {
                    items.push(...subcat.items);
                }
            });
        } else if (category.items) {
            items.push(...category.items);
        }

        return items;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}