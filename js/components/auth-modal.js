/**
 * Authentication Modal Component
 */
import { store } from '../store.js';

export class AuthModalComponent {
  constructor() {
    this.container = null;
    this.unsubscribe = null;
  }

  mount(targetElement) {
    this.container = document.createElement('div');
    this.container.className = 'modal-overlay';
    targetElement.appendChild(this.container);

    this.unsubscribe = store.subscribe('ui.activeModal', (activeModal) => {
      if (activeModal === 'AUTH') {
        this.container.classList.add('active');
      } else {
        this.container.classList.remove('active');
      }
    });

    this.render();
  }

  render() {
    if (!this.container) return;
    const auth = store.getSlice('auth');

    this.container.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h2 class="modal-title">Sign In or Continue as Guest</h2>
          <button id="close-auth-modal" class="btn-icon">✕</button>
        </div>

        <form id="auth-form">
          <div class="input-group">
            <label class="input-label">Display Name</label>
            <input type="text" id="display-name-input" class="input-field" value="${auth.displayName}" required />
          </div>

          <div class="input-group">
            <label class="input-label">Email Address (Optional for Registered Accounts)</label>
            <input type="email" id="email-input" class="input-field" placeholder="user@example.com" />
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: var(--space-2);">
            Save Profile
          </button>
        </form>
      </div>
    `;

    this.container.querySelector('#close-auth-modal')?.addEventListener('click', () => {
      store.setState('ui.activeModal', null);
    });

    this.container.querySelector('#auth-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = this.container.querySelector('#display-name-input').value.trim();
      if (name) {
        localStorage.setItem('cinesync_display_name', name);
        store.setState('auth', { displayName: name });
        store.addToast(`Profile saved as "${name}"!`, 'success');
        store.setState('ui.activeModal', null);
      }
    });
  }

  destroy() {
    this.unsubscribe?.();
    this.container?.remove();
  }
}
