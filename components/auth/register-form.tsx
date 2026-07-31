'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/lib/validations/auth';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RegisterFormProps {
  onSuccess: () => void;
  onSubmit: (data: RegisterInput) => Promise<void>;
}

export function RegisterForm({ onSuccess, onSubmit }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const passwordValue = watch('password', '');

  const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (pw.length === 0) return { label: '', color: '', width: '0%' };
    if (pw.length < 8) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
    if (!/(?=.*[0-9])/.test(pw)) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (pw.length < 12) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = getPasswordStrength(passwordValue);

  const handleFormSubmit = async (data: RegisterInput) => {
    try {
      setServerError(null);
      await onSubmit(data);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      aria-label="Registration form"
      className="flex flex-col gap-4"
    >
      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {serverError}
        </div>
      )}

      <FormField
        id="displayName"
        label="Display Name"
        error={errors.displayName?.message}
        required
        hint="2–24 characters. Shown to other participants."
      >
        <Input
          id="displayName"
          type="text"
          autoComplete="nickname"
          placeholder="MovieFan99"
          hasError={!!errors.displayName}
          ariaDescribedBy={errors.displayName ? 'displayName-error' : 'displayName-hint'}
          {...register('displayName')}
        />
      </FormField>

      <FormField
        id="reg-email"
        label="Email Address"
        error={errors.email?.message}
        required
      >
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          hasError={!!errors.email}
          ariaDescribedBy={errors.email ? 'reg-email-error' : undefined}
          {...register('email')}
        />
      </FormField>

      <FormField
        id="reg-password"
        label="Password"
        error={errors.password?.message}
        required
      >
        <div className="relative">
          <Input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min. 8 chars with 1 number"
            hasError={!!errors.password}
            ariaDescribedBy="password-strength"
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
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {/* Password Strength Meter */}
        {passwordValue.length > 0 && (
          <div id="password-strength" aria-live="polite" className="mt-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-border">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            {strength.label && (
              <p className="mt-1 text-xs text-muted-foreground">
                Strength: <span className="font-semibold">{strength.label}</span>
              </p>
            )}
          </div>
        )}
      </FormField>

      <FormField
        id="confirmPassword"
        label="Confirm Password"
        error={errors.confirmPassword?.message}
        required
      >
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          hasError={!!errors.confirmPassword}
          ariaDescribedBy={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          {...register('confirmPassword')}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Creating account..."
        className="w-full"
      >
        Create Account
      </Button>
    </form>
  );
}
