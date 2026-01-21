import { useState, type FormEvent, type ChangeEvent } from "react";
import { supabase } from "../lib/supabase";

type MagicLinkStatus = 'idle' | 'loading' | 'success' | 'not-on-waitlist' | 'error';

interface MagicLinkState {
  email: string;
  status: MagicLinkStatus;
  errorMessage: string;
}

export default function MagicLinkLogin() {
  console.log("MagicLinkLogin component rendered");
  console.log("ENV_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
  console.log(
    "ENV_SUPABASE_ANON_KEY:",
    import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 6) + "...(masked)"
  );
  const [formState, setFormState] = useState<MagicLinkState>({
    email: "",
    status: "idle",
    errorMessage: "",
  });

  const { email, status, errorMessage } = formState;
  const isLoading = status === "loading";

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormState((prev) => ({
      ...prev,
      email: e.target.value,
      errorMessage: "",
      status: prev.status === "error" || prev.status === "not-on-waitlist" ? "idle" : prev.status,
    }));
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    console.log("trimmedEmail:", trimmedEmail, JSON.stringify(trimmedEmail));

    // Frontend validation
    if (!trimmedEmail) {
      setFormState((prev) => ({
        ...prev,
        errorMessage: "Please enter your email address.",
      }));
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setFormState((prev) => ({
        ...prev,
        errorMessage: "Please enter a valid email address.",
      }));
      return;
    }

    setFormState((prev) => ({ ...prev, status: "loading", errorMessage: "" }));

    try {
      // Check if email is on the waitlist first
      const { data: waitlistEntry, error: lookupError } = await supabase
        .from("waitlist")
        .select("id")
        .eq("email", trimmedEmail)
        .maybeSingle();
      console.log("waitlistEntry:", waitlistEntry);
      console.log("lookupError:", lookupError);

      if (lookupError) {
        throw lookupError;
      }

      // If not on waitlist, show appropriate message
      if (!waitlistEntry) {
        setFormState((prev) => ({
          ...prev,
          status: "not-on-waitlist",
          errorMessage: "",
        }));
        return;
      }

      // Email is on waitlist, request magic link via our custom API
      // This bypasses Supabase's built-in emails and uses our role-based templates
      console.log('[MagicLinkLogin] Sending request to /api/request-magic-link');
      console.log('[MagicLinkLogin] Request body:', JSON.stringify({ email: trimmedEmail, type: 'login' }));

      const response = await fetch('/api/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, type: 'login' }),
      });

      console.log('[MagicLinkLogin] Response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('[MagicLinkLogin] Response body:', JSON.stringify(responseData));
      } catch {
        console.error('[MagicLinkLogin] Failed to parse response as JSON');
        responseData = {};
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to send magic link');
      }

      console.log('[MagicLinkLogin] Magic link email sent successfully');

      setFormState((prev) => ({
        ...prev,
        status: "success",
        email: "",
      }));
    } catch (err) {
      console.error("Magic link error:", err);
      setFormState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "Something went wrong. Please try again.",
      }));
    }
  };

  const handleReset = (): void => {
    setFormState({
      email: "",
      status: "idle",
      errorMessage: "",
    });
  };

  // Success state
  if (status === "success") {
    return (
      <div className="max-w-xl mx-auto mt-6 text-center animate-fade-in">
        <div className="mx-auto w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center mb-4">
          <svg
            className="w-7 h-7 text-sage-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sage-700 text-lg font-medium mb-2">
          Check your email — your magic link is on the way.
        </p>
        <p className="text-sage-500 text-sm">
          Click the link in your email to sign in securely.
        </p>
      </div>
    );
  }

  // Not on waitlist state
  if (status === "not-on-waitlist") {
    return (
      <div className="max-w-xl mx-auto mt-6 text-center animate-fade-in">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <svg
            className="w-7 h-7 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-sage-700 text-lg font-medium mb-2">
          This email isn't on the waitlist yet — want to join?
        </p>
        <p className="text-sage-500 text-sm mb-4">
          Sign up above to get early access to Lorem Curae.
        </p>
        <button
          onClick={handleReset}
          className="text-sage-600 text-sm font-medium hover:text-sage-700 underline underline-offset-2 transition-colors"
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="max-w-xl mx-auto mt-6" noValidate>
      <div className="space-y-4">
        {/* Email Input */}
        <div className="relative">
          <input
            type="email"
            id="magicLinkEmail"
            name="magicLinkEmail"
            autoComplete="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
            aria-label="Email address for magic link"
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? "magic-link-error" : undefined}
            className={`
              w-full px-6 py-4 border-2 rounded-full
              text-sage-800 placeholder-sage-400
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-sage-500/30
              disabled:opacity-60 disabled:cursor-not-allowed
              ${errorMessage
                ? "border-coral-400 focus:border-coral-500 focus:ring-coral-500/30"
                : "border-slate-200 hover:border-sage-300 focus:border-sage-500"
              }
            `}
          />

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p
            id="magic-link-error"
            role="alert"
            className="text-coral-600 text-sm pl-6 animate-slide-up"
          >
            {errorMessage}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full px-8 py-4 bg-slate-900 text-white rounded-full
            text-lg font-medium
            transition-all duration-300 ease-out
            hover:bg-slate-800 hover:shadow-lg
            focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
            active:scale-[0.98]
            disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none
          `}
        >
          {isLoading ? "Sending link..." : "Sign in with magic link"}
        </button>

        {/* Explanation */}
        <p className="text-center text-sage-500 text-sm font-light px-4">
          A magic link is a secure one‑time login sent to your email. Click it to confirm your identity and access your account.
        </p>
      </div>

      {/* Fallback CTA */}
      <div className="mt-6 pt-4 border-t border-slate-200/60 text-center">
        <p className="text-sage-600 text-sm">
          Not on the waitlist yet?{" "}
          <a
            href="#waitlist"
            className="font-medium text-sage-700 hover:text-sage-800 underline underline-offset-2 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Join now
          </a>
        </p>
      </div>
    </form>
  );
}
