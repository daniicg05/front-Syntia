import { Navbar } from "@/components/Navbar";

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">{children}</main>
    </div>
  );
}
