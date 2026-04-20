'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    convocatoriasPublicasApi,
    type ConvocatoriaDetalle,
} from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(fecha?: string): string {
    if (!fecha) return '';
    try {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return fecha;
    }
}

function formatImporte(p?: number): string | null {
    if (p == null || p === 0) return null;
    return `${new Intl.NumberFormat('es-ES').format(Math.round(p))} €`;
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function Seccion({ titulo, contenido }: { titulo: string; contenido?: string | null }) {
    if (!contenido) return null;
    return (
        <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
                {titulo}
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {contenido}
            </p>
        </section>
    );
}

function Campo({ label, value }: { label: string; value?: string | number | null }) {
    if (value == null || value === '') return null;
    return (
        <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1 break-words">
                {value}
            </p>
        </div>
    );
}

function ListaBadges({ titulo, items }: { titulo: string; items?: string[] }) {
    if (!items || items.length === 0) return null;
    return (
        <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {titulo}
            </h2>
            <div className="flex flex-wrap gap-2">
                {items.map((it, i) => (
                    <span
                        key={i}
                        className="text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1"
                    >
            {it}
          </span>
                ))}
            </div>
        </section>
    );
}

function Skeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2 pt-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded" />
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                </div>
            ))}
        </div>
    );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function DetalleConvocatoriaPage() {
    const params = useParams();
    const router = useRouter();

    const numeroConvocatoria = useMemo(() => {
        const raw = params?.id;
        if (Array.isArray(raw)) return decodeURIComponent(raw[0] ?? '');
        return decodeURIComponent((raw as string) ?? '');
    }, [params]);

    const [detalle, setDetalle] = useState<ConvocatoriaDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!numeroConvocatoria) return;
        let cancelado = false;
        convocatoriasPublicasApi
            .detalle(numeroConvocatoria)
            .then((res) => {
                if (!cancelado) setDetalle(res.data);
            })
            .catch((e: Error) => {
                if (!cancelado) setError(e.message);
            })
            .finally(() => {
                if (!cancelado) setLoading(false);
            });
        return () => {
            cancelado = true;
        };
    }, [numeroConvocatoria]);

    const organo = detalle
        ? [detalle.nivel1, detalle.nivel2, detalle.nivel3].filter(Boolean).join(' › ')
        : '';

    const presupuestoFmt = formatImporte(detalle?.presupuestoTotal);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
                >
                    ← Volver a resultados
                </button>

                {loading && <Skeleton />}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                        No se pudo cargar la convocatoria. {error}
                    </div>
                )}

                {detalle && (
                    <article className="space-y-6">
                        {/* Cabecera */}
                        <header className="space-y-3">
                            <div className="flex flex-wrap items-start gap-2">
                                {detalle.tipo && (
                                    <span className="text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-0.5">
                    {detalle.tipo}
                  </span>
                                )}
                                {detalle.tipoConvocatoria && detalle.tipoConvocatoria !== detalle.tipo && (
                                    <span className="text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 px-2.5 py-0.5">
                    {detalle.tipoConvocatoria}
                  </span>
                                )}
                                {detalle.mrr && (
                                    <span className="text-xs font-medium rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 px-2.5 py-0.5">
                    MRR
                  </span>
                                )}
                                {detalle.sePublicaDiarioOficial && (
                                    <span className="text-xs font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 px-2.5 py-0.5">
                    Diario oficial
                  </span>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                {detalle.titulo ?? 'Convocatoria'}
                            </h1>

                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                                {detalle.fuente && <span>{detalle.fuente}</span>}
                                {detalle.ubicacion && <span>{detalle.ubicacion}</span>}
                                {detalle.sector && <span>{detalle.sector}</span>}
                                {detalle.numeroConvocatoria && <span>BDNS: {detalle.numeroConvocatoria}</span>}
                                {detalle.codigoBdns && detalle.codigoBdns !== detalle.numeroConvocatoria && (
                                    <span>Código: {detalle.codigoBdns}</span>
                                )}
                            </div>

                            {organo && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold">Órgano convocante:</span> {organo}
                                </p>
                            )}
                        </header>

                        {/* Panel datos clave */}
                        <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <Campo label="Presupuesto total" value={presupuestoFmt ?? undefined} />
                            <Campo label="Ayuda de Estado" value={detalle.ayudaEstado} />
                            <Campo label="Finalidad" value={detalle.finalidad} />
                            <Campo label="Fecha recepción" value={formatFecha(detalle.fechaRecepcion)} />
                            <Campo label="Inicio solicitud" value={formatFecha(detalle.fechaInicioSolicitud)} />
                            <Campo label="Fin solicitud" value={formatFecha(detalle.fechaFinSolicitud) || formatFecha(detalle.fechaCierre)} />
                        </section>

                        {/* Descripción / contenido */}
                        <div className="space-y-5">
                            <Seccion titulo="Descripción" contenido={detalle.descripcion} />
                            <Seccion titulo="Texto inicio plazo" contenido={detalle.textInicio} />
                            <Seccion titulo="Texto fin plazo" contenido={detalle.textFin} />
                            <Seccion titulo="Bases reguladoras" contenido={detalle.descripcionBasesReguladoras ?? detalle.basesReguladoras} />
                            <Seccion titulo="Reglamento UE" contenido={detalle.reglamentoDescripcion} />
                            <Seccion titulo="Advertencia" contenido={detalle.advertencia} />
                        </div>

                        {/* Listas BDNS */}
                        <ListaBadges titulo="Instrumentos de ayuda" items={detalle.instrumentos} />

                        {detalle.tiposBeneficiarios && detalle.tiposBeneficiarios.length > 0 && (
                            <ListaBadges
                                titulo="Tipos de beneficiario"
                                items={detalle.tiposBeneficiarios.map((b) => b.descripcion ?? '').filter(Boolean)}
                            />
                        )}

                        {detalle.sectores && detalle.sectores.length > 0 && (
                            <ListaBadges
                                titulo="Sectores económicos"
                                items={detalle.sectores.map((s) => s.descripcion ?? '').filter(Boolean)}
                            />
                        )}

                        {detalle.sectoresProductos && detalle.sectoresProductos.length > 0 && (
                            <ListaBadges
                                titulo="Sectores de productos"
                                items={detalle.sectoresProductos.map((s) => s.descripcion ?? '').filter(Boolean)}
                            />
                        )}

                        <ListaBadges titulo="Regiones de impacto" items={detalle.regiones} />
                        <ListaBadges titulo="Fondos UE" items={detalle.fondos} />
                        <ListaBadges titulo="Objetivos" items={detalle.objetivos} />

                        {/* Anuncios */}
                        {detalle.anuncios && detalle.anuncios.length > 0 && (
                            <section>
                                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                    Anuncios / Extractos
                                </h2>
                                <ul className="space-y-2">
                                    {detalle.anuncios.map((a, i) => (
                                        <li
                                            key={i}
                                            className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm"
                                        >
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                {a.titulo ?? `Anuncio ${a.numAnuncio ?? i + 1}`}
                                            </p>
                                            {a.desDiarioOficial && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {a.desDiarioOficial}
                                                    {a.datPublicacion ? ` · ${formatFecha(a.datPublicacion)}` : ''}
                                                </p>
                                            )}
                                            {a.url && (
                                                <a
                                                    href={a.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-teal-600 hover:underline mt-1 inline-block"
                                                >
                                                    Ver anuncio →
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Documentos */}
                        {detalle.documentos && detalle.documentos.length > 0 && (
                            <section>
                                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                    Documentos
                                </h2>
                                <ul className="space-y-2">
                                    {detalle.documentos.map((d, i) => (
                                        <li
                                            key={i}
                                            className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm flex flex-col"
                                        >
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {d.nombreFic ?? `Documento ${d.id ?? i + 1}`}
                      </span>
                                            {d.descripcion && (
                                                <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {d.descripcion}
                        </span>
                                            )}
                                            {d.datPublicacion && (
                                                <span className="text-xs text-gray-500 mt-1">
                          Publicado: {formatFecha(d.datPublicacion)}
                        </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Enlaces oficiales */}
                        <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            {detalle.urlOficial && (
                                <a
                                    href={detalle.urlOficial}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
                                >
                                    Ver convocatoria en BDNS
                                </a>
                            )}
                            {detalle.urlBasesReguladoras && (
                                <a
                                    href={detalle.urlBasesReguladoras}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Bases reguladoras
                                </a>
                            )}
                            {detalle.sedeElectronica && (
                                <a
                                    href={detalle.sedeElectronica}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Sede electrónica
                                </a>
                            )}
                        </div>
                    </article>
                )}
            </div>
        </div>
    );
}