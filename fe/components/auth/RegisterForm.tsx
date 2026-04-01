"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TurnstileWidget from "./TurnstileWidget";

export default function RegisterForm() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!;
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
  });

  // ── Password requirement checks ──────────────────────────────
  const checks = useMemo(() => ({
    minLength:    password.length >= 12,
    lowercase:    /[a-z]/.test(password),
    uppercase:    /[A-Z]/.test(password),
    number:       /[0-9]/.test(password),
    special:      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notCommon:    !["password","123456","qwerty","abc123","letmein","welcome","monkey","dragon"].includes(password.toLowerCase()),
  }), [password]);

  const passedCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length; // 6

  // Entropy approximation
  const entropy = useMemo(() => {
    if (!password) return 0;
    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^A-Za-z0-9]/.test(password)) pool += 32;
    return pool > 0 ? Math.round(password.length * Math.log2(pool)) : 0;
  }, [password]);

  const strengthLabel = passedCount <= 1 ? "Very weak"
    : passedCount === 2 ? "Weak"
    : passedCount === 3 ? "Fair"
    : passedCount === 4 ? "Good"
    : passedCount === 5 ? "Strong"
    : "Excellent";

  const strengthTextColor = passedCount <= 1 ? "text-red-500"
    : passedCount === 2 ? "text-orange-500"
    : passedCount === 3 ? "text-amber-500"
    : passedCount === 4 ? "text-lime-600"
    : "text-emerald-500";

  // Segment colours — each of 6 segments lights up progressively
  function segmentColor(index: number) {
    if (index >= passedCount) return "bg-slate-200";
    if (passedCount <= 1) return "bg-red-500";
    if (passedCount === 2) return "bg-orange-500";
    if (passedCount === 3) return "bg-amber-400";
    if (passedCount === 4) return "bg-lime-500";
    return "bg-emerald-500";
  }

  // ── Validation errors ─────────────────────────────────────────
  const emailError =
    touched.email && !email.trim() ? "Email is required."
    : touched.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? "Please enter a valid email address."
    : null;

  const usernameError =
    touched.username && !username.trim() ? "Username is required." : null;

  const passwordError =
    touched.password && !password ? "Password is required."
    : touched.password && passedCount < 4 ? "Password is too weak — meet more requirements below."
    : null;

  const confirmError =
    touched.confirmPassword && !confirmPassword ? "Please confirm your password."
    : touched.confirmPassword && password !== confirmPassword ? "Passwords do not match."
    : null;

  const canSubmitRegister =
    !!email.trim() && !emailError &&
    !!username.trim() &&
    !!password && passedCount >= 4 &&
    password === confirmPassword &&
    !!captchaToken &&
    !submitting;

  async function verifyTurnstile(token: string) {
    const res = await fetch("/api/turnstile/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    return res.json();
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);
    setTouched({ email: true, username: true, password: true, confirmPassword: true });
    if (!canSubmitRegister) return;
    setSubmitting(true);
    try {
      const outcome = await verifyTurnstile(captchaToken!);
      if (!outcome?.success) {
        setServerError("Human verification failed. Please try again.");
        setCaptchaToken(null);
        return;
      }
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      if (!res.ok) {
        setServerError((await res.text()) || "Registration failed. Please try again.");
        return;
      }
      setServerSuccess("Verification code sent to your email!");
      setStep(2);
    } catch {
      setServerError("Something went wrong. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setServerSuccess(null);
    if (!code.trim() || code.length < 6) {
      setServerError("Please enter the complete 6-digit verification code.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      if (!res.ok) {
        setServerError((await res.text()) || "Verification failed. Incorrect code.");
        return;
      }
      setServerSuccess("Account created and verified successfully! Logging you in...");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Requirement rows ──────────────────────────────────────────
  const requirementRows: { key: keyof typeof checks; label: string }[][] = [
    [
      { key: "minLength",  label: "Min 12 characters" },
      { key: "uppercase",  label: "Uppercase letter"  },
    ],
    [
      { key: "lowercase",  label: "Lowercase letter"  },
      { key: "number",     label: "Number"            },
    ],
    [
      { key: "special",    label: "Special character" },
      { key: "notCommon",  label: "Not a common word" },
    ],
  ];

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">
          <h1 className="text-xl font-semibold text-slate-900">
            {step === 1 ? "Create account" : "Verify your email"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {step === 1
              ? "Choose a strong password and complete the human verification step."
              : `We sent a 6-digit verification code to ${email}.`}
          </p>
        </div>

        {serverError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {serverError}
          </div>
        )}
        {serverSuccess && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {serverSuccess}
          </div>
        )}

        {/* ── STEP 1 ───────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  emailError ? "border-red-300 focus:ring-4 focus:ring-red-100" : "border-slate-200 focus:ring-4 focus:ring-slate-100"
                }`}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {emailError && <p className="mt-1 text-xs text-red-700">{emailError}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                  usernameError ? "border-red-300 focus:ring-4 focus:ring-red-100" : "border-slate-200 focus:ring-4 focus:ring-slate-100"
                }`}
                placeholder="Enter Username"
                autoComplete="username"
              />
              {usernameError && <p className="mt-1 text-xs text-red-700">{usernameError}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                {/* Policy button — visual only, wire up if needed */}
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 cursor-default select-none">
                  Policy
                </span>
              </div>

              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  className={`w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none transition ${
                    passwordError ? "border-red-300 focus:ring-4 focus:ring-red-100" : "border-slate-200 focus:ring-4 focus:ring-slate-100"
                  }`}
                  placeholder="Minimum 12 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
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

              {/* Strength bar — 6 segments */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {Array.from({ length: totalChecks }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${segmentColor(i)}`}
                      />
                    ))}
                  </div>

                  {/* Label + Entropy */}
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1 text-xs font-semibold ${strengthTextColor}`}>
                      <span>★</span> {strengthLabel}
                    </span>
                    <span className="text-xs text-slate-400">
                      Entropy: <span className="font-semibold text-slate-600">{entropy} bits</span>
                    </span>
                  </div>

                  {/* Requirements checklist — 2 columns */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 space-y-1.5">
                    {requirementRows.map((row, ri) => (
                      <div key={ri} className="grid grid-cols-2 gap-x-4">
                        {row.map(({ key, label }) => (
                          <span
                            key={key}
                            className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                              checks[key] ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold transition-all duration-200 ${
                              checks[key] ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                            }`}>
                              {checks[key] ? "✓" : "●"}
                            </span>
                            {label}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {passwordError && <p className="mt-1 text-xs text-red-700">{passwordError}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm password</label>
              <div className="relative mt-1">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                  className={`w-full rounded-xl border px-3 py-2 pr-10 text-sm outline-none transition ${
                    confirmError ? "border-red-300 focus:ring-4 focus:ring-red-100" : "border-slate-200 focus:ring-4 focus:ring-slate-100"
                  }`}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirm ? (
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
              {confirmError && <p className="mt-1 text-xs text-red-700">{confirmError}</p>}
            </div>

            {/* Captcha */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-700">Human verification</p>
              <p className="mt-1 text-xs text-slate-600">
                Complete the check to enable the Create account button.
              </p>
              <div className="mt-3">
                <TurnstileWidget siteKey={SITE_KEY} onToken={setCaptchaToken} />
              </div>
              {!captchaToken && (
                <p className="mt-2 text-xs text-slate-600">
                  Tip: If it doesn&apos;t load, add <code>localhost</code> in Turnstile Hostname Management.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmitRegister}
              className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${
                canSubmitRegister
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              {submitting ? "Sending Verification Code..." : "Create account"}
            </button>
          </form>
        )}

        {/* ── STEP 2 ───────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerifySubmit} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700 text-center mb-2">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-slate-200 px-3 py-3 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                placeholder="------"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || code.length < 6}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                !submitting && code.length === 6
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              {submitting ? "Verifying..." : "Verify & Complete Setup"}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setServerSuccess(null); setServerError(null); }}
              className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              ← Back to registration
            </button>
          </form>
        )}
      </div>

      {step === 1 && (
        <>
          <p className="mt-4 text-center text-xs text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">
              Login
            </Link>
          </p>
          <p className="mt-1 text-center text-[11px] text-slate-500">
            This prototype stores passwords as hashed values on the server and uses secure tokens for authentication.
          </p>
        </>
      )}
    </div>
  );
}