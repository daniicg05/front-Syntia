"use client";

import type { ReactNode } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { adminApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Download,
  ListTree,
  PauseCircle,
  RefreshCw,
  SkipForward,
  Zap,
} from "lucide-react";

type EstadoImportacion = "INACTIVO" | "EN_CURSO" | "COMPLETADO" | "FALLIDO";
type EstadoProceso = EstadoImportacion | "CANCELADO";
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

interface ConteoCatalogos {
  finalidades: number;
  instrumentos: number;
  beneficiarios: number;
  actividades: number;
  reglamentos: number;
  objetivos: number;
  sectores: number;
  organos: number;
}

interface CatalogoJobEstado {
  estado: EstadoProceso;
  fase: string | null;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  error: string | null;
  resultado?: ConteoCatalogos | null;
}

interface CatalogoEtlResponse {
  job: CatalogoJobEstado | null;
  conteos: ConteoCatalogos;
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

interface ConteoIndices {
  finalidades: number;
  instrumentos: number;
  beneficiarios: number;
  organos: number;
  tiposAdmin: number;
}

interface IndiceJobEstado {
  estado: EstadoProceso;
  fase: string | null;
  totalRegistros: number;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  error: string | null;
}

function parsePaginas(s: string | null) {
  if (!s) return null;
  const m = s.match(/pág\. (\d+)\/(\d+)/);
  if (m) return { current: parseInt(m[1], 10), total: parseInt(m[2], 10) };
  const m2 = s.match(/pág\. (\d+)/);
  if (m2) return { current: parseInt(m2[1], 10), total: 0 };
  return null;
}

function fmtTs(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  const backendError =
    (error as { response?: { data?: { error?: string; mensaje?: string; message?: string } } })?.response?.data;
  return backendError?.error ?? backendError?.mensaje ?? backendError?.message ?? fallback;
}

const fmtNum = (n: number) => n.toLocaleString("es-ES");

function EstadoBadge({ estado }: { estado: EstadoProceso }) {
  if (estado === "INACTIVO") return null;

  const cfg: Record<Exclude<EstadoProceso, "INACTIVO">, { cls: string; label: string }> = {
    EN_CURSO: {
      cls: "bg-primary/10 text-primary border-primary/20",
      label: "En curso",
    },
    COMPLETADO: {
      cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      label: "Completado",
    },
    FALLIDO: {
      cls: "bg-destructive/10 text-destructive border-destructive/20",
      label: "Fallido",
    },
    CANCELADO: {
      cls: "bg-amber-500/10 text-amber-600 border-amber-200",
      label: "Pausado",
    },
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg[estado].cls}`}
    >
      {estado === "EN_CURSO" && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
      {cfg[estado].label}
    </span>
  );
}

function BarraProgreso({ pct, colorClass = "bg-primary" }: { pct: number; colorClass?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
      <motion.div
        className={`h-1.5 rounded-full ${colorClass}`}
        animate={{ width: `${Math.max(pct, 0.5)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function BarraCobertura({ campo, conValor, porcentaje }: CampoCobertura) {
  const labels: Record<string, string> = {
    organismo: "Organismo",
    fechaPublicacion: "F. publicación",
    descripcion: "Descripción",
    textoCompleto: "Texto completo",
    sector: "Sector",
    fechaCierre: "F. cierre",
    ubicacion: "Ubicación",
  };
  const color =
    porcentaje >= 80 ? "bg-emerald-500" : porcentaje >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-foreground-muted">{labels[campo] ?? campo}</span>
        <span className="text-xs font-medium text-foreground">
          {porcentaje.toFixed(1)}%{" "}
          <span className="font-normal text-foreground-muted">({fmtNum(conValor)})</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-muted">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

function ConteoGrid({ items }: { items: { label: string; val: number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map(({ label, val }) => (
        <div key={label} className="rounded-lg bg-surface-muted px-2.5 py-1.5">
          <p className="mb-0.5 text-[11px] leading-none text-foreground-muted">{label}</p>
          <p className={`text-base font-bold tabular-nums ${val > 0 ? "text-foreground" : "text-foreground-muted/50"}`}>
            {fmtNum(val)}
          </p>
        </div>
      ))}
    </div>
  );
}

function JobBlock({
  icon,
  title,
  description,
  estado,
  progreso,
  resumen,
  error,
  primaryAction,
  secondaryAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  estado: EstadoProceso;
  progreso?: ReactNode;
  resumen?: ReactNode;
  error?: string | null;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface/50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-foreground-muted">{description}</p>
          </div>
        </div>
        <EstadoBadge estado={estado} />
      </div>

      {progreso ? <div className="mb-3">{progreso}</div> : null}
      {resumen ? <div className="mb-3 text-xs text-foreground-muted">{resumen}</div> : null}
      {error ? <p className="mb-3 text-xs text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        {primaryAction}
        {secondaryAction}
      </div>
    </div>
  );
}

export default function BdnsPage() {
  const toast = useToast();

  const [estadoJob, setEstadoJob] = useState<EstadoJob | null>(null);
  const [historial, setHistorial] = useState<ResumenEjecucionDTO[]>([]);
  const [cobertura, setCobertura] = useState<CoberturaDTO | null>(null);
  const [lanzando, setLanzando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [modo, setModo] = useState<ModoImportacion>("FULL");
  const [turbo, setTurbo] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [conteoCats, setConteoCats] = useState<ConteoCatalogos | null>(null);
  const [catalogoJob, setCatalogoJob] = useState<CatalogoJobEstado | null>(null);
  const [lanzandoCats, setLanzandoCats] = useState(false);
  const [cancelandoCats, setCancelandoCats] = useState(false);
  const pollingCatsRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [conteoIdx, setConteoIdx] = useState<ConteoIndices | null>(null);
  const [indiceJob, setIndiceJob] = useState<IndiceJobEstado | null>(null);
  const [lanzandoIdx, setLanzandoIdx] = useState(false);
  const [cancelandoIdx, setCancelandoIdx] = useState(false);
  const pollingIdxRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingIdxWarmupRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingIdxBusyRef = useRef(false);
  const pollingIdxWarmupBusyRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [coberturaAbierta, setCoberturaAbierta] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [paginaSalto, setPaginaSalto] = useState("");
  const [estableciendo, setEstableciendo] = useState(false);
  const [saltadoOk, setSaltadoOk] = useState(false);

  const cargarCatalogos = async () => {
    const res = await adminApi.etl.conteoCatalogos();
    const data = res.data as CatalogoEtlResponse;
    setCatalogoJob(data.job);
    setConteoCats(data.conteos);
    return data;
  };

  const cargarIndices = async () => {
    const res = await adminApi.etl.estadoIndices();
    setIndiceJob(res.data.job);
    setConteoIdx(res.data.conteos);
    return res.data;
  };

  const detenerWarmupIndices = () => {
    if (pollingIdxWarmupRef.current) {
      clearInterval(pollingIdxWarmupRef.current);
      pollingIdxWarmupRef.current = null;
    }
    pollingIdxWarmupBusyRef.current = false;
  };

  const iniciarWarmupIndices = () => {
    if (pollingIdxWarmupRef.current) return;

    let intentos = 0;
    pollingIdxWarmupRef.current = setInterval(async () => {
      if (pollingIdxWarmupBusyRef.current) return;
      pollingIdxWarmupBusyRef.current = true;
      intentos += 1;

      try {
        const res = await adminApi.etl.estadoIndices().catch(() => null);
        if (!res) {
          if (intentos >= 40) detenerWarmupIndices();
          return;
        }

        setIndiceJob(res.data.job);
        setConteoIdx(res.data.conteos);

        const estado = res.data.job?.estado;
        const esTerminal = estado === "COMPLETADO" || estado === "FALLIDO" || estado === "CANCELADO";
        if (estado === "EN_CURSO" || esTerminal || intentos >= 40) {
          detenerWarmupIndices();
        }
      } finally {
        pollingIdxWarmupBusyRef.current = false;
      }
    }, 1000);
  };

  const cargarEtl = async () => {
    await Promise.allSettled([cargarCatalogos(), cargarIndices()]);
  };

  const cargarTodo = async () => {
    const [estadoRes, historialRes, coberturaRes] = await Promise.allSettled([
      adminApi.bdns.estado(),
      adminApi.bdns.historial(),
      adminApi.bdns.cobertura(),
    ]);

    if (estadoRes.status === "fulfilled") setEstadoJob(estadoRes.value.data);
    if (historialRes.status === "fulfilled") setHistorial(historialRes.value.data);
    if (coberturaRes.status === "fulfilled") setCobertura(coberturaRes.value.data);

    await cargarEtl();
  };

  const cargarTodoInicial = useEffectEvent(async () => {
    await cargarTodo();
    setLoading(false);
  });

  useEffect(() => {
    void cargarTodoInicial();
  }, []);

  useEffect(() => {
    if (estadoJob?.estado === "EN_CURSO" && !pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        const [eRes, cRes] = await Promise.allSettled([adminApi.bdns.estado(), adminApi.bdns.cobertura()]);
        if (eRes.status === "fulfilled") {
          setEstadoJob(eRes.value.data);
          if (eRes.value.data.estado !== "EN_CURSO" && pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            adminApi.bdns.historial().then((r) => setHistorial(r.data)).catch(() => null);
          }
        }
        if (cRes.status === "fulfilled") setCobertura(cRes.value.data);
      }, 5000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [estadoJob?.estado]);

  useEffect(() => {
    if (catalogoJob?.estado === "EN_CURSO" && !pollingCatsRef.current) {
      pollingCatsRef.current = setInterval(async () => {
        const res = await adminApi.etl.conteoCatalogos().catch(() => null);
        if (!res) return;
        const data = res.data as CatalogoEtlResponse;
        setCatalogoJob(data.job);
        setConteoCats(data.conteos);
        if (data.job?.estado !== "EN_CURSO" && pollingCatsRef.current) {
          clearInterval(pollingCatsRef.current);
          pollingCatsRef.current = null;
        }
      }, 1500);
    }

    return () => {
      if (pollingCatsRef.current) {
        clearInterval(pollingCatsRef.current);
        pollingCatsRef.current = null;
      }
    };
  }, [catalogoJob?.estado]);

  useEffect(() => {
    if (indiceJob?.estado === "EN_CURSO" && !pollingIdxRef.current) {
      detenerWarmupIndices();
      pollingIdxRef.current = setInterval(async () => {
        if (pollingIdxBusyRef.current) return;
        pollingIdxBusyRef.current = true;

        try {
          const res = await adminApi.etl.estadoIndices().catch(() => null);
          if (!res) return;
          setIndiceJob(res.data.job);
          setConteoIdx(res.data.conteos);
          const estado = res.data.job?.estado;
          if (estado !== "EN_CURSO" && pollingIdxRef.current) {
            clearInterval(pollingIdxRef.current);
            pollingIdxRef.current = null;
            adminApi.etl.conteoCatalogos()
              .then((r) => {
                const data = r.data as CatalogoEtlResponse;
                setCatalogoJob(data.job);
                setConteoCats(data.conteos);
              })
              .catch(() => null);
          }
        } finally {
          pollingIdxBusyRef.current = false;
        }
      }, 1500);
    }

    return () => {
      if (pollingIdxRef.current) {
        clearInterval(pollingIdxRef.current);
        pollingIdxRef.current = null;
      }
      pollingIdxBusyRef.current = false;
    };
  }, [indiceJob?.estado]);

  useEffect(() => {
    return () => {
      if (pollingIdxRef.current) {
        clearInterval(pollingIdxRef.current);
        pollingIdxRef.current = null;
      }
      if (pollingIdxWarmupRef.current) {
        clearInterval(pollingIdxWarmupRef.current);
        pollingIdxWarmupRef.current = null;
      }
    };
  }, []);

  const handleConfirmar = async () => {
    setConfirmando(false);
    setLanzando(true);
    const loadingId = toast.loading("Iniciando importación de convocatorias...");

    try {
      await adminApi.bdns.importar(modo, turbo ? 0 : -1);
      const res = await adminApi.bdns.estado();
      setEstadoJob(res.data);
      toast.update(loadingId, "success", "Importación de convocatorias iniciada.");
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        const res = await adminApi.bdns.estado().catch(() => null);
        if (res) setEstadoJob(res.data);
        toast.update(loadingId, "info", "Ya había una importación de convocatorias en curso.");
      } else {
        toast.update(loadingId, "error", getErrorMessage(error, "No se pudo iniciar la importación."));
      }
    } finally {
      setLanzando(false);
    }
  };

  const handleCancelar = async () => {
    setCancelando(true);
    try {
      await adminApi.bdns.cancelar();
      toast.success("Pausa solicitada para la importación de convocatorias.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No se pudo pausar la importación."));
    } finally {
      const res = await adminApi.bdns.estado().catch(() => null);
      if (res) setEstadoJob(res.data);
      setCancelando(false);
    }
  };

  const handleConstruirCatalogos = async () => {
    setLanzandoCats(true);
    const loadingId = toast.loading("Iniciando construcción de catálogos...");

    try {
      await adminApi.etl.importarCatalogos();
      // Estado optimista para habilitar pausa mientras el backend consolida EN_CURSO.
      setCatalogoJob((prev) => ({
        estado: "EN_CURSO",
        fase: prev?.fase ?? "Iniciando...",
        iniciadoEn: prev?.iniciadoEn ?? new Date().toISOString(),
        finalizadoEn: null,
        error: null,
        resultado: prev?.resultado ?? null,
      }));
      void cargarCatalogos().catch(() => null);
      toast.update(loadingId, "success", "Construcción de catálogos iniciada.");
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        await cargarCatalogos().catch(() => null);
        toast.update(loadingId, "info", "Ya hay una construcción de catálogos en curso.");
      } else {
        await cargarCatalogos().catch(() => null);
        toast.update(loadingId, "error", getErrorMessage(error, "No se pudo iniciar la construcción de catálogos."));
      }
    } finally {
      setLanzandoCats(false);
    }
  };

  const handleCancelarCatalogos = async () => {
    setCancelandoCats(true);
    try {
      await adminApi.etl.cancelarCatalogos();
      toast.success("Pausa solicitada para la construcción de catálogos.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No se pudo pausar la construcción de catálogos."));
    } finally {
      await cargarCatalogos().catch(() => null);
      setCancelandoCats(false);
    }
  };

  const handleConstruirIndices = async () => {
    setLanzandoIdx(true);
    const loadingId = toast.loading("Iniciando construcción de índices...");

    try {
      await adminApi.etl.construirIndices();
      // Estado optimista para habilitar pausa mientras el backend consolida EN_CURSO.
      setIndiceJob((prev) => ({
        estado: "EN_CURSO",
        fase: prev?.fase ?? "Iniciando...",
        totalRegistros: prev?.totalRegistros ?? 0,
        iniciadoEn: prev?.iniciadoEn ?? new Date().toISOString(),
        finalizadoEn: null,
        error: null,
      }));
      void cargarIndices().catch(() => null);
      iniciarWarmupIndices();
      toast.update(loadingId, "success", "Construcción de índices iniciada.");
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        await cargarIndices().catch(() => null);
        toast.update(loadingId, "info", "Ya hay un job de índices en curso.");
      } else {
        await cargarIndices().catch(() => null);
        toast.update(loadingId, "error", getErrorMessage(error, "No se pudo iniciar la construcción de índices."));
      }
    } finally {
      setLanzandoIdx(false);
    }
  };

  const handleCancelarIndices = async () => {
    setCancelandoIdx(true);
    try {
      detenerWarmupIndices();
      await adminApi.etl.cancelarIndices();
      toast.success("Pausa solicitada para la construcción de índices.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No se pudo pausar la construcción de índices."));
    } finally {
      await cargarIndices().catch(() => null);
      setCancelandoIdx(false);
    }
  };

  const handleEstablecerPagina = async () => {
    const n = parseInt(paginaSalto, 10);
    if (isNaN(n) || n < 0) return;
    setEstableciendo(true);
    try {
      await adminApi.bdns.setSyncStatePagina(n);
      setSaltadoOk(true);
      toast.success(`Punto de reanudación fijado en la página ${n + 1}.`);
      setTimeout(() => setSaltadoOk(false), 3000);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "No se pudo establecer el punto de reanudación."));
    } finally {
      setEstableciendo(false);
    }
  };

  const enCurso = estadoJob?.estado === "EN_CURSO";
  const catsEnCurso = catalogoJob?.estado === "EN_CURSO" || lanzandoCats;
  const idxEnCurso = indiceJob?.estado === "EN_CURSO" || lanzandoIdx;
  const pagInfo = parsePaginas(estadoJob?.ejeActual ?? null);
  const progresoPct = pagInfo?.total ? (pagInfo.current / pagInfo.total) * 100 : 0;

  const totalCats = conteoCats
    ? conteoCats.finalidades +
      conteoCats.instrumentos +
      conteoCats.beneficiarios +
      conteoCats.actividades +
      conteoCats.reglamentos +
      conteoCats.objetivos +
      conteoCats.sectores +
      conteoCats.organos
    : 0;

  const totalIdx = conteoIdx
    ? conteoIdx.finalidades +
      conteoIdx.instrumentos +
      conteoIdx.beneficiarios +
      conteoIdx.organos +
      conteoIdx.tiposAdmin
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Base de datos BDNS</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Convocatorias, catálogos e índices se controlan por separado desde este panel.
          </p>
        </div>
        <Button variant="secondary" onClick={cargarTodo} icon={<RefreshCw className="h-4 w-4" />}>
          Refrescar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Convocatorias BDNS</h2>
                <p className="text-xs text-foreground-muted">~615k registros de la API pública</p>
              </div>
            </div>
            <EstadoBadge estado={estadoJob?.estado ?? "INACTIVO"} />
          </div>

          <AnimatePresence>
            {enCurso && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 space-y-2"
              >
                <div className="flex justify-between text-xs text-foreground-muted">
                  <span>{estadoJob?.ejeActual ?? "Procesando..."}</span>
                  {pagInfo?.total ? (
                    <span>
                      pág. {fmtNum(pagInfo.current)}/{fmtNum(pagInfo.total)}
                    </span>
                  ) : pagInfo ? (
                    <span>pág. {fmtNum(pagInfo.current)}</span>
                  ) : null}
                </div>
                <BarraProgreso pct={progresoPct} />
                <div className="flex justify-between text-xs">
                  <span className="text-foreground-muted">
                    <span className="font-semibold text-foreground">
                      {fmtNum(estadoJob?.registrosImportados ?? 0)}
                    </span>{" "}
                    nuevos
                  </span>
                  <span className="text-foreground-muted">{progresoPct.toFixed(1)}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {estadoJob?.estado === "COMPLETADO" && (
            <p className="mb-3 text-xs text-foreground-muted">
              <span className="font-semibold text-emerald-600">{fmtNum(estadoJob.registrosImportados)}</span> importados ·{" "}
              {fmtTs(estadoJob.finalizadoEn)}
            </p>
          )}
          {estadoJob?.estado === "FALLIDO" && <p className="mb-3 text-xs text-destructive">{estadoJob.error}</p>}

          {cobertura && cobertura.totalConvocatorias > 0 && (
            <p className="mb-3 text-xs text-foreground-muted">
              <span className="font-semibold text-foreground">{fmtNum(cobertura.totalConvocatorias)}</span> convocatorias en BD
            </p>
          )}

          <div className="flex gap-2">
            {enCurso ? (
              <Button
                variant="secondary"
                onClick={handleCancelar}
                loading={cancelando}
                icon={<PauseCircle className="h-4 w-4" />}
                className="flex-1"
              >
                Pausar importación
              </Button>
            ) : (
              <Button
                onClick={() => setConfirmando(true)}
                disabled={lanzando}
                loading={lanzando}
                icon={<Download className="h-4 w-4" />}
                className="flex-1"
              >
                Importar convocatorias
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <ListTree className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Catálogos e índices</h2>
                <p className="text-xs text-foreground-muted">Flujos separados con control independiente</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <JobBlock
              icon={<Database className="h-4 w-4 text-violet-500" />}
              title="Catálogos"
              description="Tablas de referencia BDNS"
              estado={catalogoJob?.estado ?? "INACTIVO"}
              progreso={
                catsEnCurso ? (
                  <div className="space-y-2">
                    <p className="text-xs text-foreground-muted">{catalogoJob?.fase ?? "Procesando..."}</p>
                    <BarraProgreso pct={100} colorClass="bg-violet-500" />
                  </div>
                ) : undefined
              }
              resumen={
                totalCats > 0 ? (
                  <>
                    Catálogos: <span className="font-semibold text-foreground">{fmtNum(totalCats)}</span>
                    {catalogoJob?.estado === "COMPLETADO" || catalogoJob?.estado === "CANCELADO"
                      ? ` · ${fmtTs(catalogoJob.finalizadoEn)}`
                      : ""}
                  </>
                ) : undefined
              }
              error={catalogoJob?.estado === "FALLIDO" ? catalogoJob.error : null}
              primaryAction={
                <Button
                  onClick={handleConstruirCatalogos}
                  loading={lanzandoCats}
                  disabled={lanzandoCats || catsEnCurso}
                  icon={<Database className="h-4 w-4" />}
                  className="flex-1"
                >
                  Construir catálogos
                </Button>
              }
              secondaryAction={
                <Button
                  variant="secondary"
                  onClick={handleCancelarCatalogos}
                  loading={cancelandoCats}
                  disabled={!catsEnCurso || cancelandoCats}
                  icon={<PauseCircle className="h-4 w-4" />}
                  className="flex-1"
                >
                  Pausar
                </Button>
              }
            />

            <JobBlock
              icon={<ListTree className="h-4 w-4 text-violet-500" />}
              title="Índices"
              description="Asociaciones idx_* y cruces"
              estado={indiceJob?.estado ?? "INACTIVO"}
              progreso={
                idxEnCurso ? (
                  <div className="space-y-2">
                    <p className="text-xs text-foreground-muted">{indiceJob?.fase ?? "Procesando..."}</p>
                    <BarraProgreso pct={100} colorClass="bg-violet-500" />
                  </div>
                ) : undefined
              }
              resumen={
                totalIdx > 0 ? (
                  <>
                    Índices: <span className="font-semibold text-foreground">{fmtNum(totalIdx)}</span>
                    {indiceJob?.estado === "COMPLETADO" || indiceJob?.estado === "CANCELADO"
                      ? ` · ${fmtTs(indiceJob.finalizadoEn)}`
                      : ""}
                  </>
                ) : undefined
              }
              error={indiceJob?.estado === "FALLIDO" ? indiceJob.error : null}
              primaryAction={
                <Button
                  onClick={handleConstruirIndices}
                  loading={lanzandoIdx}
                  disabled={lanzandoIdx || idxEnCurso}
                  icon={<ListTree className="h-4 w-4" />}
                  className="flex-1"
                >
                  Construir índices
                </Button>
              }
              secondaryAction={
                <Button
                  variant="secondary"
                  onClick={handleCancelarIndices}
                  loading={cancelandoIdx}
                  disabled={!idxEnCurso || cancelandoIdx}
                  icon={<PauseCircle className="h-4 w-4" />}
                  className="flex-1"
                >
                  Pausar
                </Button>
              }
            />
          </div>
        </Card>
      </div>

      {(totalCats > 0 || totalIdx > 0) && (
        <Card>
          <button
            className="flex w-full items-center justify-between text-left"
            onClick={() => setCoberturaAbierta((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-foreground-muted" />
              <span className="text-sm font-semibold text-foreground">Detalle de tablas</span>
            </div>
            {coberturaAbierta ? (
              <ChevronDown className="h-4 w-4 text-foreground-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 text-foreground-muted" />
            )}
          </button>

          <AnimatePresence>
            {coberturaAbierta && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {conteoCats && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">Catálogos (cat_*)</p>
                    <ConteoGrid
                      items={[
                        { label: "Finalidades", val: conteoCats.finalidades },
                        { label: "Instrumentos", val: conteoCats.instrumentos },
                        { label: "Beneficiarios", val: conteoCats.beneficiarios },
                        { label: "Actividades", val: conteoCats.actividades },
                        { label: "Reglamentos", val: conteoCats.reglamentos },
                        { label: "Objetivos", val: conteoCats.objetivos },
                        { label: "Sectores", val: conteoCats.sectores },
                        { label: "Órganos", val: conteoCats.organos },
                      ]}
                    />
                  </div>
                )}
                {conteoIdx && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">Índices (idx_*)</p>
                    <ConteoGrid
                      items={[
                        { label: "Finalidades", val: conteoIdx.finalidades },
                        { label: "Instrumentos", val: conteoIdx.instrumentos },
                        { label: "Beneficiarios", val: conteoIdx.beneficiarios },
                        { label: "Órganos", val: conteoIdx.organos },
                        { label: "Tipos admin.", val: conteoIdx.tiposAdmin },
                      ]}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-foreground-muted" />
          <h2 className="font-semibold text-foreground">Cobertura de datos</h2>
        </div>
        {!cobertura || cobertura.totalConvocatorias === 0 ? (
          <p className="text-sm text-foreground-muted">Sin datos aún.</p>
        ) : (
          <div className="space-y-3">
            <p className="mb-2 text-xs text-foreground-muted">
              Total: <span className="font-semibold text-foreground">{fmtNum(cobertura.totalConvocatorias)}</span> convocatorias
            </p>
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {cobertura.campos.map((c) => (
                <BarraCobertura key={c.campo} {...c} />
              ))}
            </div>
          </div>
        )}
      </Card>

      {!enCurso && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <SkipForward className="h-5 w-5 text-foreground-muted" />
            <h2 className="font-semibold text-foreground">Saltar a página</h2>
          </div>
          <p className="mb-3 text-xs text-foreground-muted">
            Establece el punto de reanudación directamente. La siguiente importación INCREMENTAL empezará desde la página siguiente.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={paginaSalto}
              onChange={(e) => setPaginaSalto(e.target.value)}
              placeholder="ej. 9999"
              className="w-36 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button
              variant="secondary"
              onClick={handleEstablecerPagina}
              loading={estableciendo}
              disabled={estableciendo || paginaSalto === ""}
              icon={<SkipForward className="h-4 w-4" />}
            >
              Establecer
            </Button>
            {saltadoOk && (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle className="h-3.5 w-3.5" /> Guardado
              </span>
            )}
          </div>
        </Card>
      )}

      <Card>
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setHistorialAbierto((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-foreground-muted" />
            <h2 className="font-semibold text-foreground">Historial de ejecuciones</h2>
            {historial.length > 0 && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-foreground-muted">{historial.length}</span>
            )}
          </div>
          {historialAbierto ? (
            <ChevronDown className="h-4 w-4 text-foreground-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-foreground-muted" />
          )}
        </button>

        {historialAbierto && (
          <div className="mt-4">
            {historial.length === 0 ? (
              <p className="py-4 text-center text-sm text-foreground-muted">Sin ejecuciones registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3 text-left text-xs font-medium text-foreground-muted">Inicio</th>
                      <th className="py-2 pr-3 text-left text-xs font-medium text-foreground-muted">Fin</th>
                      <th className="py-2 pr-3 text-right text-xs font-medium text-foreground-muted">Ejes</th>
                      <th className="py-2 pr-3 text-right text-xs font-medium text-foreground-muted">Páginas</th>
                      <th className="py-2 pr-3 text-right text-xs font-medium text-foreground-muted">Nuevos</th>
                      <th className="py-2 text-right text-xs font-medium text-foreground-muted">Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h) => (
                      <tr key={h.ejecucionId} className="border-b border-border/50 hover:bg-surface-muted/30">
                        <td className="whitespace-nowrap py-2 pr-3 text-foreground-muted">{fmtTs(h.tsInicio)}</td>
                        <td className="whitespace-nowrap py-2 pr-3 text-foreground-muted">{fmtTs(h.tsFin)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground">{h.ejesProcesados}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground-muted">{fmtNum(h.totalPaginas)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums font-medium text-foreground">
                          {fmtNum(h.totalRegistrosNuevos)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {h.totalErrores > 0 ? (
                            <span className="text-red-500">{fmtNum(h.totalErrores)}</span>
                          ) : (
                            <span className="text-foreground-muted">0</span>
                          )}
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

      <AnimatePresence>
        {confirmando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="mx-4 w-full max-w-md"
            >
              <Card>
                <div className="mb-3 flex items-center gap-3">
                  <Download className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Importar convocatorias BDNS</h2>
                </div>
                <p className="mb-4 text-sm text-foreground-muted">
                  Descarga y sincroniza convocatorias de la API pública. Se ejecuta en segundo plano.
                </p>

                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-foreground-muted">Modo</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { m: "FULL" as const, label: "Actualizar", desc: "Añade lo que falta" },
                      { m: "INCREMENTAL" as const, label: "Reanudar", desc: "Continúa desde donde se interrumpió" },
                    ] as const).map(({ m, label, desc }) => (
                      <button
                        key={m}
                        onClick={() => setModo(m)}
                        className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          modo === m
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-foreground-muted hover:border-foreground-muted"
                        }`}
                      >
                        <p className="text-sm font-medium">{label}</p>
                        <p className="mt-0.5 text-xs opacity-70">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTurbo((v) => !v)}
                  className={`mb-5 flex w-full items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                    turbo
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border text-foreground-muted hover:border-foreground-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${turbo ? "text-amber-500" : "text-foreground-muted"}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium">Modo turbo</p>
                      <p className="mt-0.5 text-xs opacity-70">Sin espera entre páginas</p>
                    </div>
                  </div>
                  <div className={`h-5 w-9 rounded-full transition-colors ${turbo ? "bg-amber-500" : "bg-surface-muted"}`}>
                    <div
                      className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        turbo ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>

                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setConfirmando(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmar} icon={turbo ? <Zap className="h-4 w-4" /> : undefined}>
                    {turbo ? "Confirmar en turbo" : "Confirmar"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
