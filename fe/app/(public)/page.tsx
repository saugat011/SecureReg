import Link from "next/link";

const passwordRules = [
  "12+ characters (longer is better).",
  "Mix of uppercase, lowercase, numbers, and symbols.",
  "Avoid common passwords/patterns (e.g., password, 123456, qwerty).",
  "Do not include your username in the password.",
];

const captchaNotes = [
  "Stops automated/bot registrations.",
  "Adds a human verification step during sign-up.",
  "Simple and demo-friendly for a prototype system.",
];

export default function PublicHomePage() {
  return (
    <main className="py-10 md:py-16">
      <section className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Secure user registration with password strength + captcha.
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            This prototype demonstrates secure system design principles for account creation: the
            system evaluates password strength, provides actionable feedback, and verifies the user
            is human before registration completes.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go to registration
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Login
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-xs text-slate-500">
            <span>Password policy</span>
            <span>Strength feedback</span>
            <span>Captcha verification</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-700">What this SecureReg demonstrate</p>

          <div className="mt-4 grid gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">1) Password strength meter</p>
              <p className="mt-1 text-xs text-slate-600">
                The system algorithmically scores the password and shows feedback (weak → strong)
                while the user types.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">2) Captcha (human check)</p>
              <p className="mt-1 text-xs text-slate-600">
                The registration form blocks submission until the captcha is correctly completed.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 p-4 text-white">
              <p className="text-sm font-semibold">Demo script (quick)</p>
              <p className="mt-1 text-xs text-slate-200">
                Try “password123” → see weak feedback, then create a strong password and complete
                captcha → registration succeeds.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-900">Password policy (prototype)</p>
          <p className="mt-2 text-sm text-slate-600">
            These rules are shown to the user to encourage secure password choices.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {passwordRules.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>{r}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-700">Why this matters</p>
            <p className="mt-1 text-xs text-slate-600">
              Weak or predictable passwords are easier to brute-force or guess; feedback helps users
              improve security at the point of registration.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-900">Captcha in registration</p>
          <p className="mt-2 text-sm text-slate-600">
            Captcha is included to reduce automated sign-ups and bot abuse.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {captchaNotes.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>{r}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Try registration
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Test weak passwords
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
