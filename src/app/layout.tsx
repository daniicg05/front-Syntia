import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Syntia — Encuentra subvenciones para tu proyecto",
  description: "Plataforma de recomendaciones de subvenciones con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  /** Layout global de la app: aplica variables de fuentes y asegura una estructura */
  /** de altura completa para que páginas con flex/column crezcan correctamente. */
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}