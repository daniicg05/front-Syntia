'use client';

import { useEffect, useState } from 'react';
import type { Catalogos } from '@/types/bdns';
import {
  fetchCatalogoFinalidades,
  fetchCatalogoInstrumentos,
  fetchCatalogoRegiones,
} from '@/lib/bdnsApi';

interface UseCatalogosResult {
  catalogos: Catalogos;
  loading: boolean;
  error: string | null;
}

const VACIO: Catalogos = { regiones: [], finalidades: [], instrumentos: [] };
let cacheGlobal: Catalogos | null = null;

export function useCatalogosBdns(): UseCatalogosResult {
  const [catalogos, setCatalogos] = useState<Catalogos>(cacheGlobal ?? VACIO);
  const [loading, setLoading] = useState(!cacheGlobal);
  const [error, setError] = useState<string | null>(null);

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
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { catalogos, loading, error };
}

