"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Step-up authentication screen for the admin panel.
 *
 * Shown by the server layout when the user is a logged-in admin but has no valid
 * unlock token. The admin content is NOT rendered behind this — the backdrop is a
 * generic frosted-glass surface with no real data, so the blur cannot be peeled
 * back to reveal anything sensitive. On success the server layout re-renders with
 * the actual panel (`router.refresh()`).
 */
export function AdminLockScreen({ username }: { username: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [typedUsername, setTypedUsername] = useState(username);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: typedUsername.trim(), password }),
      });

      if (res.ok) {
        setPassword("");
        router.refresh();
        return;
      }

      if (res.status === 429) {
        setError("Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.");
      } else if (res.status === 503) {
        setError("Admin paneli henüz yapılandırılmamış.");
      } else {
        setError("Kullanıcı adı veya şifre hatalı.");
      }
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--app-bg-shell)] px-6">
      {/* Generic frosted backdrop — intentionally contains NO admin data. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[120px]" />
        <div className="absolute inset-0 backdrop-blur-2xl" />
      </div>

      {/* The small frosted-glass window. */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white/50"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/25">
          Yumo Yumo
        </p>
        <h1 className="mt-1 text-center text-lg font-semibold tracking-tight text-white">
          Admin Panel Kilidi
        </h1>
        <p className="mb-7 mt-2 text-center text-sm leading-relaxed text-white/40">
          Devam etmek için yönetici kimliğinizi yeniden doğrulayın.
        </p>

        <label className="mb-1.5 block text-xs font-medium text-white/40">
          Kullanıcı adı
        </label>
        <input
          type="text"
          autoComplete="username"
          value={typedUsername}
          onChange={(e) => setTypedUsername(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/25"
          placeholder="kullanıcı adınız"
        />

        <label className="mb-1.5 block text-xs font-medium text-white/40">
          Panel şifresi
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="mb-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/25"
          placeholder="••••••••"
        />

        {error && (
          <p className="mb-2 mt-1 text-center text-xs text-red-400/80">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !password || !typedUsername.trim()}
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#0a0c10] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Doğrulanıyor…" : "Kilidi aç"}
        </button>

        <p className="mt-6 text-center text-xs text-white/20">app.yumoyumo.com</p>
      </form>
    </div>
  );
}
