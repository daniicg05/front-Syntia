"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  fadeInPaso,
  stepperFlow,
  stepperStep,
  guiaTimeline,
  guiaPaso,
} from "@/lib/motion";
import "@/styles/stepper-guia.css";

interface GuiaStep {
  numero: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  icon: string; // emoji
  titulo: string;
  contenido: string;
  estado?: "completed" | "active" | "pending";
}

interface StepperGuiaProps {
  pasos: GuiaStep[];
  variant?: "stepper" | "timeline";
}

/**
 * StepperGuia: Componente visual reutilizable para:
 * 1. Stepper horizontal (8 nodos con flowchart)
 * 2. Timeline vertical (8 pasos con iconos y contenido)
 *
 * Preserva las animaciones v3.2.0:
 * - fadeInPaso: aparición escalonada con 50ms entre pasos
 * - stepperFlow/stepperStep: stepper horizontal
 * - guiaTimeline/guiaPaso: timeline vertical
 *
 * Ejemplo de uso:
 * <StepperGuia pasos={pasos8} variant="stepper" />
 * <StepperGuia pasos={pasos8} variant="timeline" />
 */
export const StepperGuia: React.FC<StepperGuiaProps> = ({
  pasos,
  variant = "timeline",
}) => {
  if (variant === "stepper") {
    return (
      <motion.div
        className="stepper-flow"
        initial="hidden"
        animate="visible"
        variants={stepperFlow}
      >
        {pasos.map((paso, idx) => (
          <motion.div
            key={paso.numero}
            className={`stepper-step ${paso.estado || "pending"}`}
            variants={stepperStep}
            custom={idx}
          >
            <div className="stepper-icon">{paso.icon}</div>
            <div className="stepper-label">{paso.titulo}</div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="guia-timeline"
      initial="hidden"
      animate="visible"
      variants={guiaTimeline}
    >
      {pasos.map((paso, idx) => (
        <motion.div
          key={paso.numero}
          className="guia-paso"
          data-step={paso.numero}
          custom={idx}
          variants={fadeInPaso}
        >
          <div className="guia-paso-icon">{paso.icon}</div>
          <div className="guia-paso-content">
            <div className="guia-paso-title">
              PASO {paso.numero} — {paso.titulo}
            </div>
            <div className="guia-paso-text">{paso.contenido}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Datos de ejemplo: 8 pasos de guía de solicitud (v3.2.0)
 */
export const PASOS_GUIA_DEFECTO: GuiaStep[] = [
  {
    numero: 1,
    icon: "📄",
    titulo: "REQUISITOS LEGALES",
    contenido:
      "Cumple requisitos universales según LGS art. 13: AEAT, TGSS, declaración responsable. Verifica también requisitos específicos de la convocatoria.",
    estado: "completed",
  },
  {
    numero: 2,
    icon: "📎",
    titulo: "DOCUMENTACIÓN OBLIGATORIA",
    contenido:
      "Reúne documentación obligatoria según bases reguladoras: certificados, poderes, justificantes. Comprueba plazos y formatos aceptados.",
    estado: "active",
  },
  {
    numero: 3,
    icon: "💻",
    titulo: "ACCESO Y PRESENTACIÓN",
    contenido:
      "Accede mediante Cl@ve o certificado digital. Descarga formularios en la sede electrónica. Cumple con medios de identificación requeridos.",
    estado: "pending",
  },
  {
    numero: 4,
    icon: "📅",
    titulo: "PLAZOS Y CALENDARIO",
    contenido:
      "Respeta plazo de presentación (plazo común: 30 días desde publicación). Horario límite: 14:00 horas. Comprueba ampliaciones o prórroga oficial.",
    estado: "pending",
  },
  {
    numero: 5,
    icon: "⚖️",
    titulo: "RÉGIMEN DE CONCESIÓN",
    contenido:
      "Entiende criterios de valoración (concurrencia competitiva vs baremación automática). Conoce orden de prelación y desempates.",
    estado: "pending",
  },
  {
    numero: 6,
    icon: "✅",
    titulo: "OBLIGACIONES POST-CONCESIÓN",
    contenido:
      "Tras aprobación: justifica gastos, cumple compromisos adquiridos, comunica cambios de circunstancias. Mantén documentación de gastos.",
    estado: "pending",
  },
  {
    numero: 7,
    icon: "🧾",
    titulo: "JUSTIFICACIÓN DE GASTOS",
    contenido:
      "Justifica inversión mediante facturas, documentos de pago y actas de realización. Respeta límites de justificación según tipo de gasto.",
    estado: "pending",
  },
  {
    numero: 8,
    icon: "⚠️",
    titulo: "ADVERTENCIAS CRÍTICAS",
    contenido:
      "Diferencia entre extracto de bases y bases reguladoras completas. Evita errores frecuentes: datos incompletos, DNI/CIF inválido, plazo caducado.",
    estado: "pending",
  },
];

/**
 * Modal con StepperGuia integrado (ejemplo)
 */
export const ModalGuiaCompleta: React.FC<{ pasos?: GuiaStep[] }> = ({
  pasos = PASOS_GUIA_DEFECTO,
}) => {
  return (
    <div className="modal modal-xl">
      <div className="modal-header">
        <h2 className="modal-title">Guía Completa de Solicitud</h2>
        <button type="button" className="btn-close" />
      </div>
      <div className="modal-body">
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>
            Flujo del Proceso
          </h3>
          <StepperGuia pasos={pasos} variant="stepper" />
        </div>

        <div>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>
            Pasos Detallados
          </h3>
          <StepperGuia pasos={pasos} variant="timeline" />
        </div>
      </div>
      <div className="modal-footer">
        <p style={{ fontSize: "0.75rem", color: "#878d91" }}>
          ⚠️ Guía orientativa según LGS 38/2003. Consulta siempre las bases
          reguladoras de la convocatoria específica.
        </p>
        <button type="button" className="btn btn-primary" data-bs-dismiss="modal">
          Cerrar
        </button>
      </div>
    </div>
  );
};

