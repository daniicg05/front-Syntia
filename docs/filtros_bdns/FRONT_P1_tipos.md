# PROMPT FRONT — Parte 1: Tipos TypeScript + Hook de Catálogos

## INSTRUCCIONES PARA EL AGENTE
Lee este archivo completo ANTES de escribir una sola línea de código.
Respeta el orden de los pasos numerados.
No modifiques componentes existentes en este paso.
Al finalizar ejecuta: npx tsc --noEmit y reporta el resultado.

## Contexto
- Repo: front-Syntia
- Rama: feature/filtros-bdns-completos
- Prerequisito: Los 3 BACK completados. Endpoints /api/catalogos/* y /api/convocatorias/{id}/detalle responden.
- Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS
- Archivos a CREAR: src/types/bdns.ts, src/lib/bdnsApi.ts, src/hooks/useCatalogosBdns.ts
- Archivos que NO tocar: ningun componente existente en este paso

---

## Paso 1 — src/types/bdns.ts

```typescript
export interface CatalogoItem {
  id:     number;
  nombre: string;
}

export interface Catalogos {
  regiones:    CatalogoItem[];
  finalidades: CatalogoItem[];
  instrumentos: CatalogoItem[];
}

export interface FiltrosBdns {
  descripcion?:             string;
  descripcionTipoBusqueda?: 0 | 1 | 2;
  numeroConvocatoria?:      string;
  ayudaEstado?:             string;
  tipoAdministracion?:      'C' | 'A' | 'L' | 'O';
  regiones?:                number[];
  finalidad?:               number;
  instrumentos?:            number[];
  organos?:                 number[];
  tiposBeneficiario?:       number[];
  mrr?:                     boolean;
  contribucion?:            boolean;
  fechaDesde?:              string;
  fechaHasta?:              string;
  page?:                    number;
  pageSize?:                number;
  order?:                   string;
  direccion?:               'asc' | 'desc';
}

export interface ConvocatoriaDetalle {
  idBdns:              string;
  numeroConvocatoria:  string;
  titulo:              string;
  tituloAlternativo:   string | null;
  tipo:                string;
  ubicacion:           string;
  sector:              string | null;
  finalidad:           string | null;
  instrumento:         string | null;
  nivel1:              string;
  nivel2:              string;
  nivel3:              string | null;
  fuente:              string;
  objeto:              string | null;
  beneficiarios:       string | null;
  requisitos:          string | null;
  documentacion:       string | null;
  dotacion:            string | null;
  ayudaEstado:         string | null;
  mrr:                 boolean;
  contribucion:        boolean;
  fechaRecepcion:      string | null;
  fechaFinSolicitud:   string | null;
  fechaCierre:         string | null;
  plazoSolicitudes:    string | null;
  procedimiento:       string | null;
  basesReguladoras:    string | null;
  urlOficial:          string;
  puntuacion?:         number;
  explicacion?:        string;
  guia?:               string;
  fechaAnalisis?:      string;
}

export const FILTROS_INICIALES: FiltrosBdns = {
  descripcionTipoBusqueda: 1,
  page: 0,
  pageSize: 15,
};
```

---

## Paso 2 — src/lib/bdnsApi.ts

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCatalogoRegiones(): Promise<CatalogoItem[]> {
  const res = await fetch(`${API_BASE}/api/catalogos/regiones`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error cargando regiones');
  return res.json();
}

export async function fetchCatalogoFinalidades(): Promise<CatalogoItem[]> {
  const res = await fetch(`${API_BASE}/api/catalogos/finalidades`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error cargando finalidades');
  return res.json();
}

export async function fetchCatalogoInstrumentos(): Promise<CatalogoItem[]> {
  const res = await fetch(`${API_BASE}/api/catalogos/instrumentos`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error cargando instrumentos');
  return res.json();
}

export async function fetchDetalleConvocatoria(idBdns: string): Promise<ConvocatoriaDetalle> {
  const res = await fetch(`${API_BASE}/api/convocatorias/${idBdns}/detalle`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Convocatoria ${idBdns} no encontrada`);
  return res.json();
}

export type { CatalogoItem, FiltrosBdns, ConvocatoriaDetalle, Catalogos } from '@/types/bdns';
```

---

## Paso 3 — src/hooks/useCatalogosBdns.ts

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { Catalogos } from '@/types/bdns';
import {
  fetchCatalogoRegiones,
  fetchCatalogoFinalidades,
  fetchCatalogoInstrumentos,
} from '@/lib/bdnsApi';

interface UseCatalogosResult {
  catalogos: Catalogos;
  loading:   boolean;
  error:     string | null;
}

const VACIO: Catalogos = { regiones: [], finalidades: [], instrumentos: [] };
let cacheGlobal: Catalogos | null = null;

export function useCatalogosBdns(): UseCatalogosResult {
  const [catalogos, setCatalogos] = useState<Catalogos>(cacheGlobal ?? VACIO);
  const [loading,   setLoading]   = useState(!cacheGlobal);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (cacheGlobal) return;

    Promise.all([
      fetchCatalogoRegiones(),
      fetchCatalogoFinalidades(),
      fetchCatalogoInstrumentos(),
    ])
      .then(([regiones, finalidades, instrumentos]) => {
        const data: Catalogos = { regiones, finalidades, instrumentos };
        cacheGlobal = data;
        setCatalogos(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { catalogos, loading, error };
}
```

---

## Verificacion

```bash
npx tsc --noEmit
# Debe mostrar: sin errores
# Si hay error de paths verificar que tsconfig.json tenga:
# "paths": { "@/*": ["./src/*"] }
```

PASA A FRONT_P2 solo cuando tsc no arroje errores.
