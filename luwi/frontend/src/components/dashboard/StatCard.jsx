const TONES = {
  blue: "from-luwi-blue to-luwi-purple",
  teal: "from-luwi-teal to-emerald-300",
  navy: "from-luwi-navy to-luwi-blue",
  purple: "from-luwi-purple to-luwi-blue",
};

/** Tarjeta de indicador. Reutilizable en cualquier pantalla. */
export default function StatCard({ label, value, icon: Icon, tone = "blue", loading = false }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-luwi-border bg-white p-5 shadow-card">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${TONES[tone] ?? TONES.blue}`}
      >
        {Icon && <Icon className="h-6 w-6" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm leading-tight text-luwi-muted">{label}</p>
        <p className="text-3xl font-bold text-luwi-navy">
          {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-luwi-bg" /> : value}
        </p>
      </div>
    </article>
  );
}
