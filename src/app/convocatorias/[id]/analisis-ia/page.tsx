"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DocumentoDTO {
    fechaRegistro: string | null;
    fechaPublicacion: string | null;
    nombre: string | null;
    urlDescarga: string | null;
}

interface ExtractoDTO {
    diarioOficial: string | null;
    fechaPublicacion: string | null;
    tituloAnuncio: string | null;
    tituloCooficial: string | null;
    url: string | null;
}

interface ConvocatoriaAnalisisIA {
    // Bloque 1 — Identificación
    idBdns: number | null;
    numeroConvocatoria: string | null;
    titulo: string | null;
    tituloCooficial: string | null;
    // Bloque 2 — Órgano
    organoConvocante: string | null;
    tipoAdministracion: string | null;
    sedeElectronica: string | null;
    // Bloque 3 — Económicos
    presupuestoTotal: number | null;
    instrumento: string | null;
    tipoConvocatoria: string | null;
    fechaRegistro: string | null;
    // Bloque 4 — Ámbito
    tipoBeneficiario: string | null;
    sectorEconomico: string | null;
    regionImpacto: string | null;
    finalidad: string | null;
    mecanismoRecuperacion: boolean | null;
    // Bloque 5 — Solicitud
    extractoEnDiarioOficial: boolean | null;
    solicitudIndefinida: boolean | null;
    fechaInicioSolicitud: string | null;
    fechaFinSolicitud: string | null;
    // Bloque 6 — Ayudas de Estado
    reglamentoUE: string | null;
    saNumber: string | null;
    saNumberEnlaceUE: string | null;
    cofinanciadoFondosUE: boolean | null;
    sectorProductos: string | null;
    objetivos: string | null;
    // Bloque 7 — Bases reguladoras
    basesReguladoras: string | null;
    urlBasesReguladoras: string | null;
    // Bloque 8-9
    documentos: DocumentoDTO[];
    extractos: ExtractoDTO[];
    urlOficial: string | null;
    // Bloque 10 — IA
    puntuacionCompatibilidad: number | null;
    resumenEjecutivo: string | null;
    descripcionObjetivo: string | null;
    requisitosElegibilidad: string | null;
    cuantiaDetalle: string | null;
    plazoPresentacion: string | null;
    formaPresentacion: string | null;
    documentacionRequerida: string | null;
    procedimientoResolucion: string | null;
    criteriosValoracion: string | null;
    obligacionesBeneficiario: string | null;
    incompatibilidades: string | null;
    contactoGestion: string | null;
    advertenciasClave: string | null;
    sectorInferido: string | null;
}

type FaseSSE = "idle" | "conectando" | "detalle" | "analisis" | "completado" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const val = (v: string | null | undefined) => v && v.trim() ? v : "No disponible";
const boolSI = (v: boolean | null | undefined) => v === true ? "SÍ" : v === false ? "NO" : "—";
const euros = (v: number | null | undefined) =>
    v != null ? v.toLocaleString("es-ES", { style: "currency", currency: "EUR" }) : "No disponible";

function ScoreBadge({ score }: { score: number | null }) {
    if (score == null) return null;
    const color = score >= 70 ? "bg-teal-100 text-teal-800" : score >= 40 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
      ✦ {score}/100
    </span>
    );
}

function Campo({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
        </div>
    );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{titulo}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
        </div>
    );
}

function BloqueIA({ titulo, icon, children }: { titulo: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-3">
                <span>{icon}</span>{titulo}
            </h2>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>
        </div>
    );
}

function SkeletonBloque() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm animate-pulse">
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i}>
                        <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        <div className="h-3 w-full bg-gray-100 dark:bg-gray-600 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Page principal ───────────────────────────────────────────────────────────

