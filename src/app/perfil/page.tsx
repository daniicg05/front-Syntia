"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { perfilApi } from "@/src/lib/api";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";

interface PerfilForm {
  sector: string;
  ubicacion: string;
  tipoEntidad: string;
  objetivos: string;
  necesidadesFinanciacion: string;
  descripcionLibre: string;
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string; duration: number } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PerfilForm>();

  const showToast = (type: "success" | "error", message: string, duration: number) => {
    setToast({ type, message, duration });
    setToastVisible(false);
    requestAnimationFrame(() => setToastVisible(true));
  };

  useEffect(() => {
    perfilApi.get()
      .then((res) => { if (res.data) reset(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reset]);

  useEffect(() => {
    if (!toast) return;
    const hideDelay = Math.max(toast.duration - 250, 0);
    const hideTimer = setTimeout(() => setToastVisible(false), hideDelay);
    const removeTimer = setTimeout(() => setToast(null), toast.duration);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [toast]);

  const onSubmit = async (data: PerfilForm) => {
    try {
      setToast(null);
      await perfilApi.save(data);
      showToast("success", "Perfil guardado correctamente", 3500);
    } catch {
      showToast("error", "No se pudo guardar el perfil. Intentalo de nuevo.", 4500);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Sector" placeholder="Ej: Tecnología, Agricultura..." {...register("sector")} />
            <Input label="Ubicación" placeholder="Ej: Madrid, Cataluña..." {...register("ubicacion")} />
            <Input label="Tipo de entidad" placeholder="Ej: PYME, Startup, ONG..." {...register("tipoEntidad")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Objetivos</label>
            <textarea rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe los objetivos de tu entidad..." {...register("objetivos")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Necesidades de financiación</label>
            <textarea rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="¿Para qué necesitas financiación?" {...register("necesidadesFinanciacion")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripción libre</label>
            <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cualquier información adicional relevante..." {...register("descripcionLibre")} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting}>Guardar perfil</Button>
          </div>
        </form>
      </Card>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border px-6 py-3 text-sm shadow-lg transition-all duration-300 ease-out",
            toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none",
            toast.type === "success"
              ? "bg-green-100 border-green-300 text-green-800"
              : "bg-red-100 border-red-300 text-red-800",
          ].join(" ")}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}