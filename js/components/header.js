/**
 * Application Header Component
 */
import { store } from '../store.js';

export class HeaderComponent {
  constructor() {
    this.container = null;
    this.unsubscribe = null;
  }

  mount(targetElement) {
    this.container = document.createElement('header');
    this.container.className = 'app-header';
    targetElement.appendChild(this.container);

    this.unsubscribe = store.subscribe('auth', () => this.render());
  }

  render() {
    if (!this.container) return;
    const auth = store.getSlice('auth');

    this.container.innerHTML = `
      <a href="#" class="brand-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        CineSync
      </a>

      <div class="header-controls">
        <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">
          ${auth.displayName} ${auth.isGuest ? '(Guest)' : ''}
        </span>
        <button id="auth-btn" class="btn btn-secondary">
          ${auth.isGuest ? 'Sign In / Register' : 'My Dashboard'}
        </button>
      </div>
    `;

    this.container.querySelector('#auth-btn')?.addEventListener('click', () => {
      store.setState('ui.activeModal', 'AUTH');
    });
  }

  destroy() {
    this.unsubscribe?.();
    this.container?.remove();
  }
}
