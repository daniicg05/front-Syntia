"use client";

import { useState } from "react";
import ContainerSuscription from "@/components/ui/ContainerSuscription"
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { PricingCard } from "@/components/ui/PricingCard";

export default function SuscripcionPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const plans = [
    {
      title: "Free",
      price: "0 €/mes",
      features: [
        "Hasta 3 búsquedas guardadas",
        "Alertas por email (diarias)",
      ],
      cta: "Seleccionar Free Plan",
    },
    {
      title: "Professional",
      price: "12,90 €/mes",
      features: [
        "Búsquedas y suscripciones ilimitadas",
        "Análisis con IA y guias detalladas de solicitud",
        "Filtros avanzados por convocatoria, sector y región",
        "Plantillas de solicitud y seguimiento",
      ],
      highlighted: true,
      cta: "Seleccionar Pro",
    },
    {
      title: "Enterprise",
      price: "89,90 €/mes",
      features: [
        "Gestión multi-usuario y permisos",
        "Integración API y exportación de datos",
        "Soporte prioritario y asesoría en convocatorias",
      ],
      cta: "Seleccionar Enterprise",
    },
  ];

  return (
    <ContainerSuscription>
      <div className="text-center mb-20">
        <Heading size="h1">Elige tu plan</Heading>
        <Text className="max-w-xl mx-auto mt-3">Gestiona tus suscripciones con claridad y control profesional.</Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
        {plans.map((p) => (
          <div key={p.title} className="relative">
            <PricingCard
              title={p.title}
              price={p.price}
              features={p.features}
              highlighted={p.highlighted}
              cta={p.cta}
              onSelect={() => setSelected(p.title)}
            />
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-8 text-center">
          <p className="text-sm text-foreground-muted">Has seleccionado:</p>
          <p className="text-lg font-semibold text-foreground">{selected}</p>
        </div>
      )}
    </ContainerSuscription>
  );
}
