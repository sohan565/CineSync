/**
 * Toast Notification Component
 */
import { store } from '../store.js';

export class ToastComponent {
  constructor() {
    this.container = null;
    this.unsubscribe = null;
  }

  mount(targetElement) {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    targetElement.appendChild(this.container);

    this.unsubscribe = store.subscribe('ui.toasts', (toasts) => {
      this.render(toasts || []);
    });
  }

  render(toasts = []) {
    if (!this.container) return;
    this.container.innerHTML = toasts.map(toast => `
      <div class="toast toast-${toast.type}">
        <span>${toast.message}</span>
      </div>
    `).join('');
  }

  destroy() {
    this.unsubscribe?.();
    this.container?.remove();
  }
}
