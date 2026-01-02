/**
 * Module de questionnaire guidé pour l'application KinkList
 * Version Focus Immersive
 */
import { ToastManager } from './core-utils.js';

export class GuidedQuizManager {
    constructor(kinkData, preferencesManager, statsManager) {
        this.kinkData = kinkData;
        this.preferencesManager = preferencesManager;
        this.statsManager = statsManager;
        this.currentStep = 0;
        this.quizData = [];
        this.answers = new Map();
    }

    async startQuiz(mode = 'discovery') {
        this.currentStep = 0;
        this.answers.clear();
        this.quizData = this.generateQuestions(mode);
        await this.showIntroModal();
    }

    generateQuestions(mode) {
        const questions = [];
        this.kinkData.categories.forEach(category => {
            const items = this.getCategoryItems(category);
            const sampleSize = mode === 'quick' ? Math.min(2, items.length) : Math.min(5, items.length);
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
        return this.shuffleArray(questions);
    }

    getCategoryItems(category) {
        if (category.items) return category.items;
        if (category.subcategories) {
            return category.subcategories.flatMap(sub => sub.items || []);
        }
        return [];
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    async showIntroModal() {
        const modalId = 'quizIntroModal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.setAttribute('data-bs-backdrop', 'static');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 bg-primary text-white p-4">
                        <h5 class="modal-title fw-bold"><i class="fas fa-compass me-2"></i> Mode Focus</h5>
                    </div>
                    <div class="modal-body p-4 text-center">
                        <div class="mb-4">
                            <i class="fas fa-magic fa-3x text-primary opacity-25"></i>
                        </div>
                        <h4 class="fw-bold mb-3">Prêt pour l'exploration ?</h4>
                        <p class="text-muted">Le mode Focus vous permet de vous concentrer sur une pratique à la fois pour une expérience plus immersive.</p>
                        <div class="alert alert-light border-0 rounded-3 text-start mt-4">
                            <small class="d-block mb-2 fw-bold text-primary"><i class="fas fa-info-circle me-1"></i> Comment ça marche :</small>
                            <small class="text-muted">Répondez à chaque question en cliquant sur votre niveau d'intérêt. Vos préférences sont appliquées en temps réel.</small>
                        </div>
                    </div>
                    <div class="modal-footer border-0 p-4">
                        <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Plus tard</button>
                        <button type="button" class="btn btn-primary px-4 fw-bold" id="confirmStartQuiz">C'est parti !</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('confirmStartQuiz').addEventListener('click', () => {
            const bsModal = window.bootstrap.Modal.getInstance(modal);
            bsModal.hide();
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                this.showQuestionModal();
            }, { once: true });
        });

