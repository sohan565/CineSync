import React from 'react';
import { ThemeMode } from '@/types/settings';
import { cn } from '@/lib/utils';

interface ThemePickerProps {
  selected: ThemeMode;
  onSelect: (theme: ThemeMode) => void;
}

const THEMES: Array<{
  id: ThemeMode;
  name: string;
  desc: string;
  bgHex: string;
  accentHex: string;
}> = [
  {
    id: 'dark',
    name: 'Dark Cinematic',
    desc: 'Default sleek slate dark mode.',
    bgHex: '#0f172a',
    accentHex: '#10b981',
  },
  {
    id: 'midnight',
    name: 'Midnight OLED',
    desc: 'Deep true black for OLED displays.',
    bgHex: '#000000',
    accentHex: '#3b82f6',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    desc: 'Vibrant neon purple and pink aesthetics.',
    bgHex: '#180b24',
    accentHex: '#ec4899',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    desc: 'Rich deep emerald and green tones.',
    bgHex: '#062016',
    accentHex: '#34d399',
  },
];

export function ThemePicker({ selected, onSelect }: ThemePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Theme mode preset"
      className="grid grid-cols-2 gap-3"
    >
      {THEMES.map((theme) => {
        const isSelected = selected === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(theme.id)}
            className={cn(
              'flex flex-col gap-2 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
              isSelected
                ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                : 'border-border bg-card/50 hover:border-border/80 hover:bg-card'
            )}
          >
            {/* Color Swatch Preview */}
            <div
              className="flex h-10 w-full items-center justify-end rounded-lg p-2 shadow-inner"
              style={{ backgroundColor: theme.bgHex }}
            >
              <div
                className="h-4 w-4 rounded-full shadow-sm"
                style={{ backgroundColor: theme.accentHex }}
              />
            </div>

            <div>
              <p className="text-xs font-bold text-foreground">{theme.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {theme.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
