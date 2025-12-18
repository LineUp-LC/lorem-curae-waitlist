import { useState, ReactNode, useEffect } from "react";

interface PasswordGateProps {
  children: ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  console.log("Password from env:", import.meta.env.VITE_SITE_PASSWORD);

  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("site_authed");
    if (stored === "true") {
      setAuthed(true);
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input === import.meta.env.VITE_SITE_PASSWORD) {
      localStorage.setItem("site_authed", "true");
      setAuthed(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (authed) return <>{children}</>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Protected Site</h1>
      <form onSubmit={submit}>
        <input
          type="password"
          placeholder="Enter password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: 8, marginRight: 8 }}
        />
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}