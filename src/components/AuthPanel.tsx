"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

function authConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.length > 0 && !url.includes("your-project");
}

export function AuthPanel({ compact = false }: { compact?: boolean }) {
  if (!authConfigured()) return null;
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage("Check your email for the sign-in link.");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  }

  if (user) {
    return (
      <div className={compact ? "flex items-center gap-2" : "space-y-2"}>
        <span className="text-xs text-stone-500 truncate max-w-[140px]" title={user.email ?? user.id}>
          {user.email ?? "Signed in"}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-400 hover:text-amber-200"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <a
        href="/login"
        className="rounded-full border border-amber-500/40 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10"
      >
        Sign in
      </a>
    );
  }

  return (
    <form onSubmit={sendMagicLink} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        required
        className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500/50 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl bg-amber-500 py-3 text-sm font-medium text-stone-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Email me a magic link"}
      </button>
      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-400" : "text-stone-400"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
