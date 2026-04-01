"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErr(null);

    if (!email.trim()) {
      setErr("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim() || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setErr(text || "Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();
      setMessage(
        data.message ||
          "If an account exists for this email, a reset link and code have been sent."
      );

      // Immediately open Reset Password page where user enters code + new password
      router.push("/reset-password");
    } catch {
      setErr("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          {/* LEFT */}
          <section className="space-y-4">
            

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Forgot your password?
            </h1>

            <p className="text-sm leading-relaxed text-slate-600">
              Enter the username and email associated with your account. We’ll
              send a secure reset link and one‑time verification code to your
              email.
            </p>

            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              <li>• Reset tokens are long, random values stored hashed.</li>
              <li>• A second factor (6‑digit code) is required to complete the reset.</li>
              <li>• Both the link and code are delivered via email.</li>
            </ul>

            <div className="pt-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                ← Back to home
              </Link>
            </div>
          </section>

          {/* RIGHT */}
          <section className="w-full">
            <form
              onSubmit={onSubmit}
              className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                Request password reset
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                We’ll send a reset link and verification code to this email if it
                matches an account.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Username (the one you used during registration)
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                {err && (
                  <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {err}
                  </p>
                )}

                {message && (
                  <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    loading || !email.trim()
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {loading ? "Sending..." : "Reset"}
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-600">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Back to login
                </Link>
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
