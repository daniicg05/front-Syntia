// src/lib/motion.ts
// Shared Framer Motion variants — always import from here, never inline variants in components
import type { Variants, Transition } from "framer-motion";

export const spring: Transition = { type: "spring", stiffness: 400, damping: 30 };
export const springBouncy: Transition = { type: "spring", stiffness: 500, damping: 25 };
export const ease: Transition = { duration: 0.25, ease: [0.2, 0.0, 0.0, 1.0] };
export const easeDecelerate: Transition = { duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] };
export const easeAccelerate: Transition = { duration: 0.2, ease: [0.4, 0.0, 1.0, 1.0] };

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: ease },
  exit:    { opacity: 0, transition: easeAccelerate },
};

export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: easeDecelerate },
  exit:    { opacity: 0, y: -8, transition: easeAccelerate },
};

export const slideIn: Variants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: easeDecelerate },
  exit:    { opacity: 0, x: -20, transition: easeAccelerate },
};

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: easeDecelerate },
  exit:    { opacity: 0, x: 24, transition: easeAccelerate },
};

export const springScale: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: springBouncy },
  exit:    { opacity: 0, scale: 0.96, transition: ease },
};

export const staggerChildren: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: easeDecelerate },
};

export const pageTransition: Variants = {
  hidden:  { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: -8, transition: { duration: 0.2, ease: [0.4, 0.0, 1.0, 1.0] } },
};

export const cardHover = {
  rest:  { y: 0, boxShadow: "0 2px 8px rgba(25, 28, 30, 0.04)" },
  hover: { y: -2, boxShadow: "0 10px 40px rgba(25, 28, 30, 0.08)", transition: spring },
};

export const buttonHover = {
  rest:  { scale: 1 },
  hover: { scale: 1.02, transition: spring },
  tap:   { scale: 0.97, transition: { duration: 0.1 } },
};

export const buttonTap = {
  tap: { scale: 0.97, transition: { duration: 0.1 } },
};

export const inputFocus: Variants = {
  rest:  { boxShadow: "0 0 0 0px rgba(0, 90, 113, 0)" },
  focus: { boxShadow: "0 0 0 3px rgba(0, 90, 113, 0.15)", transition: ease },
};

export const skeletonShimmer: Variants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: { duration: 1.5, ease: "linear", repeat: Infinity },
  },
};

export const glassPanelSlide: Variants = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.0, 0.0, 0.2, 1.0] } },
  exit:    { opacity: 0, x: 40, transition: { duration: 0.25, ease: [0.4, 0.0, 1.0, 1.0] } },
};

export const streamLogItem: Variants = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

// ──────────────────────────────────────────────────────────────────────────
// PRESERVED ANIMATIONS v3.2.0 — Stepper Visual + Timeline Guía de Solicitud
// ──────────────────────────────────────────────────────────────────────────

/**
 * fadeInPaso: Aparición escalonada con 50ms entre pasos.
 * Usado en stepper horizontal y timeline vertical (guía de solicitud).
 * Ejemplo: 8 pasos → PASO 1 entra a t=0ms, PASO 2 a t=50ms, ..., PASO 8 a t=350ms
 */
export const fadeInPaso: Variants = {
  hidden:  { opacity: 0, y: 4 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.05, duration: 0.3, ease: "easeOut" },
  }),
  exit:    { opacity: 0, y: -4, transition: { duration: 0.2 } },
};

/**
 * stepperFlow: Contenedor para stepper horizontal con 8 nodos conectados.
 * Estructura: 🏛️ Portal → 📄 Requisitos → 📎 Documentación → 💻 Sede → 
 *             📅 Plazos → ⚖️ Régimen → ✅ Post-concesión → ⚠️ Advertencias
 */
export const stepperFlow: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

/**
 * stepperStep: Item individual en stepper (nodo del flowchart).
 * Estados: completed (verde), active (azul), pendiente (gris).
 */
export const stepperStep: Variants = {
  hidden:  { opacity: 0, scale: 0.9, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
};

/**
 * guiaTimeline: Contenedor para timeline vertical con 8 pasos.
 * Anima cada paso de forma escalonada (fadeInPaso).
 */
export const guiaTimeline: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
  },
};

/**
 * guiaPaso: Item individual en timeline vertical.
 * Incluye: icono emoji, etiqueta semántica, colores diferenciados por fase, contenido de paso.
 */
export const guiaPaso: Variants = {
  hidden:  { opacity: 0, x: -12, y: 4 },
  visible: { opacity: 1, x: 0, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export function reduceMotionVariants(variants: Variants): Variants {
  const reduced: Variants = {};
  for (const key in variants) {
    const v = variants[key];
    if (typeof v === "object" && v !== null && "transition" in v) {
      reduced[key] = { ...v, transition: { duration: 0 } };
    } else {
      reduced[key] = v;
    }
  }
  return reduced;
}
