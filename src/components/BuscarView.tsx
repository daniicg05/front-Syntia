"use client";

import { motion } from "framer-motion";
import { ConvocatoriaCard } from "@/components/ConvocatoriaCard";
import type { ConvocatoriaPublica } from "@/lib/api";

interface BuscarViewProps {
  title: string;
  description: string;
  grants: ConvocatoriaPublica[];
  isLoading?: boolean;
}

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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
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
    },
  },
};

export function BuscarView({ title, description, grants, isLoading = false }: BuscarViewProps) {
  return (
    <section id="buscarview" className="px-6 py-24 bg-surface border-y border-border">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">{title}</h2>
          <p className="mt-3 text-foreground-muted max-w-2xl mx-auto">{description}</p>
        </motion.div>

        {isLoading ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                className="h-56 bg-surface border border-border rounded-2xl animate-pulse"
                variants={cardVariants}
              />
            ))}
          </motion.div>
        ) : grants.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {grants.map((grant) => (
              <motion.div key={grant.id} variants={cardVariants}>
                <ConvocatoriaCard convocatoria={grant} autenticado={true} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-12 bg-surface rounded-2xl border border-border"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <p className="text-foreground-muted">No hay subvenciones disponibles en este momento.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
