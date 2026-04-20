'use client';

import { useCallback, useState } from 'react';
import { useCatalogosBdns } from '@/hooks/useCatalogosBdns';
import { FILTROS_INICIALES, type FiltrosBdns } from '@/types/bdns';
import { FiltroBadge } from './FiltroBadge';
import { FiltroSelect } from './FiltroSelect';

interface Props {
  filtros: FiltrosBdns;
  onChange: (filtros: FiltrosBdns) => void;
  onBuscar: () => void;
  loading?: boolean;
}

type TipoAdministracion = NonNullable<FiltrosBdns['tipoAdministracion']>;

const TIPOS_ADMON: Array<{ id: TipoAdministracion; nombre: string }> = [
  { id: 'C', nombre: 'Estatal' },
  { id: 'A', nombre: 'Autonomica' },
  { id: 'L', nombre: 'Local' },
  { id: 'O', nombre: 'Otro organismo' },
];

export function BdnsFiltrosPanel({ filtros, onChange, onBuscar, loading = false }: Props) {
  const { catalogos, loading: loadingCat } = useCatalogosBdns();
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (partial: Partial<FiltrosBdns>) => onChange({ ...filtros, ...partial, page: 0 }),
    [filtros, onChange]
  );

  const badges = [
    filtros.finalidad != null && {
      key: 'finalidad',
      label: `Sector: ${catalogos.finalidades.find((f) => f.id === filtros.finalidad)?.nombre ?? filtros.finalidad}`,
      remove: () => update({ finalidad: undefined }),
    },
    filtros.regiones?.length && {
      key: 'regiones',
      label: `Region: ${filtros.regiones
        .map((id) => catalogos.regiones.find((r) => r.id === id)?.nombre ?? id)
        .join(', ')}`,
      remove: () => update({ regiones: undefined }),
    },
    filtros.instrumentos?.length && {
      key: 'instrumentos',
      label: `Tipo: ${filtros.instrumentos
        .map((id) => catalogos.instrumentos.find((i) => i.id === id)?.nombre ?? id)
        .join(', ')}`,
      remove: () => update({ instrumentos: undefined }),
    },
    filtros.tipoAdministracion && {
      key: 'tipoAdmon',
      label: `Admon: ${TIPOS_ADMON.find((t) => t.id === filtros.tipoAdministracion)?.nombre}`,
      remove: () => update({ tipoAdministracion: undefined }),
    },
    filtros.mrr && { key: 'mrr', label: 'MRR', remove: () => update({ mrr: undefined }) },
    filtros.fechaDesde && {
      key: 'desde',
      label: `Desde: ${filtros.fechaDesde}`,
      remove: () => update({ fechaDesde: undefined }),
    },
    filtros.fechaHasta && {
      key: 'hasta',
      label: `Hasta: ${filtros.fechaHasta}`,
      remove: () => update({ fechaHasta: undefined }),
    },
  ].filter(Boolean) as { key: string; label: string; remove: () => void }[];

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Filtros BDNS</span>
        <div className="flex items-center gap-2">
          {badges.length > 0 && (
            <button
              onClick={() => onChange({ ...FILTROS_INICIALES })}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Limpiar todo
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            {expanded ? 'Colapsar' : 'Mas filtros'}
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={filtros.descripcion ?? ''}
            onChange={(e) => update({ descripcion: e.target.value || undefined })}
            placeholder="Buscar por titulo o descripcion..."
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm
                       focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none
                       dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
          <button
            onClick={onBuscar}
            disabled={loading}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Administracion</label>
            <select
              value={filtros.tipoAdministracion ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                update({
                  tipoAdministracion: value ? (value as TipoAdministracion) : undefined,
                });
              }}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm
                         focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none
                         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            >
              <option value="">Todas</option>
              {TIPOS_ADMON.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <FiltroSelect
            label="Region"
            items={catalogos.regiones}
            selected={filtros.regiones?.[0] ?? null}
            onChange={(id) => update({ regiones: id != null ? [id] : undefined })}
            loading={loadingCat}
          />

          <FiltroSelect
            label="Sector / Finalidad"
            items={catalogos.finalidades}
            selected={filtros.finalidad ?? null}
            onChange={(id) => update({ finalidad: id ?? undefined })}
            loading={loadingCat}
          />

          <FiltroSelect
            label="Tipo de ayuda"
            items={catalogos.instrumentos}
            selected={filtros.instrumentos?.[0] ?? null}
            onChange={(id) => update({ instrumentos: id != null ? [id] : undefined })}
            loading={loadingCat}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Abierto desde</label>
            <input
              type="date"
              value={filtros.fechaDesde ?? ''}
              onChange={(e) => update({ fechaDesde: e.target.value || undefined })}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm
                         focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none
                         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cierra antes de</label>
            <input
              type="date"
              value={filtros.fechaHasta ?? ''}
              onChange={(e) => update({ fechaHasta: e.target.value || undefined })}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm
                         focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none
                         dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.mrr ?? false}
                onChange={(e) => update({ mrr: e.target.checked || undefined })}
                className="rounded accent-teal-600"
              />
              Solo MRR
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.contribucion ?? false}
                onChange={(e) => update({ contribucion: e.target.checked || undefined })}
                className="rounded accent-teal-600"
              />
              Con contribucion
            </label>
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {badges.map((b) => (
            <FiltroBadge key={b.key} label={b.label} onRemove={b.remove} />
          ))}
        </div>
      )}
    </div>
  );
}

