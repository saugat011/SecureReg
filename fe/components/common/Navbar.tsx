"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navLinkClass(active: boolean) {
  return [
    "rounded-lg px-3 py-2 text-sm font-medium transition",
    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white">
            SR
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">SecureReg</p>
            <p className="text-xs text-slate-500">CET324 Prototype</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/" className={navLinkClass(pathname === "/")}>
            Home
          </Link>
          <Link href="/register" className={navLinkClass(pathname === "/register")}>
            Register
          </Link>
          <Link href="/login" className={navLinkClass(pathname === "/login")}>
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