        const bsModal = new window.bootstrap.Modal(modal);
        bsModal.show();
    }

    showQuestionModal() {
        if (this.currentStep >= this.quizData.length) {
            this.showCompletionModal();
            return;
        }

        const question = this.quizData[this.currentStep];
        const progress = ((this.currentStep / this.quizData.length) * 100).toFixed(0);
        const modalId = 'quizQuestionModal';
        
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.setAttribute('data-bs-backdrop', 'static');

        modal.innerHTML = `
            <div class="modal-dialog modal-fullscreen-sm-down modal-dialog-centered modal-lg">
                <div class="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
                    <div class="modal-header border-0 bg-light px-4 py-3">
                        <div class="w-100">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-uppercase tracking-wider small fw-bold text-muted">
                                    <i class="${question.icon || 'fas fa-question-circle'} me-1"></i> ${this.escapeHtml(question.category)}
                                </span>
                                <span class="badge bg-white text-primary border border-primary-subtle rounded-pill px-3">
                                    ${this.currentStep + 1} / ${this.quizData.length}
                                </span>
                            </div>
                            <div class="progress rounded-pill" style="height: 6px; background-color: #e9ecef;">
                                <div class="progress-bar progress-bar-striped progress-bar-animated rounded-pill" 
                                     style="width: ${progress}%; background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body p-4 p-md-5 text-center">
                        <div class="quiz-focus-content animate__animated animate__fadeIn">
                            <h2 class="fw-bold mb-3 mb-md-4 display-6">${this.escapeHtml(question.item)}</h2>
                            ${question.description ? `
                                <div class="bg-light p-3 p-md-4 rounded-4 mb-4 mb-md-5 border-0">
                                    <p class="text-muted mb-0 lead" style="font-size: 1.05rem;">${this.escapeHtml(question.description)}</p>
                                </div>
                            ` : '<div class="mb-4 mb-md-5"></div>'}
                            
                            <div class="quiz-options-grid">
                                ${this.kinkData.preferenceTypes.map((type, idx) => `
                                    <button class="btn btn-lg quiz-answer-btn w-100 mb-2 mb-md-3 py-2 py-md-3 rounded-4 shadow-sm border-0 animate__animated animate__fadeInUp" 
                                            style="animation-delay: ${idx * 0.05}s; background: ${type.color}; color: white;"
                                            data-preference="${type.id}">
                                        <span class="fw-bold">${type.name}</span>
                                    </button>
                                `).join('')}
                                
                                <div class="d-flex gap-2 mt-3 mt-md-4">
                                    <button class="btn btn-light flex-grow-1 py-2 py-md-3 rounded-4 fw-bold text-muted" id="skipQuestion">
                                        <i class="fas fa-forward me-1"></i> Passer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 bg-light px-4 py-3 justify-content-between">
                        <button type="button" class="btn btn-link text-muted text-decoration-none fw-bold" id="quitQuiz">
                            <i class="fas fa-times me-1"></i> Quitter
                        </button>
                        <div class="text-muted small fw-medium">
                            <i class="fas fa-keyboard me-1"></i> Utilisez les boutons pour répondre
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const bsModal = new window.bootstrap.Modal(modal);
        
        modal.querySelectorAll('.quiz-answer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pref = e.currentTarget.dataset.preference;
                this.answers.set(question.item, pref);
                this.nextStep(bsModal, modal);
            });
        });

        document.getElementById('skipQuestion').addEventListener('click', () => {
            this.nextStep(bsModal, modal);
        });

        document.getElementById('quitQuiz').addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment quitter le mode Focus ? Vos réponses actuelles seront conservées.')) {
                this.applyAnswers();
                bsModal.hide();
                modal.addEventListener('hidden.bs.modal', () => modal.remove(), { once: true });
            }
        });

        bsModal.show();
    }

    nextStep(bsModal, modalElement) {
        // Animation de sortie
        const content = modalElement.querySelector('.quiz-focus-content');
        if (content) {
            content.classList.remove('animate__fadeIn');
            content.classList.add('animate__fadeOutLeft');
        }

        setTimeout(() => {
            bsModal.hide();
            modalElement.addEventListener('hidden.bs.modal', () => {
                modalElement.remove();
                this.currentStep++;
                this.showQuestionModal();
            }, { once: true });
        }, 300);
    }

    applyAnswers() {
        if (this.answers.size === 0) return;
        this.answers.forEach((pref, item) => {
            this.preferencesManager.setPreference(item, pref);
        });
        this.statsManager.updateInterface();
        const app = window.getKinkApp ? window.getKinkApp() : null;
        if (app && app.dbManager) {
            this.preferencesManager.saveToIndexedDB(app.dbManager);
        }
    }

    showCompletionModal() {
        this.applyAnswers();
        const modalId = 'quizCompletionModal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div class="modal-header border-0 bg-success text-white p-4">
                        <h5 class="modal-title fw-bold"><i class="fas fa-check-circle me-2"></i> Exploration terminée !</h5>
                    </div>
                    <div class="modal-body p-5 text-center">
                        <div class="display-1 mb-4">✨</div>
                        <h3 class="fw-bold mb-3">Bravo !</h3>
                        <p class="text-muted mb-4">Vous avez complété votre exploration. Vos préférences ont été mises à jour et vos statistiques sont prêtes.</p>
                        <div class="bg-light p-3 rounded-3 mb-4">
                            <span class="fw-bold text-success">${this.answers.size}</span> pratiques évaluées
                        </div>
                    </div>
                    <div class="modal-footer border-0 p-4">
                        <button type="button" class="btn btn-success w-100 py-3 fw-bold rounded-3" data-bs-dismiss="modal">Découvrir mes résultats</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bsModal = new window.bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove(), { once: true });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
