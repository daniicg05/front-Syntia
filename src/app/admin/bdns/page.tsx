"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Database, CheckCircle, XCircle, Clock } from "lucide-react";

type EstadoImportacion = "INACTIVO" | "EN_CURSO" | "COMPLETADO" | "FALLIDO";

interface EstadoJob {
  estado: EstadoImportacion;
  paginaActual: number;
  registrosImportados: number;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  error: string | null;
}

interface UltimaImportacion {
  estado?: string;
  registrosImportados?: number;
  finalizadoEn?: string;
  message?: string;
}

export default function BdnsPage() {
  const [estadoJob, setEstadoJob] = useState<EstadoJob | null>(null);
  const [ultimaImportacion, setUltimaImportacion] = useState<UltimaImportacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [lanzando, setLanzando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarEstado = async () => {
    const [estadoRes, ultimaRes] = await Promise.all([
      adminApi.bdns.estado(),
      adminApi.bdns.ultimaImportacion(),
    ]);
    setEstadoJob(estadoRes.data);
    setUltimaImportacion(ultimaRes.data);
  };

  useEffect(() => {
    cargarEstado().finally(() => setLoading(false));
  }, []);

  // Arrancar / parar polling según estado
  useEffect(() => {
    if (estadoJob?.estado === "EN_CURSO") {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          const res = await adminApi.bdns.estado();
          setEstadoJob(res.data);
          if (res.data.estado !== "EN_CURSO") {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            adminApi.bdns.ultimaImportacion().then((r) => setUltimaImportacion(r.data));
          }
        }, 5000);
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [estadoJob?.estado]);

  const handleConfirmar = async () => {
    setConfirmando(false);
    setLanzando(true);
    try {
      await adminApi.bdns.importar();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 409) {
        setLanzando(false);
        return;
      }
    }
    const res = await adminApi.bdns.estado();
    setEstadoJob(res.data);
    setLanzando(false);
  };

  const enCurso = estadoJob?.estado === "EN_CURSO";

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Base de datos BDNS</h1>

      {/* Última importación */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Database className="h-5 w-5 text-foreground-muted" />
          <h2 className="font-semibold text-foreground">Última importación</h2>
        </div>
        {ultimaImportacion?.message ? (
          <p className="text-sm text-foreground-muted">{ultimaImportacion.message}</p>
        ) : (
          <div className="text-sm text-foreground-muted space-y-1">
            <p>
              <span className="font-medium text-foreground">Estado:</span>{" "}
              {ultimaImportacion?.estado}
            </p>
            <p>
              <span className="font-medium text-foreground">Registros importados:</span>{" "}
              {ultimaImportacion?.registrosImportados?.toLocaleString()}
            </p>
            <p>
              <span className="font-medium text-foreground">Finalizada:</span>{" "}
              {ultimaImportacion?.finalizadoEn ?? "—"}
            </p>
          </div>
        )}
      </Card>

      {/* Estado actual del job */}
      {estadoJob && estadoJob.estado !== "INACTIVO" && (
        <Card className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            {estadoJob.estado === "EN_CURSO" && (
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {estadoJob.estado === "COMPLETADO" && (
              <CheckCircle className="h-5 w-5 text-primary" />
            )}
            {estadoJob.estado === "FALLIDO" && (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <h2 className="font-semibold text-foreground">
              {estadoJob.estado === "EN_CURSO" && "Importación en curso..."}
              {estadoJob.estado === "COMPLETADO" && "Importación completada"}
              {estadoJob.estado === "FALLIDO" && "Importación fallida"}
            </h2>
          </div>

          {estadoJob.estado === "EN_CURSO" && (
            <div className="space-y-2">
              <p className="text-sm text-foreground-muted">
                Página{" "}
                <span className="font-semibold text-foreground">{estadoJob.paginaActual}</span>
                {" · "}
                <span className="font-semibold text-foreground">
                  {estadoJob.registrosImportados.toLocaleString()}
                </span>{" "}
                registros nuevos importados
              </p>
              <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-2 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {estadoJob.estado === "COMPLETADO" && (
            <p className="text-sm text-foreground-muted">
              <span className="font-semibold text-foreground">
                {estadoJob.registrosImportados.toLocaleString()}
              </span>{" "}
              registros nuevos en{" "}
              <span className="font-semibold text-foreground">
                {estadoJob.paginaActual + 1}
              </span>{" "}
              páginas procesadas.
            </p>
          )}

          {estadoJob.estado === "FALLIDO" && (
            <p className="text-sm text-destructive">{estadoJob.error}</p>
          )}
        </Card>
      )}

      {/* Botón */}
      <Button
        onClick={() => setConfirmando(true)}
        disabled={enCurso || lanzando}
        loading={lanzando}
        icon={<RefreshCw className="h-4 w-4" />}
      >
        {enCurso ? "Importación en curso..." : "Actualizar BDNS"}
      </Button>

      {/* Modal de confirmación */}
      {confirmando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-foreground">¿Iniciar actualización masiva?</h2>
            </div>
            <p className="text-sm text-foreground-muted mb-5">
              Esta operación importará todas las convocatorias de la BDNS (más de 600.000
              registros). Puede tardar varios minutos y se ejecutará en segundo plano.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmar}>Confirmar</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}