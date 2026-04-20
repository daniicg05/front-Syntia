'use client';

import type { CatalogoItem } from '@/types/bdns';

interface Props {
  label: string;
  items: CatalogoItem[];
  selected: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  loading?: boolean;
}

export function FiltroSelect({
  label,
  items,
  selected,
  onChange,
  placeholder = 'Todos',
  loading = false,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      <select
        value={selected ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={loading}
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm
                   text-gray-800 shadow-sm focus:border-teal-500 focus:ring-1
                   focus:ring-teal-500 focus:outline-none disabled:opacity-50
                   dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
      >
        <option value="">{loading ? 'Cargando...' : placeholder}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

