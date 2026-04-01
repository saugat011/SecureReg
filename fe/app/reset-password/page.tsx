"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const router = useRouter();

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErr(null);

    if (!code.trim() || !newPassword.trim()) {
      setErr("Please enter the verification code and a new password.");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token") || ""
        : "";

    if (!token) {
      setErr("Missing reset token. Please open this page from the email link.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          code: code.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setErr(text || "Unable to reset password. Please try again.");
        return;
      }

      const text = await res.text();
      setMessage(text || "Password reset successful. You can now log in.");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
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
          {/* LEFT: explanation */}
          <section className="space-y-4">
           

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Enter your verification code
            </h1>

            <p className="text-sm leading-relaxed text-slate-600">
              We sent a 6‑digit verification code and a secure reset link to the
              email address associated with your account. Use that code here to
              set a new password.
            </p>

            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              <li>• The code expires after a short time for security.</li>
              <li>• Your new password replaces the old one immediately.</li>
              <li>• Never share your verification code or reset link.</li>
            </ul>

            <p className="mt-3 text-xs text-slate-500">
              If you did not request a password reset, you can safely ignore the
              email and keep using your existing password.
            </p>
            <div className="pt-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                ← Back to home
              </Link>
            </div>
          </section>
          

          {/* RIGHT: form */}
          <section className="w-full">
            <form
              onSubmit={onSubmit}
              className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                Reset your password
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Enter the 6‑digit verification code from your email and choose a
                strong new password.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    New password
                  </label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
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
                  disabled={loading}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    loading
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {loading ? "Resetting..." : "Reset password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
