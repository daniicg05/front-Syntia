'use client';

interface Props {
  fechaCierre: string | null;
}

export function PlazoIndicador({ fechaCierre }: Props) {
  if (!fechaCierre) return null;

  const dias = Math.ceil((new Date(fechaCierre).getTime() - Date.now()) / 86400000);

  if (dias < 0) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5
                     text-xs font-medium text-gray-500 dark:bg-gray-800"
      >
        Cerrada
      </span>
    );
  }

  const color =
    dias <= 7
      ? 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      : dias <= 30
        ? 'bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
        : 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:text-green-300';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {dias === 0 ? 'Cierra hoy' : `${dias} dias restantes`}
    </span>
  );
}

