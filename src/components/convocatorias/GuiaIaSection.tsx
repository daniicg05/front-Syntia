'use client';

import { useState } from 'react';
import type { ConvocatoriaDetalle } from '@/types/bdns';

export function GuiaIaSection({ detalle }: { detalle: ConvocatoriaDetalle }) {
  const [open, setOpen] = useState(false);
  if (!detalle.guia && !detalle.puntuacion) return null;

  const colorScore =
    (detalle.puntuacion ?? 0) >= 70
      ? 'text-green-600 dark:text-green-400'
      : (detalle.puntuacion ?? 0) >= 40
        ? 'text-orange-500 dark:text-orange-400'
        : 'text-gray-400';

  return (
    <section
      className="rounded-xl border border-teal-200 bg-teal-50/50 p-4
                        dark:bg-teal-900/10 dark:border-teal-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg" aria-hidden="true">
            AI
          </span>
          <div>
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Analisis Syntia</p>
            {detalle.puntuacion != null && (
              <p className={`text-xs font-bold ${colorScore}`}>Puntuacion: {detalle.puntuacion}/100</p>
            )}
          </div>
        </div>
        {detalle.explicacion && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            {open ? 'Ocultar razonamiento' : 'Ver razonamiento'}
          </button>
        )}
      </div>

      {open && detalle.explicacion && (
        <p
          className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed
                      border-t border-teal-200 dark:border-teal-700 pt-3"
        >
          {detalle.explicacion}
        </p>
      )}

      {detalle.guia && (
        <div className="mt-3 border-t border-teal-200 dark:border-teal-700 pt-3">
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-2 uppercase tracking-wide">
            Guia de presentacion
          </p>
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {detalle.guia}
          </div>
        </div>
      )}

      {detalle.fechaAnalisis && (
        <p className="mt-2 text-xs text-gray-400">
          Analizado: {new Date(detalle.fechaAnalisis).toLocaleDateString('es-ES')}
        </p>
      )}
    </section>
  );
}

