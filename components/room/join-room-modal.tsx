'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { joinRoomSchema, JoinRoomInput } from '@/lib/validations/room';
import { useJoinRoom } from '@/hooks/use-room';
import { toast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/modal';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill the slug when arriving from an invite link */
  prefillSlug?: string;
  /** If the room requires a password */
  requiresPassword?: boolean;
}

export function JoinRoomModal({
  isOpen,
  onClose,
  prefillSlug,
  requiresPassword = false,
}: JoinRoomModalProps) {
  const router = useRouter();
  const { mutateAsync: joinRoom } = useJoinRoom();
  const [showPasswordField, setShowPasswordField] = useState(requiresPassword);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JoinRoomInput>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: { slug: prefillSlug ?? '', password: '' },
  });

  // Sync prefillSlug when it changes (e.g., invite link navigation)
  useEffect(() => {
    if (prefillSlug) {
      setValue('slug', prefillSlug);
    }
  }, [prefillSlug, setValue]);

  const handleClose = () => {
    reset();
    setShowPasswordField(requiresPassword);
    onClose();
  };

  const onSubmit = async (data: JoinRoomInput) => {
    try {
      const room = await joinRoom(data);
      toast.success(`Joined "${room.name}"!`);
      handleClose();
      router.push(`/room/${room.slug}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join room.';

      if (msg.toLowerCase().includes('password')) {
        setShowPasswordField(true);
        setError('password', { message: msg });
      } else if (msg.toLowerCase().includes('not found')) {
        setError('slug', { message: msg });
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Join a Watch Room"
      description="Enter a room code to join an existing session."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

        {/* Room Code */}
        <FormField
          id="join-slug"
          label="Room Code"
          error={errors.slug?.message}
          required
          hint="6–12 character alphanumeric code or paste the invite link."
        >
          <Input
            id="join-slug"
            type="text"
            autoComplete="off"
            placeholder="e.g. ab3xk29f"
            hasError={!!errors.slug}
            autoFocus={!prefillSlug}
            spellCheck={false}
            className="font-mono tracking-widest"
            {...register('slug', {
              // Strip full invite URLs down to just the slug
              setValueAs: (v: string) => {
                const urlMatch = v.match(/\/room\/([a-zA-Z0-9]+)/);
                return urlMatch ? urlMatch[1] : v.trim().toLowerCase();
              },
            })}
          />
        </FormField>

        {/* Password (shown conditionally) */}
        {showPasswordField ? (
          <FormField
            id="join-password"
            label="Room Password"
            error={errors.password?.message}
            required
          >
            <Input
              id="join-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter room password"
              hasError={!!errors.password}
              autoFocus={showPasswordField}
              {...register('password')}
            />
          </FormField>
        ) : (
          <button
            type="button"
            onClick={() => setShowPasswordField(true)}
            className="self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Room has a password?
          </button>
        )}

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
            loadingText="Joining…"
            className="flex-1"
          >
            Join Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
