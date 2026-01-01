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
        this.quizMode = 'discovery';
    }

    async startQuiz(mode = 'discovery') {
        this.quizMode = mode;
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
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="fas fa-compass"></i> Questionnaire Guidé</h5>
                    </div>
                    <div class="modal-body text-center">
                        <p>Explorez vos préférences en répondant à quelques questions.</p>
                        <div class="alert alert-info text-start">
                            <small>Cliquez sur le niveau d'intérêt pour chaque pratique proposée.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" id="confirmStartQuiz">Commencer</button>
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
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="w-100">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="mb-0"><i class="${question.icon || 'fas fa-question-circle'}"></i> ${this.escapeHtml(question.category)}</h6>
                                <span class="badge bg-primary">${this.currentStep + 1} / ${this.quizData.length}</span>
                            </div>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body text-center">
                        <h4 class="mb-3">${this.escapeHtml(question.item)}</h4>
                        ${question.description ? `<p class="text-muted small">${this.escapeHtml(question.description)}</p>` : ''}
                        <div class="d-grid gap-2 mt-4">
                            ${this.kinkData.preferenceTypes.map(type => `
                                <button class="btn btn-lg quiz-answer-btn" data-preference="${type.id}" style="background: ${type.color}; color: white; border: none;">
                                    ${type.name}
                                </button>
                            `).join('')}
                            <button class="btn btn-outline-secondary mt-2" id="skipQuestion">Passer</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-sm btn-link text-danger" id="quitQuiz">Arrêter le questionnaire</button>
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
            if (confirm('Arrêter le questionnaire ? Vos réponses actuelles seront appliquées.')) {
                this.applyAnswers();
                bsModal.hide();
                modal.addEventListener('hidden.bs.modal', () => modal.remove(), { once: true });
            }
        });

        bsModal.show();
    }

    nextStep(bsModal, modalElement) {
        bsModal.hide();
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
            this.currentStep++;
            this.showQuestionModal();
        }, { once: true });
    }

    applyAnswers() {
        if (this.answers.size === 0) return;
        this.answers.forEach((pref, item) => {
            this.preferencesManager.setPreference(item, pref);
        });
        this.statsManager.updateInterface();
        // Sauvegarder dans IndexedDB si disponible
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
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title"><i class="fas fa-check-circle"></i> Terminé !</h5>
                    </div>
                    <div class="modal-body text-center">
                        <div class="display-1 mb-3">🎉</div>
                        <p>Vos préférences ont été mises à jour avec succès.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Voir mes résultats</button>
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
