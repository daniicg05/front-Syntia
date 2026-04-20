'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchDetalleConvocatoria } from '@/lib/bdnsApi';
import type { ConvocatoriaDetalle } from '@/types/bdns';
import { GuiaIaSection } from '@/components/convocatorias/GuiaIaSection';
import { PlazoIndicador } from '@/components/convocatorias/PlazoIndicador';

function Seccion({ titulo, contenido }: { titulo: string; contenido: string | null }) {
  if (!contenido) return null;
  return (
    <section>
      <h2
        className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase
                     tracking-wide mb-2 pb-1 border-b border-gray-100 dark:border-gray-800"
      >
        {titulo}
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{contenido}</p>
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

export default function DetalleConvocatoriaPage() {
  const params = useParams();
  const router = useRouter();
  const idBdns = params.id as string;
  const [detalle, setDetalle] = useState<ConvocatoriaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idBdns) return;
    fetchDetalleConvocatoria(idBdns)
      .then(setDetalle)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [idBdns]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700
                     dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          Volver a resultados
        </button>

        {loading && <Skeleton />}

        {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700
                          dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          >
            No se pudo cargar la convocatoria. {error}
          </div>
        )}

        {detalle && (
          <article className="space-y-6">
            <header className="space-y-3">
              <div className="flex flex-wrap items-start gap-2">
                <span
                  className="text-xs font-medium rounded-full bg-gray-100 text-gray-600
                                 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-0.5"
                >
                  {detalle.tipo}
                </span>
                {detalle.instrumento && (
                  <span
                    className="text-xs font-medium rounded-full bg-blue-50 text-blue-700
                                   dark:bg-blue-900/20 dark:text-blue-300 px-2.5 py-0.5"
                  >
                    {detalle.instrumento}
                  </span>
                )}
                {detalle.mrr && (
                  <span
                    className="text-xs font-medium rounded-full bg-purple-50 text-purple-700
                                   dark:bg-purple-900/20 dark:text-purple-300 px-2.5 py-0.5"
                  >
                    MRR
                  </span>
                )}
                <PlazoIndicador fechaCierre={detalle.fechaFinSolicitud ?? detalle.fechaCierre} />
              </div>

              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">{detalle.titulo}</h1>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{detalle.fuente}</span>
                {detalle.ubicacion && <span>{detalle.ubicacion}</span>}
                {detalle.sector && <span>{detalle.sector}</span>}
                {detalle.numeroConvocatoria && <span>BDNS: {detalle.numeroConvocatoria}</span>}
              </div>
            </header>

            <GuiaIaSection detalle={detalle} />

            {(detalle.dotacion || detalle.ayudaEstado || detalle.fechaFinSolicitud) && (
              <section
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4
                                  grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                {detalle.dotacion && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Dotacion</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1">{detalle.dotacion}</p>
                  </div>
                )}
                {detalle.ayudaEstado && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Ayuda de Estado</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1">{detalle.ayudaEstado}</p>
                  </div>
                )}
                {detalle.fechaFinSolicitud && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Fin de solicitud</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1">
                      {new Date(detalle.fechaFinSolicitud).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </section>
            )}

            <div className="space-y-5">
              <Seccion titulo="Objeto de la convocatoria" contenido={detalle.objeto} />
              <Seccion titulo="Beneficiarios" contenido={detalle.beneficiarios} />
              <Seccion titulo="Requisitos" contenido={detalle.requisitos} />
              <Seccion titulo="Documentacion requerida" contenido={detalle.documentacion} />
              <Seccion titulo="Plazo de solicitudes" contenido={detalle.plazoSolicitudes} />
              <Seccion titulo="Procedimiento" contenido={detalle.procedimiento} />
              <Seccion titulo="Bases reguladoras" contenido={detalle.basesReguladoras} />
            </div>

            <div className="flex justify-center pt-4 border-t border-gray-100 dark:border-gray-800">
              <a
                href={detalle.urlOficial}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5
                           text-sm font-medium text-white hover:bg-teal-700 active:bg-teal-800
                           transition-colors shadow-sm"
              >
                Ver convocatoria oficial en BDNS
              </a>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

