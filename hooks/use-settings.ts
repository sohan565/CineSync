'use client';

import { useState, useEffect, useCallback } from 'react';
import { SettingsService } from '@/services/settings-service';
import { UserSettings, MediaDeviceInfoItem } from '@/types/settings';
import { toast } from '@/hooks/use-toast';

export function useSettings() {
  const [settings, setSettingsState] = useState<UserSettings>(() => SettingsService.loadSettings());
  const [mics, setMics] = useState<MediaDeviceInfoItem[]>([]);
  const [cams, setCams] = useState<MediaDeviceInfoItem[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfoItem[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Load available devices
  const refreshDevices = useCallback(async () => {
    setIsLoadingDevices(true);
    try {
      const { mics, cams, speakers } = await SettingsService.enumerateDevices();
      setMics(mics);
      setCams(cams);
      setSpeakers(speakers);
    } catch {
      // Ignore enumeration failure
    } finally {
      setIsLoadingDevices(false);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Update setting patch and persist
  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...patch };
      SettingsService.saveSettings(updated);
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = SettingsService.loadSettings();
    setSettingsState(defaults);
    SettingsService.saveSettings(defaults);
    toast.success('Settings reset to defaults.');
  }, []);

  return {
    settings,
    updateSettings,
    resetToDefaults,
    mics,
    cams,
    speakers,
    isLoadingDevices,
    refreshDevices,
  };
}
