"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  RefreshCw, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronRight, PauseCircle, Zap, SkipForward,
  Database, ListTree, Download,
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

interface CampoCobertura { campo: string; conValor: number; porcentaje: number; }
interface CoberturaDTO { totalConvocatorias: number; campos: CampoCobertura[]; }

interface ConteoCatalogos {
  finalidades: number; instrumentos: number; beneficiarios: number;
  actividades: number; reglamentos: number; objetivos: number;
  sectores: number; organos: number;
}
interface ConteoIndices {
  finalidades: number; instrumentos: number; beneficiarios: number;
  organos: number; tiposAdmin: number;
}
interface IndiceJobEstado {
  estado: EstadoImportacion;
  fase: string | null;
  totalRegistros: number;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  error: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePaginas(s: string | null) {
  if (!s) return null;
  const m = s.match(/pág\. (\d+)\/(\d+)/);
  if (m) return { current: parseInt(m[1]), total: parseInt(m[2]) };
  const m2 = s.match(/pág\. (\d+)/);
  if (m2) return { current: parseInt(m2[1]), total: 0 };
  return null;
}

function fmtTs(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

const fmtNum = (n: number) => n.toLocaleString("es-ES");

// ── Componentes ──────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoImportacion }) {
  if (estado === "INACTIVO") return null;
  const cfg = {
    EN_CURSO:   { cls: "bg-primary/10 text-primary border-primary/20",     label: "En curso" },
    COMPLETADO: { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200", label: "Completado" },
    FALLIDO:    { cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Fallido" },
  }[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {estado === "EN_CURSO" && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      {cfg.label}
    </span>
  );
}

function BarraProgreso({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
      <motion.div
        className="bg-primary h-1.5 rounded-full"
        animate={{ width: `${Math.max(pct, 0.5)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function BarraCobertura({ campo, conValor, porcentaje }: CampoCobertura) {
  const labels: Record<string, string> = {
    organismo: "Organismo", fechaPublicacion: "F. publicación",
    descripcion: "Descripción", textoCompleto: "Texto completo",
    sector: "Sector", fechaCierre: "F. cierre", ubicacion: "Ubicación",
  };
  const color = porcentaje >= 80 ? "bg-emerald-500" : porcentaje >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-foreground-muted">{labels[campo] ?? campo}</span>
        <span className="text-xs font-medium text-foreground">
          {porcentaje.toFixed(1)}%{" "}
          <span className="text-foreground-muted font-normal">({fmtNum(conValor)})</span>
        </span>
      </div>
      <div className="w-full bg-surface-muted rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}

function ConteoGrid({ items }: { items: { label: string; val: number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map(({ label, val }) => (
        <div key={label} className="rounded-lg bg-surface-muted px-2.5 py-1.5">
          <p className="text-[11px] text-foreground-muted leading-none mb-0.5">{label}</p>
          <p className={`text-base font-bold tabular-nums ${val > 0 ? "text-foreground" : "text-foreground-muted/50"}`}>
            {fmtNum(val)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BdnsPage() {
  // Convocatorias job
  const [estadoJob, setEstadoJob]       = useState<EstadoJob | null>(null);
  const [historial, setHistorial]       = useState<ResumenEjecucionDTO[]>([]);
  const [cobertura, setCobertura]       = useState<CoberturaDTO | null>(null);
  const [lanzando, setLanzando]         = useState(false);
  const [cancelando, setCancelando]     = useState(false);
  const [confirmando, setConfirmando]   = useState(false);
  const [modo, setModo]                 = useState<ModoImportacion>("FULL");
  const [turbo, setTurbo]               = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Índices job
  const [conteoCats, setConteoCats]     = useState<ConteoCatalogos | null>(null);
  const [conteoIdx, setConteoIdx]       = useState<ConteoIndices | null>(null);
  const [indiceJob, setIndiceJob]       = useState<IndiceJobEstado | null>(null);
  const [lanzandoIdx, setLanzandoIdx]   = useState(false);
  const pollingIdxRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI state
  const [loading, setLoading]               = useState(true);
  const [coberturaAbierta, setCoberturaAbierta] = useState(false);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [paginaSalto, setPaginaSalto]           = useState("");
  const [estableciendo, setEstableciendo]       = useState(false);
  const [saltadoOk, setSaltadoOk]               = useState(false);

  // ── Carga ─────────────────────────────────────────────────────────────────

  const cargarEtl = async () => {
    const [catsRes, idxRes] = await Promise.allSettled([
      adminApi.etl.conteoCatalogos(),
      adminApi.etl.estadoIndices(),
    ]);
    if (catsRes.status === "fulfilled") setConteoCats(catsRes.value.data);
    if (idxRes.status === "fulfilled") {
      setIndiceJob(idxRes.value.data.job);
      setConteoIdx(idxRes.value.data.conteos);
    }
  };

  const cargarTodo = async () => {
    const [estadoRes, historialRes, coberturaRes] = await Promise.allSettled([
      adminApi.bdns.estado(),
      adminApi.bdns.historial(),
      adminApi.bdns.cobertura(),
    ]);
    if (estadoRes.status === "fulfilled")    setEstadoJob(estadoRes.value.data);
    if (historialRes.status === "fulfilled") setHistorial(historialRes.value.data);
    if (coberturaRes.status === "fulfilled") setCobertura(coberturaRes.value.data);
    await cargarEtl();
  };

  useEffect(() => { cargarTodo().finally(() => setLoading(false)); }, []);

  // ── Polling convocatorias ─────────────────────────────────────────────────

  useEffect(() => {
    if (estadoJob?.estado === "EN_CURSO") {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          const [eRes, cRes] = await Promise.allSettled([
            adminApi.bdns.estado(), adminApi.bdns.cobertura(),
          ]);
          if (eRes.status === "fulfilled") setEstadoJob(eRes.value.data);
          if (cRes.status === "fulfilled") setCobertura(cRes.value.data);
          if (eRes.status === "fulfilled" && eRes.value.data.estado !== "EN_CURSO") {
            clearInterval(pollingRef.current!); pollingRef.current = null;
            adminApi.bdns.historial().then(r => setHistorial(r.data));
          }
        }, 5000);
      }
    }
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [estadoJob?.estado]);

  // ── Polling índices ───────────────────────────────────────────────────────

  useEffect(() => {
    if (indiceJob?.estado === "EN_CURSO") {
      if (!pollingIdxRef.current) {
        pollingIdxRef.current = setInterval(async () => {
          const res = await adminApi.etl.estadoIndices().catch(() => null);
          if (res) {
            setIndiceJob(res.data.job);
            setConteoIdx(res.data.conteos);
            if (res.data.job.estado !== "EN_CURSO") {
              clearInterval(pollingIdxRef.current!); pollingIdxRef.current = null;
              adminApi.etl.conteoCatalogos().then(r => setConteoCats(r.data));
            }
          }
        }, 5000);
      }
    }
    return () => { if (pollingIdxRef.current) { clearInterval(pollingIdxRef.current); pollingIdxRef.current = null; } };
  }, [indiceJob?.estado]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleConfirmar = async () => {
    setConfirmando(false); setLanzando(true);
    try {
      await adminApi.bdns.importar(modo, turbo ? 0 : -1);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 409) { setLanzando(false); return; }
    }
    const res = await adminApi.bdns.estado();
    setEstadoJob(res.data); setLanzando(false);
  };

  const handleCancelar = async () => {
    setCancelando(true);
    try { await adminApi.bdns.cancelar(); } catch { /* no-op */ }
    finally { setCancelando(false); }
  };

  const handleConstruirIndices = async () => {
    setLanzandoIdx(true);
    try {
      await adminApi.etl.construirIndices();
      const res = await adminApi.etl.estadoIndices();
      setIndiceJob(res.data.job); setConteoIdx(res.data.conteos);
    } catch { /* 409 si ya en curso */ }
    finally { setLanzandoIdx(false); }
  };

  const handleCancelarIndices = async () => {
    await adminApi.etl.cancelarIndices().catch(() => null);
    const res = await adminApi.etl.estadoIndices().catch(() => null);
    if (res) { setIndiceJob(res.data.job); setConteoIdx(res.data.conteos); }
  };

  const handleEstablecerPagina = async () => {
    const n = parseInt(paginaSalto, 10);
    if (isNaN(n) || n < 0) return;
    setEstableciendo(true);
    try {
      await adminApi.bdns.setSyncStatePagina(n);
      setSaltadoOk(true); setTimeout(() => setSaltadoOk(false), 3000);
    } finally { setEstableciendo(false); }
  };

  // ── Derivados ─────────────────────────────────────────────────────────────

  const enCurso     = estadoJob?.estado === "EN_CURSO";
  const idxEnCurso  = indiceJob?.estado === "EN_CURSO";
  const pagInfo     = parsePaginas(estadoJob?.ejeActual ?? null);
  const progresoPct = pagInfo?.total ? (pagInfo.current / pagInfo.total * 100) : 0;

  const totalCats = conteoCats
    ? conteoCats.finalidades + conteoCats.instrumentos + conteoCats.beneficiarios +
      conteoCats.actividades + conteoCats.reglamentos + conteoCats.objetivos +
      conteoCats.sectores + conteoCats.organos
    : 0;
  const totalIdx = conteoIdx
    ? conteoIdx.finalidades + conteoIdx.instrumentos + conteoIdx.beneficiarios +
      conteoIdx.organos + conteoIdx.tiposAdmin
    : 0;

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Base de datos BDNS</h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            Las dos operaciones son independientes y pueden ejecutarse a la vez.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={cargarTodo}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refrescar
        </Button>
      </div>

      {/* ── Dos paneles principales ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Panel 1: Convocatorias */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm">Convocatorias BDNS</h2>
                <p className="text-xs text-foreground-muted">~615k registros de la API pública</p>
              </div>
            </div>
            <EstadoBadge estado={estadoJob?.estado ?? "INACTIVO"} />
          </div>

          {/* Progreso inline */}
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
                  <span>pág. {fmtNum(pagInfo.current)}/{fmtNum(pagInfo.total)}</span>
                ) : pagInfo ? (
                  <span>pág. {fmtNum(pagInfo.current)}</span>
                ) : null}
              </div>
              <BarraProgreso pct={progresoPct} />
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">
                  <span className="font-semibold text-foreground">{fmtNum(estadoJob?.registrosImportados ?? 0)}</span> nuevos
                </span>
                <span className="text-foreground-muted">{progresoPct.toFixed(1)}%</span>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Resultado */}
          {estadoJob?.estado === "COMPLETADO" && (
            <p className="text-xs text-foreground-muted mb-3">
              <span className="font-semibold text-emerald-600">{fmtNum(estadoJob.registrosImportados)}</span> importados · {fmtTs(estadoJob.finalizadoEn)}
            </p>
          )}
          {estadoJob?.estado === "FALLIDO" && (
            <p className="text-xs text-destructive mb-3">{estadoJob.error}</p>
          )}

          {/* Stats rápidas */}
          {cobertura && cobertura.totalConvocatorias > 0 && (
            <p className="text-xs text-foreground-muted mb-3">
              <span className="font-semibold text-foreground">{fmtNum(cobertura.totalConvocatorias)}</span> convocatorias en BD
            </p>
          )}

          {/* Botón */}
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

        {/* Panel 2: Catálogos e Índices */}
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <ListTree className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm">Catálogos e Índices</h2>
                <p className="text-xs text-foreground-muted">Tablas de referencia + asociaciones</p>
              </div>
            </div>
            <EstadoBadge estado={indiceJob?.estado ?? "INACTIVO"} />
          </div>

          {/* Progreso inline */}
          <AnimatePresence>
          {idxEnCurso && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 space-y-2"
            >
              <p className="text-xs text-foreground-muted">{indiceJob?.fase ?? "Procesando..."}</p>
              <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 rounded-full bg-violet-500 animate-pulse" style={{ width: "100%" }} />
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Resultado */}
          {indiceJob?.estado === "COMPLETADO" && (
            <p className="text-xs text-foreground-muted mb-3">
              <span className="font-semibold text-emerald-600">{fmtNum(indiceJob.totalRegistros)}</span> índices · {fmtTs(indiceJob.finalizadoEn)}
            </p>
          )}
          {indiceJob?.estado === "FALLIDO" && (
            <p className="text-xs text-destructive mb-3">{indiceJob.error}</p>
          )}

          {/* Stats rápidas */}
          {(totalCats > 0 || totalIdx > 0) && (
            <div className="flex gap-3 mb-3 text-xs text-foreground-muted">
              <span>
                Catálogos: <span className="font-semibold text-foreground">{fmtNum(totalCats)}</span>
              </span>
              <span>·</span>
              <span>
                Índices: <span className="font-semibold text-foreground">{fmtNum(totalIdx)}</span>
              </span>
            </div>
          )}

          {/* Botón */}
          <div className="flex gap-2">
            {idxEnCurso ? (
              <Button
                variant="secondary"
                onClick={handleCancelarIndices}
                icon={<PauseCircle className="h-4 w-4" />}
                className="flex-1"
              >
                Pausar
              </Button>
            ) : (
              <Button
                onClick={handleConstruirIndices}
                loading={lanzandoIdx}
                disabled={lanzandoIdx}
                icon={<ListTree className="h-4 w-4" />}
                className="flex-1"
              >
                Construir catálogos e índices
              </Button>
            )}
          </div>

          <p className="text-[11px] text-foreground-muted mt-2">
            Incluye catálogos automáticamente. Operación larga — corre en segundo plano.
          </p>
        </Card>
      </div>

      {/* ── Detalle catálogos e índices (expandible) ─────────────────────────── */}
      {(totalCats > 0 || totalIdx > 0) && (
        <Card>
          <button
            className="w-full flex items-center justify-between text-left"
            onClick={() => setCoberturaAbierta(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-foreground-muted" />
              <span className="text-sm font-semibold text-foreground">Detalle de tablas</span>
            </div>
            {coberturaAbierta
              ? <ChevronDown className="h-4 w-4 text-foreground-muted" />
              : <ChevronRight className="h-4 w-4 text-foreground-muted" />
            }
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
                  <p className="text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wide">Catálogos (cat_*)</p>
                  <ConteoGrid items={[
                    { label: "Finalidades",  val: conteoCats.finalidades },
                    { label: "Instrumentos", val: conteoCats.instrumentos },
                    { label: "Beneficiarios", val: conteoCats.beneficiarios },
                    { label: "Actividades",  val: conteoCats.actividades },
                    { label: "Reglamentos",  val: conteoCats.reglamentos },
                    { label: "Objetivos",    val: conteoCats.objetivos },
                    { label: "Sectores",     val: conteoCats.sectores },
                    { label: "Órganos",      val: conteoCats.organos },
                  ]} />
                </div>
              )}
              {conteoIdx && (
                <div>
                  <p className="text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wide">Índices (idx_*)</p>
                  <ConteoGrid items={[
                    { label: "Finalidades",   val: conteoIdx.finalidades },
                    { label: "Instrumentos",  val: conteoIdx.instrumentos },
                    { label: "Beneficiarios", val: conteoIdx.beneficiarios },
                    { label: "Órganos",       val: conteoIdx.organos },
                    { label: "Tipos admin.",  val: conteoIdx.tiposAdmin },
                  ]} />
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </Card>
      )}

      {/* ── Cobertura de datos ──────────────────────────────────────────────── */}
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
              {cobertura.campos.map(c => <BarraCobertura key={c.campo} {...c} />)}
            </div>
          </div>
        )}
      </Card>

      {/* ── Saltar a página ─────────────────────────────────────────────────── */}
      {!enCurso && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <SkipForward className="h-5 w-5 text-foreground-muted" />
            <h2 className="font-semibold text-foreground">Saltar a página</h2>
          </div>
          <p className="text-xs text-foreground-muted mb-3">
            Establece el punto de reanudación directamente. La siguiente importación INCREMENTAL empezará desde la página siguiente.
          </p>
          <div className="flex gap-2 items-center">
            <input
              type="number" min={0} value={paginaSalto}
              onChange={e => setPaginaSalto(e.target.value)}
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

      {/* ── Historial de ejecuciones ─────────────────────────────────────────── */}
      <Card>
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setHistorialAbierto(v => !v)}
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
                    {historial.map(h => (
                      <tr key={h.ejecucionId} className="border-b border-border/50 hover:bg-surface-muted/30">
                        <td className="py-2 pr-3 text-foreground-muted whitespace-nowrap">{fmtTs(h.tsInicio)}</td>
                        <td className="py-2 pr-3 text-foreground-muted whitespace-nowrap">{fmtTs(h.tsFin)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground">{h.ejesProcesados}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-foreground-muted">{fmtNum(h.totalPaginas)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums font-medium text-foreground">{fmtNum(h.totalRegistrosNuevos)}</td>
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
      <AnimatePresence>
      {confirmando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="max-w-md w-full mx-4"
          >
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <Download className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Importar convocatorias BDNS</h2>
            </div>
            <p className="text-sm text-foreground-muted mb-4">
              Descarga y sincroniza convocatorias de la API pública. Se ejecuta en segundo plano.
            </p>

            <div className="mb-4">
              <p className="text-xs font-medium text-foreground-muted mb-2">Modo</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { m: "FULL" as const,        label: "Actualizar",  desc: "Añade lo que falta" },
                  { m: "INCREMENTAL" as const, label: "Reanudar",    desc: "Continúa desde donde se interrumpió" },
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
                    <p className="text-xs mt-0.5 opacity-70">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTurbo(v => !v)}
              className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 mb-5 transition-colors ${
                turbo
                  ? "border-amber-500 bg-amber-500/10 text-amber-500"
                  : "border-border text-foreground-muted hover:border-foreground-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${turbo ? "text-amber-500" : "text-foreground-muted"}`} />
                <div className="text-left">
                  <p className="text-sm font-medium">Modo turbo</p>
                  <p className="text-xs mt-0.5 opacity-70">Sin espera entre páginas</p>
                </div>
              </div>
              <div className={`w-9 h-5 rounded-full transition-colors ${turbo ? "bg-amber-500" : "bg-surface-muted"}`}>
                <div className={`w-4 h-4 bg-white rounded-full mt-0.5 shadow transition-transform ${turbo ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setConfirmando(false)}>Cancelar</Button>
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
