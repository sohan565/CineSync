'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
import { DeviceSelector } from '@/components/settings/device-selector';
import { ThemePicker } from '@/components/settings/theme-picker';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'devices' | 'appearance' | 'audio' | 'sync';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('devices');
  const {
    settings,
    updateSettings,
    resetToDefaults,
    mics,
    cams,
    speakers,
    refreshDevices,
  } = useSettings();

  const handleSave = () => {
    toast.success('Settings saved successfully.');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings & Preferences"
      description="Configure audio/video devices, visual theme, and playback parameters."
      className="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Settings categories"
          className="flex border-b border-border gap-2"
        >
          {[
            { id: 'devices', label: '🎙️ Devices' },
            { id: 'appearance', label: '🎨 Theme' },
            { id: 'audio', label: '🔊 Audio & Sounds' },
            { id: 'sync', label: '⚡ Sync Engine' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                'border-b-2 px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none',
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Media Devices */}
        {activeTab === 'devices' && (
          <div className="flex flex-col gap-4 py-2">
            <DeviceSelector
              id="mic-select"
              label="Microphone"
              icon="🎙️"
              devices={mics}
              selectedId={settings.selectedMicId}
              onChange={(id) => updateSettings({ selectedMicId: id })}
              onRefresh={refreshDevices}
            />

            <DeviceSelector
              id="cam-select"
              label="Camera"
              icon="📹"
              devices={cams}
              selectedId={settings.selectedCamId}
              onChange={(id) => updateSettings({ selectedCamId: id })}
              onRefresh={refreshDevices}
            />

            <DeviceSelector
              id="speaker-select"
              label="Audio Output / Speakers"
              icon="🔊"
              devices={speakers}
              selectedId={settings.selectedSpeakerId}
              onChange={(id) => updateSettings({ selectedSpeakerId: id })}
              onRefresh={refreshDevices}
            />
          </div>
        )}

        {/* Tab 2: Theme / Appearance */}
        {activeTab === 'appearance' && (
          <div className="flex flex-col gap-3 py-2">
            <label className="text-xs font-semibold text-foreground">
              Select Room Theme
            </label>
            <ThemePicker
              selected={settings.themeMode}
              onSelect={(mode) => updateSettings({ themeMode: mode })}
            />
          </div>
        )}

        {/* Tab 3: Audio & Sound Effects */}
        {activeTab === 'audio' && (
          <div className="flex flex-col gap-4 py-2 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-bold text-foreground">Chat Sound Effects</p>
                <p className="text-muted-foreground">Play subtle chime when new messages arrive.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableChatSound}
                onChange={(e) => updateSettings({ enableChatSound: e.target.checked })}
                aria-label="Enable chat sound effects"
                className="h-4 w-4 rounded accent-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-bold text-foreground">Reaction Sound Effects</p>
                <p className="text-muted-foreground">Play pop sound when members send reactions.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableReactionSound}
                onChange={(e) => updateSettings({ enableReactionSound: e.target.checked })}
                aria-label="Enable reaction sound effects"
                className="h-4 w-4 rounded accent-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Sync Engine Parameters */}
        {activeTab === 'sync' && (
          <div className="flex flex-col gap-4 py-2 text-xs">
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex justify-between">
                <label htmlFor="sync-tolerance" className="font-bold text-foreground">
                  NTP Sync Soft Drift Tolerance
                </label>
                <span className="font-mono text-emerald-400 font-bold">
                  {settings.syncToleranceMs} ms
                </span>
              </div>
              <input
                id="sync-tolerance"
                type="range"
                min={100}
                max={500}
                step={25}
                value={settings.syncToleranceMs}
                onChange={(e) => updateSettings({ syncToleranceMs: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <p className="text-[11px] text-muted-foreground">
                Playback rate nudges will only engage if drift exceeds this threshold.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Defaults
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="md" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
