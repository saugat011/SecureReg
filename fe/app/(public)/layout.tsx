import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl px-6">{children}</div>
      <Footer />
    </div>
  );
}