export default function AnalisisIAPage() {
    const params = useParams();
    const router = useRouter();
    const proyectoId = params?.proyectoId as string;
    const convocatoriaId = params?.id as string; // id interno BD (para la URL SSE se usa codigoBdns)

    const [fase, setFase] = useState<FaseSSE>("idle");
    const [estado, setEstado] = useState("Iniciando análisis...");
    const [detalle, setDetalle] = useState<Partial<ConvocatoriaAnalisisIA>>({});
    const [completo, setCompleto] = useState<ConvocatoriaAnalisisIA | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [idBdns, setIdBdns] = useState<number | null>(null);

    const sseRef = useRef<EventSource | null>(null);

    // Leer idBdns desde sessionStorage (lo pasa la page anterior al navegar)
    useEffect(() => {
        const stored = sessionStorage.getItem(`analisis_idBdns_${convocatoriaId}`);
        if (stored) {
            setIdBdns(Number(stored));
        } else {
            setErrorMsg("No se encontró el código BDNS. Vuelve al detalle de la convocatoria.");
            setFase("error");
        }
    }, [convocatoriaId]);

    // Arrancar SSE cuando tengamos el idBdns
    useEffect(() => {
        if (idBdns == null || fase !== "idle") return;
        arrancarSSE(idBdns);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idBdns]);

    function arrancarSSE(bdnsId: number) {
        const token = localStorage.getItem("token");
        if (!token) { router.push("/login"); return; }

        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
        const url = `${API_URL}/api/usuario/proyectos/${proyectoId}/convocatorias/${bdnsId}/analisis-ia`;

        setFase("conectando");
        setEstado("Conectando con el servidor...");

        // SSE con Authorization header vía fetch + ReadableStream (igual patrón que el stream de recomendaciones)
        const controller = new AbortController();

        fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
        }).then(async (res) => {
            if (!res.ok || !res.body) {
                setErrorMsg("Error al conectar con el servidor de análisis.");
                setFase("error");
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            setFase("detalle");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (line.startsWith("event:")) {
                        // el nombre del evento viene en la línea siguiente con "data:"
                    } else if (line.startsWith("data:")) {
                        // Necesitamos el evento anterior — usamos parser completo
                    }
                }

                // Parser SSE completo por bloques event+data
                const bloques = (decoder.decode(value, { stream: true }) + buffer).split("\n\n");
                for (const bloque of bloques) {
                    procesarBloque(bloque);
                }
            }
        }).catch((e) => {
            if (e.name !== "AbortError") {
                setErrorMsg("Se perdió la conexión con el servidor.");
                setFase("error");
            }
        });

        sseRef.current = { close: () => controller.abort() } as unknown as EventSource;
    }

    function procesarBloque(bloque: string) {
        const lines = bloque.split("\n");
        let evento = "";
        let data = "";
        for (const line of lines) {
            if (line.startsWith("event:")) evento = line.replace("event:", "").trim();
            if (line.startsWith("data:")) data = line.replace("data:", "").trim();
        }
        if (!evento || !data) return;

        try {
            switch (evento) {
                case "estado":
                    setEstado(data.replace(/^"|"$/g, ""));
                    break;
                case "detalle":
                    setDetalle(JSON.parse(data));
                    setFase("detalle");
                    break;
                case "analisis":
                    setFase("analisis");
                    break;
                case "completado":
                    setCompleto(JSON.parse(data));
                    setFase("completado");
                    break;
                case "error":
                    setErrorMsg(data.replace(/^"|"$/g, ""));
                    setFase("error");
                    break;
            }
        } catch {
            // línea parcial, ignorar
        }
    }

    useEffect(() => {
        return () => { sseRef.current?.close(); };
    }, []);

    // ─── Render ───────────────────────────────────────────────────────────────

    const d = completo ?? detalle;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href={`/mis-proyectos/${proyectoId}/convocatoria/${convocatoriaId}`}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                        >
                            ← Volver
                        </Link>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Análisis IA · BDNS {idBdns}</p>
                            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                {d.titulo ?? "Cargando convocatoria..."}
                            </h1>
                        </div>
                    </div>
                    {completo?.puntuacionCompatibilidad != null && (
                        <ScoreBadge score={completo.puntuacionCompatibilidad} />
                    )}
                </div>
            </div>

            {/* Barra de progreso SSE */}
            {fase !== "completado" && fase !== "error" && (
                <div className="max-w-5xl mx-auto px-4 pt-5">
                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">{estado}</p>
                    </div>
                </div>
            )}

            {/* Error */}
            {fase === "error" && (
                <div className="max-w-5xl mx-auto px-4 pt-5">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-5 text-center">
                        <p className="text-red-700 dark:text-red-300 font-medium mb-3">{errorMsg ?? "Error desconocido"}</p>
                        <Link
                            href={`/mis-proyectos/${proyectoId}/convocatoria/${convocatoriaId}`}
                            className="text-sm text-teal-600 hover:underline"
                        >
                            ← Volver al detalle
                        </Link>
                    </div>
                </div>
            )}

            {/* Contenido principal */}
            <div className="max-w-5xl mx-auto px-4 pt-6 space-y-4">

                {/* ── Bloque 1-2: Identificación + Órgano ── */}
                {(fase === "detalle" || fase === "analisis" || fase === "completado") ? (
                    <Bloque titulo="Información de la convocatoria">
                        <Campo label="Código BDNS" value={val(String(d.idBdns ?? ""))} />
                        <Campo label="Nº Convocatoria" value={val(d.numeroConvocatoria)} />
                        <Campo label="Fecha de registro" value={val(d.fechaRegistro)} />
                        <Campo label="Tipo de convocatoria" value={val(d.tipoConvocatoria)} />
                        <Campo label="Órgano convocante" value={val(d.organoConvocante)} />
                        <Campo label="Tipo administración" value={val(d.tipoAdministracion)} />
                        <Campo label="Presupuesto total" value={euros(d.presupuestoTotal)} />
                        <Campo label="Instrumento de ayuda" value={val(d.instrumento)} />
                    </Bloque>
                ) : <SkeletonBloque />}

                {/* ── Bloque 3: Ámbito y beneficiarios ── */}
                {(fase === "detalle" || fase === "analisis" || fase === "completado") ? (
                    <Bloque titulo="Ámbito y beneficiarios">
                        <Campo label="Tipo de beneficiario" value={val(d.tipoBeneficiario)} />
                        <Campo label="Sector económico" value={val(d.sectorEconomico)} />
                        <Campo label="Región de impacto" value={val(d.regionImpacto)} />
                        <Campo label="Finalidad (política de gasto)" value={val(d.finalidad)} />
                        <Campo label="Mecanismo de recuperación" value={boolSI(d.mecanismoRecuperacion)} />
                        <Campo label="Título cooficial" value={val(d.tituloCooficial)} />
                    </Bloque>
                ) : <SkeletonBloque />}

                {/* ── Bloque 4: Solicitud ── */}
                {(fase === "detalle" || fase === "analisis" || fase === "completado") ? (
                    <Bloque titulo="Información sobre la solicitud">
                        <Campo label="Extracto en diario oficial" value={boolSI(d.extractoEnDiarioOficial)} />
                        <Campo label="Solicitud indefinida" value={boolSI(d.solicitudIndefinida)} />
                        <Campo label="Inicio del periodo de solicitud" value={val(d.fechaInicioSolicitud)} />
                        <Campo label="Fin del periodo de solicitud" value={val(d.fechaFinSolicitud)} />
                    </Bloque>
                ) : <SkeletonBloque />}

                {/* ── Bloque 5: Ayudas de Estado ── */}
                {(fase === "detalle" || fase === "analisis" || fase === "completado") ? (
                    <Bloque titulo="Ayudas de Estado y de minimis">
                        <Campo label="Reglamento (UE)" value={val(d.reglamentoUE)} />
                        <Campo label="SA Number" value={val(d.saNumber)} />
                        <Campo label="SA Number (Enlace UE)" value={val(d.saNumberEnlaceUE)} />
                        <Campo label="Cofinanciado con fondos UE" value={boolSI(d.cofinanciadoFondosUE)} />
                        <Campo label="Sector de productos" value={val(d.sectorProductos)} />
                        <div className="sm:col-span-2">
                            <Campo label="Objetivos" value={val(d.objetivos)} />
                        </div>
                    </Bloque>
                ) : <SkeletonBloque />}

                {/* ── Bloque 6: Bases reguladoras ── */}
                {(fase === "detalle" || fase === "analisis" || fase === "completado") && (d.basesReguladoras || d.urlBasesReguladoras) ? (
                    <Bloque titulo="Bases reguladoras">
                        <div className="sm:col-span-2">
                            <Campo label="Título de las bases" value={val(d.basesReguladoras)} />
                        </div>
                        {d.urlBasesReguladoras && (
                            <div className="sm:col-span-2">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Dirección electrónica</p>
                                <a
                                    href={d.urlBasesReguladoras}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-teal-600 hover:underline break-all"
                                >
                                    {d.urlBasesReguladoras}
                                </a>
                            </div>
                        )}
                    </Bloque>
                ) : null}

                {/* ── Bloque 7: Documentos ── */}
                {(fase === "detalle" || fase === "analisis" || fase === "completado") && completo?.documentos?.length ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Documentos de la convocatoria
                        </h2>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {completo.documentos.map((doc, i) => (
                                <div key={i} className="py-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{doc.nombre ?? "Documento"}</p>
                                        <p className="text-xs text-gray-400">{doc.fechaPublicacion ?? doc.fechaRegistro ?? ""}</p>
                                    </div>
                                    {doc.urlDescarga && (
                                        <a
                                            href={doc.urlDescarga}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-lg px-3 py-1.5 hover:bg-teal-100 transition-colors flex-shrink-0"
                                        >
                                            ↓ Descargar
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* ── Bloque 8: Extractos ── */}
                {completo?.extractos?.length ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Extractos de la convocatoria
                        </h2>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {completo.extractos.map((ext, i) => (
                                <div key={i} className="py-3">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ext.tituloAnuncio ?? "Extracto"}</p>
                                    <p className="text-xs text-gray-400 mb-1">{ext.diarioOficial} · {ext.fechaPublicacion}</p>
                                    {ext.url && (
                                        <a href={ext.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">
                                            Ver publicación oficial ↗
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* ── ANÁLISIS IA — aparece en fase analisis/completado ── */}
                {(fase === "analisis" || fase === "completado") && (
                    <>
                        <div className="flex items-center gap-3 pt-2">
                            <div className="h-px flex-1 bg-teal-200 dark:bg-teal-800" />
                            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                ✦ Análisis generado por IA
              </span>
                            <div className="h-px flex-1 bg-teal-200 dark:bg-teal-800" />
                        </div>

                        {completo ? (
                            <>
                                {completo.resumenEjecutivo && (
                                    <BloqueIA titulo="Resumen ejecutivo" icon="📋">
                                        <p>{completo.resumenEjecutivo}</p>
                                    </BloqueIA>
                                )}
                                {completo.descripcionObjetivo && (
                                    <BloqueIA titulo="Objeto de la convocatoria" icon="🎯">
                                        <p>{completo.descripcionObjetivo}</p>
                                    </BloqueIA>
                                )}
                                {completo.requisitosElegibilidad && (
                                    <BloqueIA titulo="Requisitos de elegibilidad" icon="✅">
                                        <p>{completo.requisitosElegibilidad}</p>
                                    </BloqueIA>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {completo.cuantiaDetalle && (
                                        <BloqueIA titulo="Cuantía de la ayuda" icon="💶">
                                            <p>{completo.cuantiaDetalle}</p>
                                        </BloqueIA>
                                    )}
                                    {completo.plazoPresentacion && (
                                        <BloqueIA titulo="Plazo de presentación" icon="📅">
                                            <p>{completo.plazoPresentacion}</p>
                                        </BloqueIA>
                                    )}
                                    {completo.formaPresentacion && (
                                        <BloqueIA titulo="Forma de presentación" icon="📨">
                                            <p>{completo.formaPresentacion}</p>
                                        </BloqueIA>
                                    )}
                                    {completo.contactoGestion && (
                                        <BloqueIA titulo="Contacto y gestión" icon="📞">
                                            <p>{completo.contactoGestion}</p>
                                        </BloqueIA>
                                    )}
                                </div>
                                {completo.documentacionRequerida && (
                                    <BloqueIA titulo="Documentación requerida" icon="📁">
                                        <p>{completo.documentacionRequerida}</p>
                                    </BloqueIA>
                                )}
                                {completo.criteriosValoracion && (
                                    <BloqueIA titulo="Criterios de valoración" icon="⚖️">
                                        <p>{completo.criteriosValoracion}</p>
                                    </BloqueIA>
                                )}
                                {completo.procedimientoResolucion && (
                                    <BloqueIA titulo="Procedimiento de resolución" icon="🔄">
                                        <p>{completo.procedimientoResolucion}</p>
                                    </BloqueIA>
                                )}
                                {completo.obligacionesBeneficiario && (
                                    <BloqueIA titulo="Obligaciones del beneficiario" icon="📌">
                                        <p>{completo.obligacionesBeneficiario}</p>
                                    </BloqueIA>
                                )}
                                {completo.incompatibilidades && (
                                    <BloqueIA titulo="Incompatibilidades" icon="🚫">
                                        <p>{completo.incompatibilidades}</p>
                                    </BloqueIA>
                                )}
                                {completo.advertenciasClave && (
                                    <BloqueIA titulo="Advertencias clave" icon="⚠️">
                                        <p className="text-amber-700 dark:text-amber-300">{completo.advertenciasClave}</p>
                                    </BloqueIA>
                                )}

                                {/* Enlace oficial */}
                                {completo.urlOficial && (
                                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl p-4 flex items-center justify-between gap-4">
                                        <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">Ver convocatoria en infosubvenciones.es</p>
                                        <a
                                            href={completo.urlOficial}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            Abrir ↗
                                        </a>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Fase analisis — esqueleto IA
                            <>
                                <SkeletonBloque />
                                <SkeletonBloque />
                                <SkeletonBloque />
                            </>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}