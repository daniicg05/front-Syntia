"use client";

import Link from "next/link";
import Image from "next/image";

import {
  Sparkles,
  Database,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  TrendingUp,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { BuscarView } from "@/components/BuscarView";
import type { ConvocatoriaPublica } from "@/lib/api";

import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "IA Inteligente",
    description:
      "Nuestro motor analiza tu proyecto y lo compara con miles de convocatorias para encontrar las más compatibles, con una puntuación de compatibilidad precisa.",
    color: "bg-primary-light text-primary",
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: "Datos oficiales BDNS",
    description:
      "Acceso directo a la Base de Datos Nacional de Subvenciones, actualizada en tiempo real con convocatorias de todas las administraciones públicas españolas.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Guías paso a paso",
    description:
      "Para cada subvención compatible, genera automáticamente una guía de solicitud adaptada a tu proyecto y perfil de entidad.",
    color: "bg-amber-50 text-amber-600",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Describe tu proyecto",
    description: "Cuéntanos en qué consiste tu proyecto, su sector, alcance y necesidades de financiación.",
  },
  {
    step: "02",
    title: "La IA analiza y cruza datos",
    description: "Syntia procesa tu descripción y la compara con toda la base de datos de subvenciones vigentes.",
  },
  {
    step: "03",
    title: "Recibe tus recomendaciones",
    description: "Obtén un ranking personalizado de subvenciones compatibles con puntuación y explicación detallada.",
  },
];

const STATS = [
  { value: "+12.000", label: "Convocatorias analizadas" },
  { value: "98%", label: "Precisión del matching" },
  { value: "-5 min", label: "Para tener resultados" },
  { value: "0 €", label: "Para empezar" },
];

const MOCK_GRANTS: ConvocatoriaPublica[] = [
  {
    id: 9901,
    titulo: "Programa de digitalización para pymes 2026",
    organismo: "Ministerio de Industria y Turismo",
    sector: "Tecnología e Innovación",
    ubicacion: "España",
    fechaCierre: "2026-06-30",
    abierto: true,
    urlOficial: "https://www.example.com/grant/9901",
  },
  {
    id: 9902,
    titulo: "Ayudas a eficiencia energética en instalaciones industriales",
    organismo: "IDAE",
    sector: "Medio Ambiente",
    ubicacion: "Comunitat Valenciana",
    fechaCierre: "2026-05-20",
    abierto: true,
    urlOficial: "https://www.example.com/grant/9902",
  },
  {
    id: 9903,
    titulo: "Subvención para proyectos de innovación en hostelería",
    organismo: "Generalitat Valenciana",
    sector: "Hostelería y Turismo",
    ubicacion: "Alicante",
    fechaCierre: "2026-07-15",
    abierto: true,
    urlOficial: "https://www.example.com/grant/9903",
  },
  {
    id: 9904,
    titulo: "Línea de apoyo a I+D en salud y biotecnología",
    organismo: "CDTI",
    sector: "Salud e Investigación",
    ubicacion: "España",
    fechaCierre: "2026-08-10",
    abierto: false,
    urlOficial: "https://www.example.com/grant/9904",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    }
  },
};

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    }
  },
};

