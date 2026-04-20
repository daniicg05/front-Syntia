# PROMPT FRONT — Parte 3: Página de Detalle de Convocatoria

## INSTRUCCIONES PARA EL AGENTE
Lee este archivo completo ANTES de escribir una sola línea de código.
No modifiques el layout principal ni el contexto de autenticacion.
En el componente de tarjeta existente SOLO anade el link al detalle, nada mas.
Al finalizar navega a /convocatorias/609545 y reporta si carga correctamente.

## Contexto
- Repo: front-Syntia
- Rama: feature/filtros-bdns-completos
- Prerequisito: FRONT_P1 y FRONT_P2 completados
- Archivos a CREAR:
  src/components/convocatorias/PlazoIndicador.tsx
  src/components/convocatorias/GuiaIaSection.tsx
  src/app/convocatorias/[idBdns]/page.tsx
  src/app/convocatorias/[idBdns]/loading.tsx
- Archivos a MODIFICAR: componente de tarjeta de convocatoria existente (anadir link solamente)

---

## Paso 1 — PlazoIndicador.tsx

```tsx
'use client';

interface Props { fechaCierre: string | null; }

export function PlazoIndicador({ fechaCierre }: Props) {
  if (!fechaCierre) return null;

  const dias = Math.ceil((new Date(fechaCierre).getTime() - Date.now()) / 86400000);

  if (dias < 0) return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5
                     text-xs font-medium text-gray-500 dark:bg-gray-800">
      Cerrada
    </span>
  );

  const color =
    dias <= 7  ? 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
    dias <= 30 ? 'bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:text-green-300';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {dias === 0 ? 'Cierra hoy' : `${dias} dias restantes`}
    </span>
  );
}
```

---

## Paso 2 — GuiaIaSection.tsx

```tsx
'use client';
import { useState } from 'react';
import type { ConvocatoriaDetalle } from '@/types/bdns';

export function GuiaIaSection({ detalle }: { detalle: ConvocatoriaDetalle }) {
  const [open, setOpen] = useState(false);
  if (!detalle.guia && !detalle.puntuacion) return null;

  const colorScore =
    (detalle.puntuacion ?? 0) >= 70 ? 'text-green-600 dark:text-green-400' :
    (detalle.puntuacion ?? 0) >= 40 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400';

  return (
    <section className="rounded-xl border border-teal-200 bg-teal-50/50 p-4
                        dark:bg-teal-900/10 dark:border-teal-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg" aria-hidden="true">AI</span>
          <div>
            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Analisis Syntia</p>
            {detalle.puntuacion != null && (
              <p className={`text-xs font-bold ${colorScore}`}>Puntuacion: {detalle.puntuacion}/100</p>
            )}
          </div>
        </div>
        {detalle.explicacion && (
          <button onClick={() => setOpen(v => !v)}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
            {open ? 'Ocultar razonamiento' : 'Ver razonamiento'}
          </button>
        )}
      </div>

      {open && detalle.explicacion && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed
                      border-t border-teal-200 dark:border-teal-700 pt-3">
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
```

---

## Paso 3 — src/app/convocatorias/[idBdns]/loading.tsx

```tsx
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="h-3 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  );
}
```

---

## Paso 4 — src/app/convocatorias/[idBdns]/page.tsx

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ConvocatoriaDetalle } from '@/types/bdns';
import { fetchDetalleConvocatoria } from '@/lib/bdnsApi';
import { PlazoIndicador } from '@/components/convocatorias/PlazoIndicador';
import { GuiaIaSection }  from '@/components/convocatorias/GuiaIaSection';

