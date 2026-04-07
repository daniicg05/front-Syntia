import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Syntia — Encuentra subvenciones para tu proyecto",
  description:
    "Syntia analiza tu proyecto con inteligencia artificial y encuentra las subvenciones públicas más compatibles de la BDNS.",
  keywords: ["subvenciones", "BDNS", "inteligencia artificial", "financiación pública", "España"],
};

export const viewport: Viewport = {
  themeColor: "#f5f5f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <main className="flex-1">{children}</main>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