export default function LandingPage() {
  const { theme, toggleTheme, mounted } = useTheme();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 border-b border-border bg-background"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image
            src="/images/syntia-grants-logo.png"
            alt="Syntia Grants"
            width={160}
            height={54}
            className="w-[60px] md:w-[100px] h-auto"
            priority
          />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground-muted">
            <button
              onClick={() => scrollToSection("funcionalidades")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Funcionalidades
            </button>
            <button
              onClick={() => scrollToSection("como-funciona")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Cómo funciona
            </button>
            <button
              onClick={() => scrollToSection("empezar-a-buscar")}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Empezar a buscar
            </button>
          </nav>
          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={toggleTheme}
                type="button"
                className="group relative p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-muted/70 backdrop-blur-sm transition-all duration-200 ease-out"
                aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
                title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
              >
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tr from-primary/10 to-transparent"></span>

                {theme === "light" ? (
                  <Moon className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
                ) : (
                  <Sun className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
                )}
              </button>
            )}

            <Link
              href="/login"
              className="text-sm font-medium text-foreground-muted hover:text-foreground transition-all duration-200 hover:underline underline-offset-4"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/home"
              className="relative inline-flex items-center justify-center text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <span className="relative z-10">Empezar gratis</span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity"></span>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden pt-24 pb-20 text-center w-full [background-size:1000px_auto] md:[background-size:cover]"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/40" />
          <motion.div
            className="relative max-w-3xl mx-auto px-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-white/90 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-8 shadow-lg backdrop-blur-sm"
              variants={fadeInScale}
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Impulsado por IA
            </motion.div>
            <motion.h1
              className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6 text-balance drop-shadow-lg [text-shadow:_0_2px_12px_rgb(0_0_0_/_40%)]"
              variants={fadeInUp}
            >
              Encuentra subvenciones{" "}
              <span className="text-emerald-300 drop-shadow-lg">perfectas</span> para tu proyecto
            </motion.h1>
            <motion.p
              className="text-lg text-white mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md [text-shadow:_0_1px_8px_rgb(0_0_0_/_50%)]"
              variants={fadeInUp}
            >
              Syntia analiza tu proyecto y encuentra automáticamente las subvenciones públicas más
              compatibles directamente desde la BDNS.
            </motion.p>
            <motion.div
              className="flex items-center justify-center gap-4 flex-wrap"
              variants={fadeInUp}
            >
              <Link
                href="/home"
                className="inline-flex items-center gap-2 bg-white border-[1px] border-primary text-primary px-7 py-3.5 rounded-xl hover:bg-primary-hover hover:text-white font-semibold text-base transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"              >
                Explorar subvenciones
                <Search className="w-4 h-4" />
              </Link>
              <Link
                href="/home"
                className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl hover:bg-primary-hover font-semibold text-base transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Empezar gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.p
              className="mt-5 text-sm text-white font-medium drop-shadow-md [text-shadow:_0_1px_6px_rgb(0_0_0_/_50%)]"
              variants={fadeInUp}
            >
              Sin tarjeta &middot; Gratis &middot; Resultados en segundos
            </motion.p>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-surface">
          <motion.div
            className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {STATS.map((s) => (
              <motion.div key={s.label} variants={fadeInUp}>
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-foreground-muted mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section id="funcionalidades" className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="text-center mb-14"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Funcionalidades
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground text-balance">
                Todo lo necesario para encontrar y gestionar subvenciones de forma eficiente
              </h2>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  className="bg-surface border border-border rounded-2xl p-8 cursor-pointer"
                  variants={cardVariants}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)",
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}
                    whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                  >
                    {f.icon}
                  </motion.div>
                  <h3 className="font-bold text-foreground text-lg mb-3">{f.title}</h3>
                  <p className="text-foreground-muted text-sm leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="px-6 py-24 bg-surface border-y border-border">
          <div className="max-w-5xl mx-auto">
            <motion.div
              className="text-center mb-14"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
            >
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Cómo funciona
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground text-balance">
                Resultados en menos de 5 minutos
              </h2>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.step}
                  className="relative flex flex-col"
                  variants={stepVariants}
                  whileHover={{
                    scale: 1.03,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <motion.span
                      className="text-4xl font-bold text-primary font-serif"
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: i * 0.2
                      }}
                    >
                      {step.step}
                    </motion.span>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <motion.div
                        className="hidden md:block h-px flex-1 bg-primary/30"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: i * 0.2 + 0.3 }}
                        style={{ originX: 0 }}
                      />
                    )}
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>
                  <p className="text-foreground-muted text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <BuscarView
          title="Subvenciones destacadas para empezar"
          description="Explora convocatorias reales en formato tarjeta. Esta vista está mockeada para validar diseño, experiencia y comportamiento responsive antes de conectarla al backend."
          grants={MOCK_GRANTS}
        />

        {/* Trust section */}
        <section id="empezar-a-buscar" className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="bg-surface border border-border rounded-3xl p-10 sm:p-14 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInScale}
              whileHover={{
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
                transition: { duration: 0.3 }
              }}
            >
              <motion.div
                className="flex items-center justify-center gap-6 mb-8 flex-wrap"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  { icon: <Zap className="w-4 h-4" />, label: "Resultados instantáneos" },
                  { icon: <Shield className="w-4 h-4" />, label: "Datos oficiales BDNS" },
                  { icon: <TrendingUp className="w-4 h-4" />, label: "Alta precisión" },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    className="flex items-center gap-2 text-sm font-medium text-foreground-muted"
                    variants={fadeInUp}
                    whileHover={{ scale: 1.05, color: "var(--color-primary)" }}
                  >
                    <span className="text-primary">{item.icon}</span>
                    {item.label}
                  </motion.div>
                ))}
              </motion.div>
              <motion.h2
                className="text-3xl sm:text-4xl font-bold text-foreground mb-5 text-balance"
                variants={fadeInUp}
              >
                Empieza a encontrar subvenciones hoy
              </motion.h2>
              <motion.p
                className="text-foreground-muted mb-8 max-w-xl mx-auto leading-relaxed"
                variants={fadeInUp}
              >
                Sin compromisos. Crea tu cuenta gratis, describe tu proyecto y obtén un listado
                personalizado de subvenciones públicas compatibles en segundos.
              </motion.p>
              <motion.div
                className="flex items-center justify-center gap-4 flex-wrap"
                variants={fadeInUp}
              >
                <Link
                  href="/home"
                  className="inline-flex items-center gap-2 bg-white border-[1px] border-primary text-primary px-7 py-3.5 rounded-xl hover:bg-primary-hover hover:text-white font-semibold text-base transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Explorar subvenciones
                  <Search className="w-4 h-4" />
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl hover:bg-primary-hover font-semibold text-base transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  Crear cuenta gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div
                className="mt-6 flex items-center justify-center gap-4 text-sm text-foreground-subtle flex-wrap"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {["Sin tarjeta de crédito", "Cancela cuando quieras", "Soporte en español"].map((t) => (
                  <motion.span
                    key={t}
                    className="flex items-center gap-1.5"
                    variants={fadeInUp}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    {t}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

    </div>
  );
}
