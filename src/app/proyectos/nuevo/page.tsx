"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { proyectosApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, Sparkles, FileText, Tag, Euro } from "lucide-react";

const SECTORES = [
  "Tecnología e IA",
  "Salud y biotecnología",
  "Energía y sostenibilidad",
  "Industria y manufactura",
  "Agricultura y alimentación",
  "Cultura y artes",
  "Educación y formación",
  "Turismo",
  "Comercio y servicios",
  "Otro",
];

export default function NuevoProyectoPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    sector: "",
    presupuesto: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio";
    if (form.descripcion.trim().length < 30)
      errors.descripcion = "Describe tu proyecto con al menos 30 caracteres";
    return errors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Por favor, completa los campos requeridos");
      return;
    }
    setLoading(true);
    const loadingId = toast.loading("Creando proyecto y analizando con IA...");
    try {
      const payload: Record<string, string> = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        ...(form.sector ? { sector: form.sector } : {}),
        ...(form.presupuesto ? { presupuesto: form.presupuesto } : {}),
      };
      const { data } = await proyectosApi.create(payload);
      const proyecto = data as { id: number };
      toast.update(loadingId, "success", "Proyecto creado correctamente");
      router.push(`/proyectos/${proyecto.id}/recomendaciones`);
    } catch (err: unknown) {
      toast.update(
        loadingId,
        "error",
        err instanceof Error
          ? err.message
          : "No se pudo crear el proyecto. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a proyectos
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Nuevo proyecto</h1>
        <p className="text-foreground-muted mt-1">
          Describe tu proyecto con detalle para obtener mejores recomendaciones
        </p>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-3 bg-primary-light border border-primary/20 rounded-xl p-4 mb-6">
        <Sparkles className="w-4 h-4 text-primary dark:text-blue-300 mt-0.5 shrink-0" />
        <p className="text-sm text-primary/90 dark:text-blue-300 leading-relaxed">
          <strong>Consejo:</strong> Cuanto más detallada sea la descripción de tu proyecto
          (objetivos, tecnologías, público objetivo, impacto), mejores serán los resultados
          del matching con IA.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <Input
            label="Nombre del proyecto"
            placeholder="Ej: Plataforma de telemedicina rural"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            leftIcon={<FileText className="w-4 h-4" />}
            error={fieldErrors.nombre}
            required
          />

          <Textarea
            label="Descripción del proyecto"
            placeholder="Describe en detalle qué hace tu proyecto, sus objetivos, tecnologías que usa, impacto esperado, público objetivo, etc. Cuanta más información, mejores serán las recomendaciones."
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            error={fieldErrors.descripcion}
            helper={`${form.descripcion.length} caracteres (mínimo 30)`}
            rows={5}
            required
          />

          <div>
            <label
              htmlFor="sector"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Sector (opcional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
              <select
                id="sector"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface text-foreground text-sm py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-foreground-subtle transition-colors appearance-none"
              >
                <option value="">Selecciona un sector</option>
                {SECTORES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Presupuesto estimado (€) (opcional)"
            type="number"
            placeholder="Ej: 150000"
            value={form.presupuesto}
            onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}
            leftIcon={<Euro className="w-4 h-4" />}
            helper="Ayuda a filtrar convocatorias con cuantías adecuadas"
          />

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={<Sparkles className="w-4 h-4" />}
              className="flex-1 justify-center"
            >
              {loading ? "Analizando con IA..." : "Crear proyecto y buscar subvenciones"}
            </Button>
            <Link
              href="/proyectos"
              className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:bg-surface-muted transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
