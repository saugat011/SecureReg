"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
  lastLogin?: string;
  passwordChangedAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(iso?: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function usePasswordStrength(password: string) {
  return useMemo(() => {
    const checks = {
      minLength: password.length >= 12,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    const score = Object.values(checks).filter(Boolean).length;
    let pool = 0;
    if (checks.lowercase) pool += 26;
    if (checks.uppercase) pool += 26;
    if (checks.number) pool += 10;
    if (checks.special) pool += 32;
    const entropy = pool > 0 ? Math.round(password.length * Math.log2(pool)) : 0;
    return { checks, score, entropy };
  }, [password]);
}

// ── Eye icons ────────────────────────────────────────────────────
const EyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);
const EyeOn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export default function DashboardPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const { checks, score, entropy } = usePasswordStrength(newPassword);

  // ── Load user ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
        if (!res.ok) { router.push("/login"); return; }
        setUser(await res.json());
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [API_URL, router]);

  async function handleLogout() {
    try { await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }); }
    catch { /* ignore */ }
    finally { router.push("/login"); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null); setPwdMsg(null);
    if (!currentPassword || !newPassword) { setPwdError("Both fields are required."); return; }
    setPwdLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) { setPwdError((await res.text()) || "Failed to change password."); return; }
      setPwdMsg("Password successfully updated!");
      setCurrentPassword(""); setNewPassword("");
      setTimeout(() => { setShowPwdModal(false); setPwdMsg(null); }, 2000);
    } catch { setPwdError("Network error. Please try again."); }
    finally { setPwdLoading(false); }
  }

  // ── Password expiry ────────────────────────────────────────────
  const expiryInfo = useMemo(() => {
    if (!user?.passwordChangedAt) return { expiryDate: "—", daysLeft: 0, pct: 0 };
    const totalMs = 90 * 24 * 60 * 60 * 1000;
    const expiryMs = new Date(user.passwordChangedAt).getTime() + totalMs;
    const remainMs = expiryMs - Date.now();
    const daysLeft = Math.max(0, Math.ceil(remainMs / (24 * 60 * 60 * 1000)));
    const pct = Math.max(0, Math.round((remainMs / totalMs) * 100));
    return { expiryDate: formatDate(new Date(expiryMs).toISOString()), daysLeft, pct };
  }, [user]);

  const expiryBarColor =
    expiryInfo.pct <= 20 ? "bg-red-500"
    : expiryInfo.pct <= 40 ? "bg-amber-500"
    : "bg-emerald-500";

  const daysTextColor =
    expiryInfo.daysLeft > 30 ? "text-emerald-600"
    : expiryInfo.daysLeft > 10 ? "text-amber-600"
    : "text-red-600";

  // ── Strength label/color ──────────────────────────────────────
  const strengthLabel = score <= 1 ? "Very weak" : score === 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Strong" : "Excellent";
  const strengthBarColor =
    score <= 1 ? "bg-red-500" : score === 2 ? "bg-orange-500" : score === 3 ? "bg-amber-400" : score === 4 ? "bg-lime-500" : "bg-emerald-500";
  const strengthTextColor =
    score <= 1 ? "text-red-600" : score === 2 ? "text-orange-600" : score === 3 ? "text-amber-600" : score === 4 ? "text-lime-600" : "text-emerald-600";

  // ── Loading ────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  const requirementRows: { key: keyof typeof checks; label: string }[][] = [
    [{ key: "minLength", label: "Min 12 characters" }, { key: "uppercase", label: "Uppercase letter" }],
    [{ key: "lowercase", label: "Lowercase letter"  }, { key: "number",    label: "Number"           }],
    [{ key: "special",   label: "Special character" }],
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-10 md:py-14">
      <div className="mx-auto max-w-5xl px-6 space-y-8">

        {/* ── Header ── */}
        <header className="flex items-start justify-between gap-4">
          <div>
            {/* Live session pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 shadow-sm mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Session active
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Welcome back, <span className="text-slate-700">{user.username}</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Your account is secure. Review your security posture below.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>Username: <span className="font-semibold text-slate-800">@{user.username}</span></span>
              <span>Email: <span className="font-semibold text-slate-800">{user.email}</span></span>
              {user.createdAt && <span>Member since: <span className="font-semibold text-slate-800">{formatDate(user.createdAt)}</span></span>}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition"
          >
            Sign out
          </button>
        </header>

        {/* ── Main grid ── */}
        <div className="grid gap-5 md:grid-cols-3">

          {/* ── LEFT col (2/3) ── */}
          <div className="md:col-span-2 space-y-5">

            {/* Account overview card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-slate-900">Account overview</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* Security status */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Security status</p>
                  <p className="mt-2 text-sm font-semibold text-emerald-600">Good</p>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">Password meets the current policy.</p>
                </div>
                {/* Last login */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Last login</p>
                  <p className="mt-2 text-sm text-slate-800 font-medium">{timeAgo(user.lastLogin)}</p>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">Login event tracking enabled.</p>
                </div>
                {/* Active sessions */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Active sessions</p>
                  <p className="mt-2 text-sm text-slate-800 font-medium">1 device</p>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">No unusual activity detected.</p>
                </div>
              </div>

              {/* Account details rows */}
              <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100 pt-4">
                {[
                  ["Username",    `@${user.username}`],
                  ["Email",       user.email],
                  ["Registered",  formatDate(user.createdAt)],
                  ["Last login",  timeAgo(user.lastLogin)],
                  ["Role",        "Standard user"],
                  ["MFA",         "Not configured"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5 text-xs">
                    <span className="text-slate-400">{k}</span>
                    <span className={`font-medium ${k === "MFA" ? "text-amber-600" : "text-slate-700"}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Password expiry card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900">Password expiry</h2>
                <span className={`text-xs font-semibold ${daysTextColor}`}>{expiryInfo.daysLeft} days left</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 mb-5">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Expires on</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{expiryInfo.expiryDate}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Days remaining</p>
                  <p className={`mt-2 text-sm font-semibold ${daysTextColor}`}>{expiryInfo.daysLeft} days</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Policy</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">90-day rotation</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full transition-all duration-700 ${expiryBarColor}`}
                  style={{ width: `${expiryInfo.pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                <span>Changed</span>
                <span className={`font-semibold ${daysTextColor}`}>{expiryInfo.pct}% remaining</span>
                <span>Expiry</span>
              </div>

              <button
                onClick={() => setShowPwdModal(true)}
                className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 text-left flex items-center justify-between hover:bg-slate-100 transition"
              >
                <span>↺ Change password</span><span className="text-slate-400">→</span>
              </button>
            </div>

            {/* Recent activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Recent activity</h2>
              <ul className="space-y-0 divide-y divide-slate-100">
                {[
                  { time: "Just now",   msg: "Login from this device",              ok: true  },
                  { time: "2h ago",     msg: "Password complexity check passed",    ok: true  },
                  { time: "Yesterday",  msg: "Failed login attempt detected",       ok: false },
                  { time: "2 days ago", msg: "Account verification completed",      ok: true  },
                  { time: "3 days ago", msg: "New device login recorded",           ok: true  },
                ].map((e, i) => (
                  <li key={i} className="flex items-start gap-3 py-2.5 text-xs">
                    <span className="w-20 shrink-0 text-slate-400 pt-0.5">{e.time}</span>
                    <span className={`flex items-center gap-1.5 font-medium ${e.ok ? "text-slate-700" : "text-amber-600"}`}>
                      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                        e.ok ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      }`}>
                        {e.ok ? "✓" : "!"}
                      </span>
                      {e.msg}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── RIGHT col (1/3) ── */}
          <aside className="space-y-5">

            {/* Security score */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Security score</h3>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-5xl font-bold text-slate-900 leading-none">74</span>
                <span className="text-lg text-slate-400 mb-1">/100</span>
              </div>
              <p className="text-center text-[11px] text-slate-400 uppercase tracking-wide mb-4">Security rating</p>
              {/* Score bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
                <div className="h-2 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: "74%" }} />
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between py-2 text-xs">
                  <span className="text-slate-400">Grade</span>
                  <span className="font-semibold text-emerald-600">Good</span>
                </div>
                <div className="flex justify-between py-2 text-xs">
                  
                </div>
              </div>
            </div>

            {/* Security policy checklist */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Security policy</h3>
              <ul className="space-y-2">
                {[
                  [true,  "Min 12-char password"],
                  [true,  "Complexity requirements met"],
                  [true,  "CAPTCHA verification done"],
                  [true,  "Brute-force protection on"],
                  [true,  "Passwords hashed (bcrypt)"],
                  [false, "MFA enabled"],
                  [false, "Biometric login set up"],
                ].map(([met, label], i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs">
                    <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                      met ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      {met ? "✓" : "○"}
                    </span>
                    <span className={met ? "text-slate-700" : "text-slate-400"}>{label as string}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick actions</h3>
              <div className="space-y-2">
                {[
                  { label: "Change password",          action: () => setShowPwdModal(true), primary: true },
                  { label: "Review active sessions",   action: () => {},                    primary: false },
                  { label: "View security events",     action: () => {},                    primary: false },
                  { label: "Sign out of all sessions", action: handleLogout,                primary: false, danger: true },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className={`w-full rounded-xl border px-3 py-2.5 text-xs font-medium text-left flex items-center justify-between transition ${
                      btn.danger
                        ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                        : btn.primary
                        ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {btn.label}
                    <span className="opacity-50">→</span>
                  </button>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </div>

      {/* ── Change Password Modal ── */}
      {showPwdModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowPwdModal(false); setPwdError(null); setPwdMsg(null); } }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
              <button
                onClick={() => { setShowPwdModal(false); setPwdError(null); setPwdMsg(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >✕</button>
            </div>
            <p className="text-xs text-slate-500 mb-5">Update your account password securely.</p>

            {pwdError && (
              <div className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <span>✕</span>{pwdError}
              </div>
            )}
            {pwdMsg && (
              <div className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                <span>✓</span>{pwdMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showCurrent ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 12 characters"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                    {showNew ? <EyeOff /> : <EyeOn />}
                  </button>
                </div>

                {/* Strength indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    {/* Segmented bar */}
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i < score ? strengthBarColor : "bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                    {/* Label + entropy */}
                    <div className="flex justify-between text-[11px]">
                      <span className={`font-semibold ${strengthTextColor}`}>★ {strengthLabel}</span>
                      <span className="text-slate-400">Entropy: <span className="font-semibold text-slate-600">{entropy} bits</span></span>
                    </div>
                    {/* Requirements */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 space-y-1.5">
                      {requirementRows.map((row, ri) => (
                        <div key={ri} className="grid grid-cols-2 gap-x-4">
                          {row.map(({ key, label }) => (
                            <span key={key} className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 ${
                              checks[key] ? "text-emerald-600" : "text-slate-400"
                            }`}>
                              <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${
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
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowPwdModal(false); setPwdError(null); setPwdMsg(null); }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    pwdLoading ? "cursor-not-allowed bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {pwdLoading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}