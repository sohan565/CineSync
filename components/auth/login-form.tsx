'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  onSuccess: () => void;
  onSubmit: (data: LoginInput) => Promise<void>;
}

export function LoginForm({ onSuccess, onSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const handleFormSubmit = async (data: LoginInput) => {
    try {
      setServerError(null);
      await onSubmit(data);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      aria-label="Login form"
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
        id="email"
        label="Email Address"
        error={errors.email?.message}
        required
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          hasError={!!errors.email}
          ariaDescribedBy={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
      </FormField>

      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
        required
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            hasError={!!errors.password}
            ariaDescribedBy={errors.password ? 'password-error' : undefined}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={0}
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
      </FormField>

      <div className="flex items-center justify-end">
        <a
          href="/forgot-password"
          className="text-xs text-emerald-500 hover:underline focus-visible:outline-none focus-visible:underline"
        >
          Forgot password?
        </a>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        loadingText="Signing in..."
        className="w-full"
      >
        Sign In
      </Button>
    </form>
  );
}
