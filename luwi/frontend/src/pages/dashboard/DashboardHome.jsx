import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/dashboard/StatCard";
import Panel from "../../components/dashboard/Panel";
import BarList from "../../components/dashboard/BarList";
import QuickActions from "../../components/dashboard/QuickActions";
import { BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon } from "../../components/dashboard/icons";
import useAuth from "../../hooks/useAuth";
import { getResumen } from "../../services/dashboardService";

const CARDS = [
  { key: "empresas", label: "Empresas registradas", icon: BuildingIcon, tone: "blue", to: "/dashboard/empresas", bar: "from-luwi-blue to-luwi-purple" },
  { key: "puestos", label: "Puestos registrados", icon: BriefcaseIcon, tone: "teal", to: "/dashboard/puestos", bar: "from-luwi-teal to-emerald-300" },
  { key: "cursos", label: "Cursos disponibles", icon: BookIcon, tone: "navy", to: "/dashboard/cursos", bar: "from-luwi-navy to-luwi-blue" },
  { key: "rutas", label: "Rutas de aprendizaje", icon: RouteIcon, tone: "purple", to: "/dashboard/rutas", bar: "from-luwi-purple to-luwi-blue" },
];

const TIPOS = {
  empresa: { icon: BuildingIcon, label: "Empresa", to: "/dashboard/empresas" },
  puesto: { icon: BriefcaseIcon, label: "Puesto", to: "/dashboard/puestos" },
  curso: { icon: BookIcon, label: "Curso", to: "/dashboard/cursos" },
  ruta: { icon: RouteIcon, label: "Ruta", to: "/dashboard/rutas" },
};

function tiempoRelativo(iso) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  return `Hace ${d} ${d === 1 ? "día" : "días"}`;
}

const fechaHoy = () => {
  const f = new Date().toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
  return f.charAt(0).toUpperCase() + f.slice(1);
};

export default function DashboardHome() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(false);

  const cargar = useCallback(() => {
    setError(false);
    setResumen(null);
    getResumen().then(setResumen).catch(() => setError(true));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const loading = resumen === null && !error;

  return (
    <div className="space-y-6">
      {/* Bienvenida + accesos rápidos */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-luwi-navy via-luwi-blue to-luwi-purple p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-luwi-teal/30" />
        <p className="relative text-sm text-white/80">{fechaHoy()}</p>
        <h1 className="relative mt-1 text-2xl font-bold sm:text-3xl">
          Hola, {user?.username ?? "bienvenido"}
        </h1>
        <p className="relative mt-1 max-w-xl text-sm text-white/80">
          Este es el resumen de tu plataforma LUWI. Crea nuevos registros desde los accesos rápidos.
        </p>
        <div className="relative mt-5">
          <QuickActions inverse />
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          No se pudieron cargar los datos del resumen.
          <button type="button" onClick={cargar} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 shadow-sm hover:bg-red-100">
            Reintentar
          </button>
        </div>
      )}

      {/* Las cuatro tarjetas */}
      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map(({ key, bar, ...card }) => (
          <StatCard key={key} {...card} value={resumen?.[key] ?? 0} loading={loading} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Resumen de la plataforma" subtitle="Cantidad de registros por módulo" className="lg:col-span-2">
          {loading ? (
            <div className="space-y-5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-6 animate-pulse rounded bg-luwi-bg" />)}</div>
          ) : (
            <BarList items={CARDS.map((c) => ({ label: c.label, value: resumen?.[c.key] ?? 0, color: c.bar }))} />
          )}
        </Panel>

        <Panel title="Actividad reciente" subtitle="Últimos registros creados" className="lg:col-span-3">
          {loading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-luwi-bg" />)}</div>
          ) : !resumen?.recientes?.length ? (
            <p className="py-8 text-center text-sm text-luwi-muted">Aún no hay registros. Crea el primero con los accesos rápidos.</p>
          ) : (
            <ul className="divide-y divide-luwi-border">
              {resumen.recientes.map(({ id, tipo, nombre, fecha }) => {
                const t = TIPOS[tipo] ?? TIPOS.curso;
                const Icon = t.icon;
                return (
                  <li key={`${tipo}-${id}`}>
                    <Link to={t.to} className="flex items-center gap-3 py-3 transition hover:bg-luwi-bg/60 sm:-mx-2 sm:rounded-xl sm:px-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-luwi-bg text-luwi-blue">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-luwi-ink">{nombre}</p>
                        <p className="text-xs text-luwi-muted">{t.label}</p>
                      </div>
                      <span className="shrink-0 text-xs text-luwi-muted">{tiempoRelativo(fecha)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
