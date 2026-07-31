'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { guestSchema, GuestInput } from '@/lib/validations/auth';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GuestFormProps {
  onSuccess: () => void;
  onSubmit: (data: GuestInput) => Promise<void>;
}

export function GuestForm({ onSuccess, onSubmit }: GuestFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuestInput>({
    resolver: zodResolver(guestSchema),
    mode: 'onBlur',
    defaultValues: { displayName: '' },
  });

  const handleFormSubmit = async (data: GuestInput) => {
    try {
      setServerError(null);
      await onSubmit(data);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Guest setup failed.';
      setServerError(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      aria-label="Guest entry form"
      className="flex flex-col gap-4"
    >
      {serverError && (
        <div role="alert" aria-live="assertive"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {serverError}
        </div>
      )}

      <FormField
        id="guest-name"
        label="Choose a Display Name"
        error={errors.displayName?.message}
        required
        hint="This is shown to other room participants."
      >
        <Input
          id="guest-name"
          type="text"
          autoComplete="nickname"
          placeholder="e.g. MovieFan99"
          hasError={!!errors.displayName}
          ariaDescribedBy={errors.displayName ? 'guest-name-error' : 'guest-name-hint'}
          {...register('displayName')}
        />
      </FormField>

      <Button
        type="submit"
        variant="secondary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Entering..."
        className="w-full"
      >
        Continue as Guest
      </Button>
    </form>
  );
}
