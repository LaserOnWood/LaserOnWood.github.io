/**
 * Core Utilities & Managers - KinkV2 Optimized
 */
import { CONFIG } from './config.js';

// --- UTILITAIRES DE BASE ---
export const escapeHtml = (t) => {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
};

export const getDateString = () => new Date().toISOString().split('T')[0];

export const readFileAsJson = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = (e) => { try { res(JSON.parse(e.target.result)); } catch (err) { rej(new Error('JSON invalide')); } };
    r.onerror = () => rej(new Error('Erreur lecture'));
    r.readAsText(f);
});

export const downloadJsonFile = (data, name) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

export const debounce = (fn, d) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
};

// --- TOAST MANAGER ---
export class ToastManager {
    static showToast(msg, type = 'success') {
        document.querySelectorAll('.toast-notification').forEach(t => t.remove());
        const t = document.createElement('div');
        t.className = `alert alert-${type} position-fixed toast-notification animate__animated animate__fadeInUp`;
        t.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);';
        const icons = { success: 'check-circle', warning: 'exclamation-triangle', danger: 'exclamation-circle' };
        t.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'} me-2"></i>${escapeHtml(msg)}`;
        document.body.appendChild(t);
        setTimeout(() => {
            t.classList.replace('animate__fadeInUp', 'animate__fadeOut');
            setTimeout(() => t.remove(), 400);
        }, CONFIG.toastDuration || 3000);
    }
}

// --- MODAL MANAGER ---
export class ModalManager {
    static showPseudoModal(onConfirm) {
        return new Promise((res) => {
            const m = document.createElement('div');
            m.className = 'modal fade';
            m.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header border-0 p-4 pb-0">
                            <h5 class="fw-bold"><i class="fas fa-user-circle me-2"></i> Personnaliser l'image</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <input type="text" class="form-control form-control-lg rounded-3 mb-3" id="pseudoInput" placeholder="Votre pseudo (optionnel)" maxlength="30">
                            <div class="alert alert-light border-0 small mb-0">
                                <strong>Aperçu :</strong> <span id="titlePreview">Ma liste de Kink</span>
                            </div>
                        </div>
                        <div class="modal-footer border-0 p-4 pt-0">
                            <button type="button" class="btn btn-light px-4" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-primary px-4 fw-bold" id="confirmPseudoBtn">Générer</button>
                        </div>
                    </div>
                </div>`;
            document.body.appendChild(m);
            const input = m.querySelector('#pseudoInput');
            const preview = m.querySelector('#titlePreview');
            input.oninput = () => preview.textContent = input.value.trim() ? `La liste de Kink de ${input.value.trim()}` : 'Ma liste de Kink';
            m.querySelector('#confirmPseudoBtn').onclick = () => { onConfirm(input.value.trim() || null); bootstrap.Modal.getInstance(m).hide(); };
            m.addEventListener('hidden.bs.modal', () => { m.remove(); res(); });
            new bootstrap.Modal(m).show();
        });
    }
}
