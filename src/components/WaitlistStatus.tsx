import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // ← use the shared client

export default function WaitlistStatus() {
  const [user, setUser] = useState<any>(null);
  const [entry, setEntry] = useState<any>(null);

  // Get the logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // Fetch the user's waitlist entry
  useEffect(() => {
    if (!user) return;

    supabase
      .from("waitlist")
      .select("*")
      .eq("email", user.email)
      .single()
      .then(({ data }) => setEntry(data));
  }, [user]);

  // UI states
  if (!user) {
    return <p>You’re on the waitlist — we release access in waves.</p>;
  }

  if (!entry || entry.wave_number === null) {
    return <p>You’re currently waiting to be assigned to a wave.</p>;
  }

  if (entry.status === "waiting") {
    return (
      <p>You’re in Wave {entry.wave_number} — we’ll notify you when your wave opens.</p>
    );
  }

  if (entry.status === "invited") {
    return <p>Your wave is open — check your email for access.</p>;
  }

  if (entry.status === "active") {
    return <p>You’re in! Your account is active.</p>;
  }

  return null;
}
