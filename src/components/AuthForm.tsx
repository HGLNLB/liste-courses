"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  onSuccess: () => void;
};

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Compte créé. Vous êtes connecté.");
        onSuccess();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        onSuccess();
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight text-[#1C1C1E]">
          Liste de courses
        </h1>
        <p className="mb-8 text-center text-sm text-[#8E8E93]">
          Connectez-vous une fois, restez connecté.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#636366]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#E5E5EA] bg-white px-4 py-3 text-base outline-none focus:border-[#007AFF]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#636366]">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#E5E5EA] bg-white px-4 py-3 text-base outline-none focus:border-[#007AFF]"
            />
          </div>

          {message && (
            <p className="rounded-xl bg-[#FFF3CD] px-4 py-3 text-sm text-[#856404]">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#007AFF] py-3 text-base font-medium text-white disabled:opacity-60"
          >
            {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full py-2 text-sm text-[#007AFF]"
        >
          {mode === "login" ? "Créer un compte" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </div>
  );
}
