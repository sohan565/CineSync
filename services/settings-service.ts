import { UserSettings, DEFAULT_SETTINGS, MediaDeviceInfoItem } from '@/types/settings';

const SETTINGS_STORAGE_KEY = 'cinesync_user_settings_v1';

export class SettingsService {
  /**
   * Load saved settings from localStorage with default fallbacks.
   */
  static loadSettings(): UserSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to localStorage.
   */
  static saveSettings(settings: UserSettings): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage quota or restriction error
    }
  }

  /**
   * Enumerate system microphones, cameras, and audio output devices.
   */
  static async enumerateDevices(): Promise<{
    mics: MediaDeviceInfoItem[];
    cams: MediaDeviceInfoItem[];
    speakers: MediaDeviceInfoItem[];
  }> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return { mics: [], cams: [], speakers: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const mics: MediaDeviceInfoItem[] = [];
      const cams: MediaDeviceInfoItem[] = [];
      const speakers: MediaDeviceInfoItem[] = [];

      devices.forEach((d) => {
        const item: MediaDeviceInfoItem = {
          deviceId: d.deviceId,
          label: d.label || `${d.kind} (${d.deviceId.substring(0, 5)})`,
          kind: d.kind,
        };

        if (d.kind === 'audioinput') mics.push(item);
        if (d.kind === 'videoinput') cams.push(item);
        if (d.kind === 'audiooutput') speakers.push(item);
      });

      return { mics, cams, speakers };
    } catch {
      return { mics: [], cams: [], speakers: [] };
    }
  }
}
