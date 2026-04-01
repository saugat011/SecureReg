import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">SecureReg</p>
            <p className="mt-1 text-xs text-slate-600">
              Secure registration prototype: password strength feedback + captcha verification.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link className="text-slate-700 hover:text-slate-900" href="/">
              Home
            </Link>
            <Link className="text-slate-700 hover:text-slate-900" href="/register">
              Register
            </Link>
            <Link className="text-slate-700 hover:text-slate-900" href="/login">
              Login
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SecureReg. Built for CET324 Assignment.</p>
          <p className="text-slate-500">Use 12+ characters, avoid common passwords.</p>
        </div>
      </div>
    </footer>
  );
}
