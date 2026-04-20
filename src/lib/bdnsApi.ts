import Cookies from 'js-cookie';
import type {
  CatalogoItem,
  Catalogos,
  ConvocatoriaDetalle,
  FiltrosBdns,
} from '@/types/bdns';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function getHeaders(): HeadersInit {
  const token = Cookies.get('syntia_token');

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

