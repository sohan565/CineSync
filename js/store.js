/**
 * Modular Slice-Based Reactive Pub/Sub State Store for CineSync
 * @module store
 */

/**
 * @typedef {import('../types').UserProfile} UserProfile
 * @typedef {import('../types').RoomState} RoomState
 * @typedef {import('../types').PlayerSyncState} PlayerSyncState
 * @typedef {import('../types').Participant} Participant
 * @typedef {import('../types').ChatMessage} ChatMessage
 * @typedef {import('../types').UIState} UIState
 * @typedef {import('../types').ToastType} ToastType
 */

class Store {
  constructor() {
    this.state = {
      auth: {
        id: localStorage.getItem('cinesync_user_id') || this._generateGuestId(),
        displayName: localStorage.getItem('cinesync_display_name') || 'Guest Explorer',
        avatarUrl: null,
        isGuest: true
      },
      room: null, // RoomState
      playerSync: {
        playbackState: 'PAUSED',
        currentTime: 0,
        playbackRate: 1.0,
        mediaSource: null,
        isLobbyActive: false,
        readyCheckActive: false,
        serverTimeOffset: 0
      },
      participants: [], // Participant[]
      chat: {
        messages: [],
        pinnedMessages: [],
        isTypingUserIds: new Set()
      },
      webRTC: {
        activeSpeakers: new Set(),
        localAudioMuted: false,
        localVideoOn: false
      },
      ui: {
        mode: 'STANDARD',
        activeModal: null,
        toasts: []
      }
    };

    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  _generateGuestId() {
    const id = 'guest_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('cinesync_user_id', id);
    return id;
  }

  /**
   * Get full state object
   */
  getState() {
    return this.state;
  }

  /**
   * Get specific slice
   * @param {keyof import('../types').StoreState} sliceKey
   */
  getSlice(sliceKey) {
    return this.state[sliceKey];
  }

  /**
   * Subscribe to specific slice or key paths
   * @param {string} sliceKey Path e.g. 'auth', 'playerSync', 'ui.toasts'
   * @param {Function} callback Callback handler
   */
  subscribe(sliceKey, callback) {
    if (!this.listeners.has(sliceKey)) {
      this.listeners.set(sliceKey, new Set());
    }
    this.listeners.get(sliceKey).add(callback);

    // Initial immediate invocation
    callback(this._getNestedValue(this.state, sliceKey));

    return () => {
      this.listeners.get(sliceKey)?.delete(callback);
    };
  }

  /**
   * Update slice state and notify subscribers
   * @param {string} sliceKey Slice key name
   * @param {any} partialValue Partial or full slice value
   */
  setState(sliceKey, partialValue) {
    const oldValue = this._getNestedValue(this.state, sliceKey);

    if (typeof partialValue === 'object' && partialValue !== null && !Array.isArray(partialValue)) {
      this._setNestedValue(this.state, sliceKey, { ...oldValue, ...partialValue });
    } else {
      this._setNestedValue(this.state, sliceKey, partialValue);
    }

    const newValue = this._getNestedValue(this.state, sliceKey);

    // Trigger exact key subscribers
    if (this.listeners.has(sliceKey)) {
      this.listeners.get(sliceKey).forEach(cb => cb(newValue));
    }

    // Trigger root slice subscribers if path was nested (e.g. 'ui.activeModal' triggers 'ui')
    const rootSlice = sliceKey.split('.')[0];
    if (rootSlice !== sliceKey && this.listeners.has(rootSlice)) {
      this.listeners.get(rootSlice).forEach(cb => cb(this.state[rootSlice]));
    }
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  _setNestedValue(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((acc, part) => (acc[part] = acc[part] || {}), obj);
    target[last] = value;
  }

  /**
   * Dispatch Toast Notification
   * @param {string} message Text message
   * @param {ToastType} type Toast type
   */
  addToast(message, type = 'info') {
    const toast = { id: Date.now(), message, type };
    const currentToasts = [...this.state.ui.toasts, toast];
    this.setState('ui.toasts', currentToasts);

    setTimeout(() => {
      const updated = this.state.ui.toasts.filter(t => t.id !== toast.id);
      this.setState('ui.toasts', updated);
    }, 4000);
  }
}

export const store = new Store();
