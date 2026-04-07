"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { proyectosApi } from "@/src/lib/api";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import Link from "next/link";

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  sector: z.string().optional(),
  ubicacion: z.string().optional(),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string; duration: number } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const showToast = (type: "success" | "error", message: string, duration: number) => {
    setToast({ type, message, duration });
    setToastVisible(false);
    requestAnimationFrame(() => setToastVisible(true));
  };

  const onSubmit = async (data: FormData) => {
    try {
      setToast(null);
      await proyectosApi.create(data as Record<string, string>);
      router.push("/proyectos?created=1");
    } catch {
      showToast("error", "No se pudo crear el proyecto. Revisa los datos e intentalo de nuevo.", 4500);
    }
  };

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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/proyectos" className="text-sm text-blue-600 hover:underline">← Volver a proyectos</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nuevo proyecto</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre del proyecto" placeholder="Ej: Plataforma de energía solar..." error={errors.nombre?.message} {...register("nombre")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Sector" placeholder="Ej: Energía, Tecnología..." {...register("sector")} />
            <Input label="Ubicación" placeholder="Ej: Madrid, Andalucía..." {...register("ubicacion")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea rows={5} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe brevemente tu proyecto..." {...register("descripcion")} />
          </div>
          <div className="flex justify-end gap-3">
            <Link href="/proyectos"><Button variant="secondary" type="button">Cancelar</Button></Link>
            <Button type="submit" loading={isSubmitting}>Crear proyecto</Button>
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