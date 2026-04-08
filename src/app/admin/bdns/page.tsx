"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  RefreshCw, CheckCircle, XCircle, Clock,
  MapPin, ChevronDown, ChevronRight, StopCircle,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────────

type EstadoImportacion = "INACTIVO" | "EN_CURSO" | "COMPLETADO" | "FALLIDO";
type ModoImportacion = "FULL" | "INCREMENTAL";
interface EstadoJob {
  estado: EstadoImportacion;
  registrosImportados: number;
  ejeActual: string | null;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  error: string | null;
  modo: ModoImportacion | null;
}

interface ResumenEjecucionDTO {
  ejecucionId: string;
  tsInicio: string | null;
  tsFin: string | null;
  totalRegistrosNuevos: number;
  totalRegistrosActualizados: number;
  totalErrores: number;
  ejesProcesados: number;
  totalPaginas: number;
}

interface CampoCobertura {
  campo: string;
  conValor: number;
  porcentaje: number;
}

interface CoberturaDTO {
  totalConvocatorias: number;
  campos: CampoCobertura[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePaginas(ejeActual: string | null): { current: number; total: number } | null {
  if (!ejeActual) return null;
  const matchTotal = ejeActual.match(/pág\. (\d+)\/(\d+)/);
  if (matchTotal) return { current: parseInt(matchTotal[1]), total: parseInt(matchTotal[2]) };
  const matchSolo = ejeActual.match(/pág\. (\d+)/);
  if (matchSolo) return { current: parseInt(matchSolo[1]), total: 0 };
  return null;
}

function fmtTs(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtNum(n: number) {
  return n.toLocaleString("es-ES");
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function BarraCobertura({ campo, conValor, porcentaje }: CampoCobertura) {
  const labels: Record<string, string> = {
    organismo: "Organismo",
    fechaPublicacion: "Fecha publicación",
    descripcion: "Descripción",
    textoCompleto: "Texto completo",
    sector: "Sector",
    fechaCierre: "Fecha cierre",
    ubicacion: "Ubicación",
  };
  const color = porcentaje >= 80 ? "bg-emerald-500" : porcentaje >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-foreground-muted">{labels[campo] ?? campo}</span>
        <span className="text-xs font-medium text-foreground">
          {porcentaje.toFixed(1)}% <span className="text-foreground-muted font-normal">({fmtNum(conValor)})</span>
        </span>
      </div>
      <div className="w-full bg-surface-muted rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BdnsPage() {
  const [estadoJob, setEstadoJob]         = useState<EstadoJob | null>(null);
  const [historial, setHistorial]         = useState<ResumenEjecucionDTO[]>([]);
  const [cobertura, setCobertura]         = useState<CoberturaDTO | null>(null);
  const [loading, setLoading]             = useState(true);
  const [lanzando, setLanzando]           = useState(false);
  const [cancelando, setCancelando]       = useState(false);
  const [confirmando, setConfirmando]     = useState(false);
  const [modo, setModo]                   = useState<ModoImportacion>("FULL");
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargarTodo = async () => {
    const [estadoRes, historialRes, coberturaRes] = await Promise.allSettled([
      adminApi.bdns.estado(),
      adminApi.bdns.historial(),
      adminApi.bdns.cobertura(),
    ]);
    if (estadoRes.status === "fulfilled")    setEstadoJob(estadoRes.value.data);
    if (historialRes.status === "fulfilled") setHistorial(historialRes.value.data);
    if (coberturaRes.status === "fulfilled") setCobertura(coberturaRes.value.data);
  };

  useEffect(() => {
    cargarTodo().finally(() => setLoading(false));
  }, []);

  // Polling cuando hay un job en curso
  useEffect(() => {
    if (estadoJob?.estado === "EN_CURSO") {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          const [estadoRes, coberturaRes] = await Promise.allSettled([
            adminApi.bdns.estado(),
            adminApi.bdns.cobertura(),
          ]);
          if (estadoRes.status === "fulfilled") setEstadoJob(estadoRes.value.data);
          if (coberturaRes.status === "fulfilled") setCobertura(coberturaRes.value.data);
          if (estadoRes.status === "fulfilled" && estadoRes.value.data.estado !== "EN_CURSO") {
            clearInterval(pollingRef.current!);
            pollingRef.current = null;
            const h = await adminApi.bdns.historial();
            setHistorial(h.data);
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

  const handleCancelar = async () => {
    setCancelando(true);
    try {
      await adminApi.bdns.cancelar();
    } catch {
      // ignorar error si no había job en curso
    } finally {
      setCancelando(false);
    }
  };

  const handleConfirmar = async () => {
    setConfirmando(false);
    setLanzando(true);
    try {
      await adminApi.bdns.importar(modo);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 409) { setLanzando(false); return; }
    }
    const res = await adminApi.bdns.estado();
    setEstadoJob(res.data);
    setLanzando(false);
  };

  const enCurso   = estadoJob?.estado === "EN_CURSO";
  const pagInfo   = parsePaginas(estadoJob?.ejeActual ?? null);
  const progresoPct = pagInfo?.total ? (pagInfo.current / pagInfo.total * 100) : 0;
  const progresoPctStr = progresoPct.toFixed(2);

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Base de datos BDNS</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={cargarTodo}
            icon={<RefreshCw className="h-4 w-4" />}
            disabled={enCurso}
          >
            Refrescar
          </Button>
          {enCurso ? (
            <Button
              variant="secondary"
              onClick={handleCancelar}
              loading={cancelando}
              icon={<StopCircle className="h-4 w-4" />}
            >
              Cancelar importación
            </Button>
          ) : (
            <Button
              onClick={() => setConfirmando(true)}
              disabled={lanzando}
              loading={lanzando}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Actualizar BDNS
            </Button>
          )}
        </div>
      </div>

      {/* ── Estado del job ─────────────────────────────────────────────────── */}
      {estadoJob && estadoJob.estado !== "INACTIVO" && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            {estadoJob.estado === "EN_CURSO" && (
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {estadoJob.estado === "COMPLETADO" && <CheckCircle className="h-5 w-5 text-emerald-500" />}
            {estadoJob.estado === "FALLIDO"    && <XCircle className="h-5 w-5 text-destructive" />}
            <h2 className="font-semibold text-foreground">
              {estadoJob.estado === "EN_CURSO"   && `Importación en curso${estadoJob.modo ? ` (${estadoJob.modo})` : ""}...`}
              {estadoJob.estado === "COMPLETADO" && `Importación completada${estadoJob.modo ? ` · ${estadoJob.modo}` : ""}`}
              {estadoJob.estado === "FALLIDO"    && "Importación fallida"}
            </h2>
          </div>

          {estadoJob.estado === "EN_CURSO" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-muted">
                  <span className="font-semibold text-foreground">{fmtNum(estadoJob.registrosImportados)}</span> nuevos
                </span>
                {pagInfo?.total ? (
                  <span className="text-foreground-muted">
                    pág. <span className="font-semibold text-foreground">{fmtNum(pagInfo.current)}</span>/{fmtNum(pagInfo.total)}
                  </span>
                ) : pagInfo ? (
                  <span className="text-foreground-muted">pág. <span className="font-semibold text-foreground">{fmtNum(pagInfo.current)}</span></span>
                ) : null}
              </div>
              <div className="w-full bg-surface-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(progresoPct, 0.1)}%` }}
                />
              </div>
              <p className="text-xs text-foreground-muted text-right">{progresoPctStr}% completado</p>
            </div>
          )}

          {estadoJob.estado === "COMPLETADO" && (
            <p className="text-sm text-foreground-muted">
              <span className="font-semibold text-foreground">{fmtNum(estadoJob.registrosImportados)}</span> registros nuevos · finalizado {fmtTs(estadoJob.finalizadoEn)}
            </p>
          )}

          {estadoJob.estado === "FALLIDO" && (
            <p className="text-sm text-destructive">{estadoJob.error}</p>
          )}
        </Card>
      )}

      {/* ── Cobertura de datos ─────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-foreground-muted" />
          <h2 className="font-semibold text-foreground">Cobertura de datos</h2>
        </div>
        {!cobertura || cobertura.totalConvocatorias === 0 ? (
          <p className="text-sm text-foreground-muted">Sin datos aún.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-foreground-muted mb-2">
              Total: <span className="font-semibold text-foreground">{fmtNum(cobertura.totalConvocatorias)}</span> convocatorias
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              {cobertura.campos.map((c) => (
                <BarraCobertura key={c.campo} {...c} />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Historial de ejecuciones ───────────────────────────────────────── */}
      <Card>
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setHistorialAbierto((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-foreground-muted" />
            <h2 className="font-semibold text-foreground">Historial de ejecuciones</h2>
            {historial.length > 0 && (
              <span className="text-xs bg-surface-muted text-foreground-muted px-2 py-0.5 rounded-full">
                {historial.length}
              </span>
            )}
          </div>
          {historialAbierto
            ? <ChevronDown className="h-4 w-4 text-foreground-muted" />
            : <ChevronRight className="h-4 w-4 text-foreground-muted" />
          }
        </button>

        {historialAbierto && (
          <div className="mt-4">
            {historial.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-4">Sin ejecuciones registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 text-xs font-medium text-foreground-muted">Inicio</th>
                      <th className="text-left py-2 pr-3 text-xs font-medium text-foreground-muted">Fin</th>
                      <th className="text-right py-2 pr-3 text-xs font-medium text-foreground-muted">Ejes</th>
                      <th className="text-right py-2 pr-3 text-xs font-medium text-foreground-muted">Páginas</th>
                      <th className="text-right py-2 pr-3 text-xs font-medium text-foreground-muted">Nuevos</th>
                      <th className="text-right py-2 text-xs font-medium text-foreground-muted">Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h) => (
                      <tr key={h.ejecucionId} className="border-b border-border/50 hover:bg-surface-muted/30">
                        <td className="py-2 pr-3 text-foreground-muted whitespace-nowrap">{fmtTs(h.tsInicio)}</td>
                        <td className="py-2 pr-3 text-foreground-muted whitespace-nowrap">{fmtTs(h.tsFin)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground">{h.ejesProcesados}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground-muted">{fmtNum(h.totalPaginas)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground font-medium">{fmtNum(h.totalRegistrosNuevos)}</td>
                        <td className="py-2 text-right tabular-nums">
                          {h.totalErrores > 0
                            ? <span className="text-red-500">{fmtNum(h.totalErrores)}</span>
                            : <span className="text-foreground-muted">0</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Modal de confirmación ──────────────────────────────────────────── */}
      {confirmando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-foreground">¿Iniciar actualización masiva?</h2>
            </div>
            <p className="text-sm text-foreground-muted mb-4">
              Esta operación puede tardar varios minutos y se ejecuta en segundo plano.
            </p>

            {/* Selector de modo */}
            <div className="mb-5">
              <p className="text-xs font-medium text-foreground-muted mb-2">Modo de importación</p>
              <div className="grid grid-cols-2 gap-2">
                {(["FULL", "INCREMENTAL"] as ModoImportacion[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModo(m)}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      modo === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground-muted hover:border-foreground-muted"
                    }`}
                  >
                    <p className="text-sm font-medium">{m}</p>
                    <p className="text-xs mt-0.5 opacity-70">
                      {m === "FULL"
                        ? "Reimporta todos los ejes desde cero"
                        : "Salta los ejes ya completados, reanuda los fallidos"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

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