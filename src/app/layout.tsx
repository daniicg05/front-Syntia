import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GlobalUserNavbar } from "@/components/GlobalUserNavbar";
import { ToastProvider } from "@/components/ui/Toast";
import { GlobalFooter } from "@/components/GlobalFooter";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Syntia — Encuentra subvenciones para tu proyecto",
  description:
      "Syntia analiza tu proyecto con inteligencia artificial y encuentra las subvenciones públicas más compatibles de la BDNS.",
  keywords: [
    "subvenciones",
    "BDNS",
    "inteligencia artificial",
    "financiación pública",
    "España",
  ],
};

export const viewport: Viewport = {
  themeColor: "#f7f9fb",
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
          suppressHydrationWarning
          className={`${inter.variable} ${manrope.variable} h-full antialiased`}
      >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
      <ThemeProvider>
        <ToastProvider>
          <GlobalUserNavbar />
          <main className="flex-1 pb-8">{children}</main>
          <GlobalFooter />
        </ToastProvider>
      </ThemeProvider>
      </body>
      </html>
  );
}