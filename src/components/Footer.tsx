import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/images/syntia-grants-logo.png"
            alt="Syntia Grants"
            width={160}
            height={54}
            className="w-[60px] md:w-[100px] h-auto"
          />
          <span className="text-foreground-subtle text-sm">
            — IA para subvenciones públicas
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-foreground-muted">
          <Link href="/aviso-legal" className="hover:text-foreground transition-colors">
            Aviso legal
          </Link>
          <span className="text-border">|</span>
          <a
            href="mailto:informacion@syntia.es"
            className="hover:text-foreground transition-colors"
          >
            informacion@syntia.es
          </a>
        </div>
      </div>
    </footer>
  );
}
