import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you requested doesn’t exist.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
