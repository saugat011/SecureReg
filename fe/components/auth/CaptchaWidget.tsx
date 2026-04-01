"use client";

import { useEffect, useMemo, useState } from "react";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomText(len = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[randomInt(0, chars.length - 1)];
  return s;
}

type CaptchaState = { token: string; a: number; b: number };

function newCaptcha(): CaptchaState {
  return { token: randomText(5), a: randomInt(2, 9), b: randomInt(2, 9) };
}

export default function CaptchaWidget({ onChange }: { onChange: (valid: boolean) => void }) {
  const [mounted, setMounted] = useState(false);
  const [c, setC] = useState<CaptchaState | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    setMounted(true);
    setC(newCaptcha());
    onChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const expected = useMemo(() => {
    if (!c) return "";
    return `${c.token}-${c.a + c.b}`;
  }, [c]);

  const isValid = mounted && value.trim().toUpperCase() === expected.toUpperCase();

  useEffect(() => {
    onChange(isValid);
  }, [isValid, onChange]);

  function refresh() {
    setC(newCaptcha());
    setValue("");
    onChange(false);
  }

  // Avoid SSR/client mismatch: render a stable placeholder until mounted
  if (!mounted || !c) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold text-slate-700">Captcha (prototype)</p>
        <p className="mt-1 text-xs text-slate-600">Loading captcha…</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-700">Captcha (prototype)</p>

          <p className="mt-1 text-sm text-slate-900">
            Challenge: <span className="font-semibold">{c.token}</span> and {c.a}+{c.b}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            Type exactly: <span className="font-mono font-semibold text-slate-900">{expected}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-slate-700">Enter captcha</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
          placeholder={expected}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <p className={`mt-2 text-xs ${isValid ? "text-emerald-700" : "text-slate-600"}`}>
        {isValid ? "Captcha verified." : "Captcha not verified yet."}
      </p>
    </div>
  );
}
