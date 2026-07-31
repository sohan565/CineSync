/**
 * Landing Page Component
 */
import { store } from '../store.js';
import { generateRoomSlug } from '../utils/helpers.js';

export class LandingComponent {
  constructor() {
    this.container = null;
  }

  mount(targetElement) {
    this.container = document.createElement('div');
    this.container.className = 'hero-container';
    targetElement.appendChild(this.container);
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <h1 class="hero-title">
        Watch Videos Together in <span>Perfect Sync</span>
      </h1>
      <p class="hero-subtitle">
        Browser-based social watch party platform with sub-second playback synchronization, live chat, emoji reactions, and WebRTC voice & video calls.
      </p>

      <div class="hero-actions">
        <button id="create-room-btn" class="btn btn-primary" style="padding: 12px 28px; font-size: 16px;">
          + Create Watch Room
        </button>
        <button id="join-room-btn" class="btn btn-secondary" style="padding: 12px 28px; font-size: 16px;">
          Enter Room Link
        </button>
      </div>
    `;

    this.container.querySelector('#create-room-btn')?.addEventListener('click', () => {
      const slug = generateRoomSlug();
      store.addToast(`Room created! Launching /room/${slug}...`, 'success');
      window.location.hash = `/room/${slug}`;
    });

    this.container.querySelector('#join-room-btn')?.addEventListener('click', () => {
      const slug = prompt('Enter Room Link or Slug (e.g. cinesync-x9k2p1):');
      if (slug) {
        const cleanSlug = slug.replace(/.*\/room\//, '').trim();
        window.location.hash = `/room/${cleanSlug}`;
      }
    });
  }

  destroy() {
    this.container?.remove();
  }
}
