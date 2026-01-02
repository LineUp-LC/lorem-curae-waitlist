import { useState } from "react";
import { supabase } from "../lib/supabase"; // ← use shared client

export default function MagicLinkLogin() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (!error) setSent(true);
  };

  if (sent) {
    return (
      <p className="text-sage-700 text-lg font-medium mt-4 animate-fade-in">
        Magic link sent — check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleLogin} className="max-w-xl mx-auto mt-10">
      <input
        type="email"
        required
        placeholder="Your email address *"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-6 py-4 border-2 border-slate-200 rounded-full focus:border-sage-600 focus:outline-none text-lg mb-4"
      />

      <button
        type="submit"
        className="w-full px-8 py-4 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors text-lg font-medium"
      >
        Sign in with magic link
      </button>
    </form>
  );
}
