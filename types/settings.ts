// ─── Settings & Customization Domain Types ────────────────────────────────────

export type ThemeMode = 'dark' | 'midnight' | 'cyberpunk' | 'emerald';

export interface UserSettings {
  selectedMicId: string;
  selectedCamId: string;
  selectedSpeakerId: string;
  enableChatSound: boolean;
  enableReactionSound: boolean;
  themeMode: ThemeMode;
  syncToleranceMs: number; // 100ms to 500ms
  hardwareAcceleration: boolean;
}

export interface MediaDeviceInfoItem {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export const DEFAULT_SETTINGS: UserSettings = {
  selectedMicId: '',
  selectedCamId: '',
  selectedSpeakerId: '',
  enableChatSound: true,
  enableReactionSound: true,
  themeMode: 'dark',
  syncToleranceMs: 300,
  hardwareAcceleration: true,
};
