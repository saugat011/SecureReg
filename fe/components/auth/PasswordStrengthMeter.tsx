"use client";

import { evaluatePassword } from "./passwordStrength";

export default function PasswordStrengthMeter({
  password,
  username,
}: {
  password: string;
  username?: string;
}) {
  const r = evaluatePassword(password, username);

  const barColor =
    r.score >= 85
      ? "bg-emerald-600"
      : r.score >= 70
        ? "bg-green-600"
        : r.score >= 55
          ? "bg-yellow-500"
          : r.score >= 35
            ? "bg-orange-500"
            : "bg-red-600";

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-700">Password strength</p>
        <p className="text-xs font-semibold text-slate-900">
          {r.label} ({r.score}/100)
        </p>
      </div>

      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${r.score}%` }} />
      </div>

      {r.suggestions.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          {r.suggestions.slice(0, 4).map((s) => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
