/**
 * CineSync Main Application Entry Point
 */
import { store } from './store.js';
import { HeaderComponent } from './components/header.js';
import { LandingComponent } from './components/landing.js';
import { AuthModalComponent } from './components/auth-modal.js';
import { ToastComponent } from './components/toast.js';

class App {
  constructor() {
    this.root = document.getElementById('app');
    this.header = new HeaderComponent();
    this.landing = new LandingComponent();
    this.authModal = new AuthModalComponent();
    this.toast = new ToastComponent();
    this.currentView = null;
  }

  init() {
    console.log('🎬 CineSync v1.0 Pro Initializing...');
    
    // Mount global UI widgets
    this.header.mount(this.root);
    this.toast.mount(this.root);
    this.authModal.mount(this.root);

    // Main content view container
    this.contentContainer = document.createElement('main');
    this.contentContainer.id = 'content-container';
    this.contentContainer.style.flex = '1';
    this.contentContainer.style.display = 'flex';
    this.contentContainer.style.flexDirection = 'column';
    this.root.appendChild(this.contentContainer);

    // Bind Hash Router
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    console.log(`📍 Navigating to route: ${hash}`);

    // Clear previous view
    if (this.currentView) {
      this.currentView.destroy?.();
      this.currentView = null;
    }
    this.contentContainer.innerHTML = '';

    if (hash === '/') {
      this.currentView = new LandingComponent();
      this.currentView.mount(this.contentContainer);
    } else if (hash.startsWith('/room/')) {
      const slug = hash.replace('/room/', '');
      this.renderRoomPlaceholder(slug);
    } else {
      window.location.hash = '/';
    }
  }

  renderRoomPlaceholder(slug) {
    store.setState('currentRoom', { slug, name: `Watch Party #${slug}` });
    this.contentContainer.innerHTML = `
      <div class="room-container">
        <div class="room-main">
          <div class="player-wrapper">
            <div style="text-align: center; color: var(--text-secondary);">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; color: var(--accent-emerald);">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <h2>Watch Room Ready (#${slug})</h2>
              <p style="margin-top: 8px;">Media Sync Engine & Player Component loading in Milestone 2...</p>
            </div>
          </div>
          <div class="webrtc-bar">
            <span style="font-size: 12px; color: var(--text-muted);">WebRTC AV Grid loading in Milestone 4...</span>
          </div>
        </div>

        <div class="chat-sidebar">
          <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); font-weight: 700;">
            Live Chat
          </div>
          <div style="flex: 1; padding: 16px; color: var(--text-muted); font-size: 14px;">
            Realtime Chat & Reaction particles loading in Milestone 3...
          </div>
        </div>
      </div>
    `;
    store.addToast(`Joined room /room/${slug}`, 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
