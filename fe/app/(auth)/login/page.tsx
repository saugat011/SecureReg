"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/common/Navbar";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function LoginPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Lockout timer
  const [lockedOut, setLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startLockout() {
    setLockedOut(true);
    setCountdown(LOCKOUT_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setLockedOut(false);
          setAttemptsUsed(0);
          setErr(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lockedOut) return;
    setErr(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const text = !data ? await res.text().catch(() => "") : "";

        const newUsed = attemptsUsed + 1;
        setAttemptsUsed(newUsed);

        if (newUsed >= MAX_ATTEMPTS) {
          startLockout();
          setErr(null);
        } else {
          setErr(data?.message || text || "Invalid credentials.");
        }
        return;
      }

      router.push("/dashboard");
    } catch {
      setErr("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const attemptsRemaining = MAX_ATTEMPTS - attemptsUsed;
  const disabled = loading || !email.trim() || !password || lockedOut;

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">

          {/* LEFT */}
          <section className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Sign in to your secure account
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Use the credentials you registered with. Your session is protected
              using HttpOnly cookies so tokens are never exposed to client-side scripts.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              <li>• Strong password policy enforced at registration.</li>
              <li>• Human verification via captcha to limit automated abuse.</li>
              <li>• Sessions designed to illustrate secure system design principles.</li>
            </ul>
          </section>

          {/* RIGHT: form */}
          <section className="w-full">
            <form
              onSubmit={onSubmit}
              className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">Login</h2>
              <p className="mt-1 text-xs text-slate-500">
                Enter your email and password to continue.
              </p>

              {/* Error banner */}
              {err && !lockedOut && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                  <span className="mt-0.5 text-xs text-red-500">✕</span>
                  <p className="text-xs font-medium text-red-600">
                    {err}{" "}
                    <span className="font-bold">
                      {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining.
                    </span>
                  </p>
                </div>
              )}

              {/* Lockout banner */}
              {lockedOut && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
                  <span className="mt-0.5 text-xs text-orange-500">⏳</span>
                  <p className="text-xs font-medium text-orange-600">
                    Too many failed attempts. Please wait{" "}
                    <span className="font-bold">{countdown}s</span> before trying again.
                  </p>
                </div>
              )}

              {/* ── AUTHENTICATION section ── */}
              <div className="mt-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Authentication
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Attempts remaining card — always visible */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Login Attempts Remaining
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => {
                        const isUsed = i < attemptsUsed;
                        return (
                          <span
                            key={i}
                            className={`h-3 w-3 rounded-full border transition-all duration-300 ${
                              isUsed
                                ? "border-red-400 bg-red-400"
                                : "border-slate-300 bg-white"
                            }`}
                          />
                        );
                      })}
                    </div>
                    {lockedOut ? (
                      <span className="text-sm font-bold text-orange-500 tabular-nums">
                        {countdown}s
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">
                        {attemptsRemaining} / {MAX_ATTEMPTS}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Email field — labelled "Username" to match screenshot */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Username
                    </label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-0 transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={lockedOut}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative mt-1">
                      <input
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none ring-0 transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        autoComplete="current-password"
                        disabled={lockedOut}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={disabled}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      disabled
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {loading ? "Signing in…" : lockedOut ? `Locked — wait ${countdown}s` : "Sign in"}
                  </button>

                  <p className="mt-2 text-xs text-slate-600">
                    Forgot your password?{" "}
                    <Link href="/forgot-password" className="font-semibold text-slate-900 hover:underline">
                      Reset it
                    </Link>
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-slate-900 hover:underline">
                  Create a new one
                </Link>
              </p>

              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                This login flow is for demonstration only. Passwords are stored as hashed
                values in the backend database and authentication uses signed tokens.
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}