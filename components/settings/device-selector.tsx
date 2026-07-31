import React from 'react';
import { MediaDeviceInfoItem } from '@/types/settings';
import { Button } from '@/components/ui/button';

interface DeviceSelectorProps {
  label: string;
  id: string;
  devices: MediaDeviceInfoItem[];
  selectedId: string;
  onChange: (deviceId: string) => void;
  onRefresh?: () => void;
  icon: string;
}

export function DeviceSelector({
  label,
  id,
  devices,
  selectedId,
  onChange,
  onRefresh,
  icon,
}: DeviceSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <span aria-hidden="true">{icon}</span>
          {label}
        </label>
        {onRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            title="Refresh device list"
          >
            🔄 Refresh
          </Button>
        )}
      </div>

      <select
        id={id}
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="">Default Device</option>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
}
