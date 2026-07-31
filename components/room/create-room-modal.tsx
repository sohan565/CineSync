'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createRoomSchema, CreateRoomInput } from '@/lib/validations/room';
import { useCreateRoom } from '@/hooks/use-room';
import { toast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIVACY_OPTIONS = [
  {
    value: 'unlisted' as const,
    label: 'Unlisted',
    description: 'Only people with the link can join',
    icon: '🔗',
  },
  {
    value: 'public' as const,
    label: 'Public',
    description: 'Anyone can discover and join',
    icon: '🌍',
  },
  {
    value: 'password' as const,
    label: 'Password',
    description: 'Requires a password to join',
    icon: '🔒',
  },
];

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const { mutateAsync: createRoom } = useCreateRoom();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      privacy: 'unlisted',
      permissionMode: 'host_only',
      password: '',
    },
  });

  const privacy = watch('privacy');

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: CreateRoomInput) => {
    try {
      const room = await createRoom(data);
      toast.success(`"${room.name}" created! Redirecting…`);
      handleClose();
      router.push(`/room/${room.slug}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create room.';
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create a Watch Room"
      description="Set up your room and invite friends to watch together."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

        {/* Room Name */}
        <FormField id="room-name" label="Room Name" error={errors.name?.message} required>
          <Input
            id="room-name"
            type="text"
            autoComplete="off"
            placeholder="e.g. Friday Night Movies"
            hasError={!!errors.name}
            autoFocus
            {...register('name')}
          />
        </FormField>

        {/* Privacy */}
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Privacy
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {PRIVACY_OPTIONS.map((opt) => {
              const isSelected = privacy === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setValue('privacy', opt.value, { shouldValidate: true });
                    if (opt.value !== 'password') setValue('password', '');
                  }}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-border bg-muted/30 hover:border-muted-foreground/40'
                  }`}
                >
                  <span className="text-lg" aria-hidden="true">{opt.icon}</span>
                  <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-400' : 'text-foreground'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Password field — shown only when privacy = 'password' */}
        {privacy === 'password' && (
          <FormField
            id="room-password"
            label="Room Password"
            error={errors.password?.message}
            required
            hint="Min. 4 characters. Share this with your friends."
          >
            <div className="relative">
              <Input
                id="room-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter a room password"
                hasError={!!errors.password}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </FormField>
        )}

        {/* Permission Mode */}
        <FormField id="permission-mode" label="Playback Control">
          <div className="flex items-center gap-3">
            {(['host_only', 'open'] as const).map((mode) => {
              const isSelected = watch('permissionMode') === mode;
              return (
                <label
                  key={mode}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-3 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <input
                    type="radio"
                    value={mode}
                    className="sr-only"
                    {...register('permissionMode')}
                  />
                  <span className="flex-1 text-xs font-medium text-foreground">
                    {mode === 'host_only' ? '👑 Host Only' : '🤝 Everyone'}
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {watch('permissionMode') === 'host_only'
              ? 'Only you can control playback.'
              : 'All members can pause, seek, and control playback.'}
          </p>
        </FormField>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            loadingText="Creating…"
            className="flex-1"
          >
            Create Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
