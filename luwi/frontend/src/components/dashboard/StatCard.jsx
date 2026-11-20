import { Link } from "react-router-dom";

const TONES = {
  blue: "from-luwi-blue to-luwi-purple",
  teal: "from-luwi-teal to-emerald-300",
  navy: "from-luwi-navy to-luwi-blue",
  purple: "from-luwi-purple to-luwi-blue",
};

/** Tarjeta de indicador. Si recibe `to`, toda la tarjeta lleva al módulo. */
export default function StatCard({ label, value, icon: Icon, tone = "blue", loading = false, to }) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${TONES[tone] ?? TONES.blue}`}
        >
          {Icon && <Icon className="h-6 w-6" />}
        </span>
        {to && (
          <span className="text-xs font-medium text-luwi-muted transition group-hover:text-luwi-blue">
            Ver todo →
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-luwi-muted">{label}</p>
      <p className="text-3xl font-bold text-luwi-navy">
        {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-luwi-bg" /> : value}
      </p>
    </>
  );

  const cls =
    "group block rounded-2xl border border-luwi-border bg-white p-5 shadow-card transition";

  return to ? (
    <Link to={to} className={`${cls} hover:-translate-y-0.5 hover:border-luwi-blue/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-blue/40`}>
      {body}
    </Link>
  ) : (
    <article className={cls}>{body}</article>
  );
}
