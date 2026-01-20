import { useState, type FormEvent, type ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';

type WaitlistSegment = 'regular' | 'creator';

interface SupabaseWaitlistFormProps {
  segment?: WaitlistSegment;
}

interface WaitlistFormState {
  email: string;
  betaTesterInterest: boolean;
  status: 'idle' | 'submitting' | 'success' | 'duplicate' | 'error';
  errorMessage: string;
}

export default function SupabaseWaitlistForm({ 
  segment = 'regular' 
}: SupabaseWaitlistFormProps) {
  const [formState, setFormState] = useState<WaitlistFormState>({
    email: '',
    betaTesterInterest: false,
    status: 'idle',
    errorMessage: '',
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormState((prev) => ({
      ...prev,
      email: e.target.value,
      errorMessage: '',
    }));
  };

  const handleBetaTesterChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormState((prev) => ({
      ...prev,
      betaTesterInterest: e.target.checked,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const trimmedEmail = formState.email.trim().toLowerCase();

    if (!trimmedEmail) {
      setFormState((prev) => ({
        ...prev,
        errorMessage: 'Please enter your email address.',
      }));
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setFormState((prev) => ({
        ...prev,
        errorMessage: 'Please enter a valid email address.',
      }));
      return;
    }

    setFormState((prev) => ({ ...prev, status: 'submitting', errorMessage: '' }));

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{
          email: trimmedEmail,
          segment,
          wants_tester_access: formState.betaTesterInterest,
          status: 'pending',
          wave_number: 1
        }]);

      if (error) {
        // Handle duplicate email (unique constraint violation)
        const isDuplicate =
          error.code === '23505' ||
          error.message?.includes('duplicate') ||
          (error as { status?: number }).status === 409;

        if (isDuplicate) {
          setFormState((prev) => ({
            ...prev,
            status: 'duplicate',
          }));
          return;
        }

        console.error('Waitlist submission error:', error);
        setFormState((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: 'Something went wrong. Please try again.',
        }));
        return;
      }

      // Send role-based signup email with magic link included
      // Uses manual magic link generation to bypass Supabase's built-in emails
      fetch('/api/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, type: 'signup' }),
      })
        .then((res) => {
          if (!res.ok) console.error('[WaitlistForm] Failed to send signup email with magic link');
          else console.log('[WaitlistForm] Signup email with magic link sent successfully');
        })
        .catch((err) => console.error('[WaitlistForm] Email send error:', err));

      setFormState({
        email: '',
        betaTesterInterest: false,
        status: 'success',
        errorMessage: '',
      });
    } finally {
      setFormState((prev) =>
        prev.status === 'submitting'
          ? { ...prev, status: 'idle' }
          : prev
      );
    }
  };

  const { email, betaTesterInterest, status, errorMessage } = formState;
  const isSubmitting = status === 'submitting';

  // Segment-specific content
  const content = {
    regular: {
      heading: 'Be the first to know',
      subheading: 'Join the waitlist for phased access.',
      buttonText: 'Join the waitlist',
      successHeading: "You're on the waitlist",
      successMessage: 'Welcome to the Lorem Curae community.',
    },
    creator: {
      heading: 'Join the Creator Waitlist',
      subheading: 'Get early access and priority onboarding when we launch.',
      buttonText: 'Join the Creator Waitlist',
      successHeading: "You're on the creator waitlist",
      successMessage: "We'll be in touch with exclusive creator updates.",
    },
  };

  const { heading, subheading, buttonText, successHeading, successMessage } = content[segment];

  return (
    <div className="max-w-xl mx-auto px-4">
      {status !== 'success' && status !== 'duplicate' ? (
        <form
          onSubmit={handleSubmit}
          className="animate-fade-in space-y-6"
          noValidate
        >
          {/* Heading */}
          <div className="text-center space-y-3">
            <h2 className="font-serif text-3xl md:text-4xl text-sage-800 tracking-tight">
              {heading}
            </h2>
            <p className="text-sage-600 text-lg font-light">
              {subheading}
            </p>
          </div>

          {/* Input Group */}
          <div className="space-y-4">
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                disabled={isSubmitting}
                aria-label="Email address"
                aria-invalid={!!errorMessage}
                aria-describedby={errorMessage ? 'email-error' : undefined}
                className={`
                  w-full rounded-full border bg-white
                  px-6 py-4 text-sage-800 placeholder-sage-400
                  transition-all duration-300 ease-out
                  focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500
                  disabled:opacity-60 disabled:cursor-not-allowed
                  ${errorMessage 
                    ? 'border-coral-400 focus:border-coral-500 focus:ring-coral-500/30' 
                    : 'border-slate-200 hover:border-sage-300'
                  }
                `}
              />
              
              {/* Loading Spinner inside input */}
              {isSubmitting && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <div className="h-5 w-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p
                id="email-error"
                role="alert"
                className="text-coral-600 text-sm pl-6 animate-slide-up"
              >
                {errorMessage}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full rounded-full bg-sage-600 text-white
                px-6 py-4 font-medium text-lg
                transition-all duration-300 ease-out
                hover:bg-sage-700 hover:shadow-lg hover:shadow-sage-600/20
                focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2
                active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none
              `}
            >
              {isSubmitting ? 'Joining...' : buttonText}
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-sage-500 text-sm font-light">
            We respect your privacy. Unsubscribe at any time.
          </p>

          {/* Beta Tester Interest */}
          <div className="pt-6 mt-2 border-t border-slate-200/60">
            <p className="text-sage-700 text-sm font-medium mb-3 text-center">
              Are you interested in testing new features early?
            </p>
            <label
              htmlFor="betaTesterInterest"
              className="flex items-center justify-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                id="betaTesterInterest"
                name="betaTesterInterest"
                checked={betaTesterInterest}
                onChange={handleBetaTesterChange}
                disabled={isSubmitting}
                className="
                  h-5 w-5 rounded border-slate-300
                  text-sage-600 focus:ring-sage-500 focus:ring-offset-0
                  transition-colors duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              />
              <span className="text-sage-600 text-sm leading-snug group-hover:text-sage-700 transition-colors">
                Yes, I want tester access and I'm open to giving feedback.
              </span>
            </label>
          </div>
        </form>
      ) : (
        /* Success/Duplicate State */
        <div className="text-center space-y-4 animate-slide-up">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-sage-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success/Duplicate Message */}
          <div className="space-y-2">
            <h3 className="font-serif text-2xl md:text-3xl text-sage-800">
              {status === 'duplicate' ? "You're already on the waitlist" : successHeading}
            </h3>
            <p className="text-sage-600 text-lg font-light">
              {status === 'duplicate'
                ? "You're already on the waitlist."
                : "You're on the waitlist — we release access in waves."}
            </p>
          </div>

          {/* Decorative Element */}
          <div className="pt-4">
            <div className="w-12 h-0.5 bg-sage-300 mx-auto rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}