function Seccion({ titulo, contenido }: { titulo: string; contenido: string | null }) {
  if (!contenido) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase
                     tracking-wide mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
        {titulo}
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
        {contenido}
      </p>
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
  const params               = useParams();
  const router               = useRouter();
  const idBdns               = params.idBdns as string;
  const [detalle, setDetalle] = useState<ConvocatoriaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!idBdns) return;
    fetchDetalleConvocatoria(idBdns)
      .then(setDetalle)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [idBdns]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700
                     dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors">
          Volver a resultados
        </button>

        {loading && <Skeleton />}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700
                          dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            No se pudo cargar la convocatoria. {error}
          </div>
        )}

        {detalle && (
          <article className="space-y-6">
            {/* Cabecera */}
            <header className="space-y-3">
              <div className="flex flex-wrap items-start gap-2">
                <span className="text-xs font-medium rounded-full bg-gray-100 text-gray-600
                                 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-0.5">
                  {detalle.tipo}
                </span>
                {detalle.instrumento && (
                  <span className="text-xs font-medium rounded-full bg-blue-50 text-blue-700
                                   dark:bg-blue-900/20 dark:text-blue-300 px-2.5 py-0.5">
                    {detalle.instrumento}
                  </span>
                )}
                {detalle.mrr && (
                  <span className="text-xs font-medium rounded-full bg-purple-50 text-purple-700
                                   dark:bg-purple-900/20 dark:text-purple-300 px-2.5 py-0.5">
                    MRR
                  </span>
                )}
                <PlazoIndicador fechaCierre={detalle.fechaFinSolicitud ?? detalle.fechaCierre} />
              </div>

              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                {detalle.titulo}
              </h1>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{detalle.fuente}</span>
                {detalle.ubicacion && <span>{detalle.ubicacion}</span>}
                {detalle.sector    && <span>{detalle.sector}</span>}
                {detalle.numeroConvocatoria && <span>BDNS: {detalle.numeroConvocatoria}</span>}
              </div>
            </header>

            {/* Analisis Syntia */}
            <GuiaIaSection detalle={detalle} />

            {/* Datos financieros */}
            {(detalle.dotacion || detalle.ayudaEstado || detalle.fechaFinSolicitud) && (
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4
                                  grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Secciones de contenido */}
            <div className="space-y-5">
              <Seccion titulo="Objeto de la convocatoria" contenido={detalle.objeto} />
              <Seccion titulo="Beneficiarios"             contenido={detalle.beneficiarios} />
              <Seccion titulo="Requisitos"                contenido={detalle.requisitos} />
              <Seccion titulo="Documentacion requerida"   contenido={detalle.documentacion} />
              <Seccion titulo="Plazo de solicitudes"      contenido={detalle.plazoSolicitudes} />
              <Seccion titulo="Procedimiento"             contenido={detalle.procedimiento} />
              <Seccion titulo="Bases reguladoras"         contenido={detalle.basesReguladoras} />
            </div>

            {/* Enlace oficial */}
            <div className="flex justify-center pt-4 border-t border-gray-100 dark:border-gray-800">
              <a href={detalle.urlOficial} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5
                           text-sm font-medium text-white hover:bg-teal-700 active:bg-teal-800
                           transition-colors shadow-sm">
                Ver convocatoria oficial en BDNS
              </a>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
```

---

## Paso 5 — Anadir link en la tarjeta de convocatoria existente

Localizar el componente ConvocatoriaCard (o nombre equivalente) y anadir SOLO este link en el footer:

```tsx
import Link from 'next/link';

// Dentro del JSX de la tarjeta, en la seccion de acciones:
<Link
  href={`/convocatorias/${convocatoria.idBdns}`}
  className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
>
  Ver detalle completo
</Link>
```

---

## Verificacion final

```bash
npx tsc --noEmit
npm run dev

# En el navegador:
# 1. Abrir http://localhost:3000/convocatorias/609545
#    Debe mostrar: skeleton -> titulo -> badges de tipo -> secciones de contenido -> boton BDNS
# 2. Probar los filtros: expandir -> seleccionar Region + Finalidad -> Buscar
#    En Network tab verificar que la peticion incluye ?regiones=XX&finalidad=YY
# 3. Desde una tarjeta de resultados hacer clic en "Ver detalle completo"
#    Debe navegar a /convocatorias/[idBdns]
```

IMPLEMENTACION COMPLETA. Hacer PR a main cuando todos los checks pasen.
