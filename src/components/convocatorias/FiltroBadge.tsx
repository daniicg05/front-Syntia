'use client';

interface Props {
  label: string;
  onRemove: () => void;
}

export function FiltroBadge({ label, onRemove }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-teal-50 border
                     border-teal-200 px-2.5 py-0.5 text-xs font-medium text-teal-700
                     dark:bg-teal-900/20 dark:border-teal-700 dark:text-teal-300"
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="hover:text-teal-900 transition-colors ml-0.5"
      >
        x
      </button>
    </span>
  );
}

