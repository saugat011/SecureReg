"use client";

import Link from "next/link";
import RegisterForm from "../../../components/auth/RegisterForm";
import { Navbar } from "@/components/common/Navbar";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        {/* Make the 2-column area fill height and center items vertically */}
        <div className="grid min-h-[520px] gap-10 md:grid-cols-2 md:items-center">
          {/* LEFT: content, vertically centered */}
          <section className="flex flex-col justify-center space-y-4">
            

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Create a secure account
            </h1>

            <p className="text-sm leading-relaxed text-slate-600">
              Registration demonstrates secure system design: strong password rules,
              real‑time strength feedback, and human verification before account
              creation completes.
            </p>

            <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
              <li>• Passwords are validated locally and stored hashed on the server.</li>
              <li>• Captcha prevents automated sign‑ups and bot abuse.</li>
              <li>• Prototype aligns with Advanced Cyber Security coursework.</li>
            </ul>

            
            
          </section>

          {/* RIGHT: register form */}
          <section className="w-full">
            <RegisterForm />
          </section>
        </div>
      </div>
    </main>
  );
}
