"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { perfilApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ArrowRight, Sparkles } from "lucide-react";

const SECTORES = [
  { value: "tecnologia", label: "Tecnología e Innovación" },
  { value: "agricola", label: "Sector Agrícola" },
  { value: "industrial", label: "Sector Industrial" },
  { value: "hosteleria", label: "Hostelería y Turismo" },
  { value: "social", label: "Social y Cultural" },
  { value: "medioambiente", label: "Medio Ambiente" },
  { value: "comercio", label: "Comercio y Pymes" },
  { value: "salud", label: "Salud e Investigación" },
  { value: "educacion", label: "Educación y Formación" },
  { value: "otros", label: "Otros" },
];

const TIPOS_ENTIDAD = [
  { value: "autonomo", label: "Autónomo / Freelance" },
  { value: "pyme", label: "Pyme (< 250 empleados)" },
  { value: "gran_empresa", label: "Gran empresa" },
  { value: "startup", label: "Startup" },
  { value: "asociacion", label: "Asociación / ONG" },
  { value: "cooperativa", label: "Cooperativa" },
  { value: "administracion", label: "Administración pública" },
  { value: "centro_investigacion", label: "Centro de investigación" },
];

interface FormState {
  sector: string;
  ubicacion: string;
  empresa: string;
  tipoEntidad: string;
  descripcionLibre: string;
}

export default function CompletarPerfilPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    sector: "",
    ubicacion: "",
    empresa: "",
    tipoEntidad: "",
    descripcionLibre: "",
  });

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function canAdvanceStep1() {
    return form.sector.trim() !== "" && form.ubicacion.trim() !== "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canAdvanceStep1()) {
      toast.error("Sector y ubicación son obligatorios");
      return;
    }

    setSaving(true);
    const loadingId = toast.loading("Guardando tu perfil...");
    try {
      await perfilApi.save({
        sector: form.sector,
        ubicacion: form.ubicacion,
        empresa: form.empresa || undefined,
        tipoEntidad: form.tipoEntidad || undefined,
        descripcionLibre: form.descripcionLibre || undefined,
      });
      toast.update(loadingId, "success", "Perfil completado. ¡Bienvenido!");
      router.push("/home");
    } catch {
      toast.update(loadingId, "error", "No se pudo guardar el perfil. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-light mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Completa tu perfil</h1>
          <p className="text-sm text-foreground-muted max-w-sm mx-auto">
            Esta información permite a nuestra IA identificar las subvenciones más relevantes para ti.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-full h-1.5 rounded-full transition-colors ${
                  step >= s ? "bg-primary" : "bg-border"
                }`}
              />
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 space-y-5">
            {step === 1 && (
              <>
                <div>
                  <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-3">
                    Paso 1 de 2 — Sector y ubicación
                  </p>
                  <h2 className="font-semibold text-foreground text-lg mb-5">
                    ¿En qué sector opera tu actividad principal?
                  </h2>
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                    Sector <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTORES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => set("sector")(s.value)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${
                          form.sector === s.value
                            ? "border-primary bg-primary-light text-primary"
                            : "border-border text-foreground-muted hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ubicacion */}
                <div>
                  <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                    Comunidad Autónoma / Provincia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ubicacion}
                    onChange={(e) => set("ubicacion")(e.target.value)}
                    placeholder="Ej: Madrid, Cataluña, Andalucía..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>

                <button
                  type="button"
                  disabled={!canAdvanceStep1()}
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <p className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-3">
                    Paso 2 de 2 — Información adicional (opcional)
                  </p>
                  <h2 className="font-semibold text-foreground text-lg mb-5">
                    Cuéntanos un poco más sobre ti
                  </h2>
                </div>

                {/* Tipo de entidad */}
                <div>
                  <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                    Tipo de entidad
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_ENTIDAD.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => set("tipoEntidad")(t.value)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${
                          form.tipoEntidad === t.value
                            ? "border-primary bg-primary-light text-primary"
                            : "border-border text-foreground-muted hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Empresa */}
                <div>
                  <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                    Nombre de empresa u organización
                  </label>
                  <input
                    type="text"
                    value={form.empresa}
                    onChange={(e) => set("empresa")(e.target.value)}
                    placeholder="Ej: Innovatech S.L., Asociación..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>

                {/* Descripcion libre */}
                <div>
                  <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                    Describe brevemente tu actividad
                  </label>
                  <textarea
                    value={form.descripcionLibre}
                    onChange={(e) => set("descripcionLibre")(e.target.value)}
                    placeholder="Ej: Desarrollamos software para el sector agrícola, con foco en automatización de riegos..."
                    rows={3}
                    maxLength={2000}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                  />
                  <p className="text-xs text-foreground-subtle mt-1 text-right">
                    {form.descripcionLibre.length}/2000
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Empezar a explorar
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-foreground-subtle">
                  Puedes actualizar esta información en cualquier momento desde tu perfil.
                </p>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
