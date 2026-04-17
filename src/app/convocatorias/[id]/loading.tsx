export default function LoadingConvocatoriaDetalle() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 animate-pulse space-y-5">
        <div className="h-4 w-32 bg-surface-muted rounded" />
        <div className="h-8 w-56 bg-surface-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-20 bg-surface-muted rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

