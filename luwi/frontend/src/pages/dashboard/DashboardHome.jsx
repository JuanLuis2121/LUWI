import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/dashboard/StatCard";
import Panel from "../../components/dashboard/Panel";
import DonutChart from "../../components/dashboard/DonutChart";
import RadialGauge from "../../components/dashboard/RadialGauge";
import {
  BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon, AlertIcon, CheckCircleIcon,
  ChevronRightIcon, ClockIcon, TrendUpIcon, PlusIcon,
} from "../../components/dashboard/icons";
import useAuth from "../../hooks/useAuth";
import useDashboardAdmin from "../../hooks/useDashboardAdmin";
import PeriodSelector from "../../components/dashboard/PeriodSelector";
import ActividadChart from "../../components/dashboard/ActividadChart";
import { PERIODOS, tendencia, actividadPorIntervalo } from "../../utils/periodo";

// Periodo elegido: se recuerda en el navegador
const leerPeriodo = () => {
  try {
    const v = localStorage.getItem("luwi-dashboard-periodo");
    return PERIODOS[v] ? v : "30d";
  } catch {
    return "30d";
  }
};

// ---------- Configuración ----------

const TIPOS = {
  empresa: { icon: BuildingIcon, label: "Empresa creada", ruta: (id) => `/dashboard/empresas/${id}` },
  puesto: { icon: BriefcaseIcon, label: "Puesto creado", ruta: (id) => `/dashboard/puestos/${id}` },
  curso: { icon: BookIcon, label: "Curso creado", ruta: (id) => `/dashboard/cursos/${id}/unidades` },
  ruta: { icon: RouteIcon, label: "Ruta creada", ruta: (id) => `/dashboard/rutas/${id}` },
};

const ICONO_PENDIENTE = {
  borradores: BookIcon,
  "puestos-sin-ruta": BriefcaseIcon,
  "rutas-sin-cursos": RouteIcon,
};

const COLORES_ESTADO = {
  publicados: "#222bb8",
  borradores: "#d1b17c",
  inactivos: "#e5d5bf",
};

// ---------- Utilidades ----------

function tiempoRelativo(iso) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  return `Hace ${d} ${d === 1 ? "día" : "días"}`;
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const porcentaje = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const fechaHoy = () => {
  const f = new Date().toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
  return f.charAt(0).toUpperCase() + f.slice(1);
};

function Esqueleto({ filas = 3, alto = "h-14" }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className={`${alto} animate-pulse rounded-2xl bg-luwi-cristal-fondo`} />
      ))}
    </div>
  );
}

// ---------- Bienvenida ilustrada ----------

function Bienvenida({ nombre, datos, cargando }) {
  const pendientes = datos?.totalPendientes ?? 0;

  const chips = datos
    ? [
        { label: plural(pendientes, "pendiente", "pendientes"), alerta: pendientes > 0 },
        { label: `${porcentaje(datos.puestosCubiertos, datos.totalPuestos)}% puestos cubiertos` },
        { label: `${datos.porcentajePublicado}% cursos publicados` },
      ]
    : [];

  return (
    <section className="relative flex flex-col justify-center overflow-hidden rounded-[28px] border border-luwi-linea bg-[radial-gradient(ellipse_at_85%_80%,#F8E6D2_0%,#FBF2E6_32%,#FDF8F2_68%,#FFFFFF_100%)] p-6 shadow-[0_20px_50px_-30px_rgba(17,22,82,0.3)] sm:p-8">
      {/* Decoración */}
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-[18%] h-80 w-80 rounded-full border-[40px] border-white/30" />

      <div className="relative max-w-[600px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-3 py-1 text-[11.5px] font-medium text-luwi-texto backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-luwi-tecno shadow-[0_0_6px_2px_rgba(59,69,201,0.5)]" />
          {fechaHoy()}
        </span>

        <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo sm:text-[34px]">
          Hola, <span className="bg-gradient-to-r from-luwi-medio to-luwi-tecno bg-clip-text text-transparent">{nombre}</span>
        </h1>

        <p className="mt-2 text-[15px] leading-relaxed text-luwi-texto">
          {cargando
            ? "Preparando el resumen de tu plataforma…"
            : pendientes > 0
            ? "Así va la preparación de tus candidatos. Resuelve los pendientes para que cada puesto tenga su ruta lista."
            : "Todo está al día: tus puestos, cursos y rutas están listos para formar candidatos."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {pendientes > 0 && (
            <a
              href="#pendientes"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-luwi-profundo to-luwi-medio px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(17,22,82,0.8)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30"
            >
              Revisar pendientes
              <ChevronRightIcon className="h-4 w-4" />
            </a>
          )}
          <Link
            to="/dashboard/rutas/nuevo"
            className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/80 px-5 py-2.5 text-sm font-semibold text-luwi-profundo shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva ruta
          </Link>
        </div>

        {chips.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {chips.map((c) => (
              <li
                key={c.label}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  c.alerta ? "bg-amber-100 text-amber-700" : "bg-white/70 text-luwi-profundo"
                }`}
              >
                {c.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---------- Índice de preparación (tarjeta oscura) ----------

function Preparacion({ datos, cargando }) {
  return (
    <section className="relative flex flex-col overflow-hidden rounded-[28px] bg-colonial-hero p-6 text-white shadow-[0_20px_50px_-25px_rgba(15,20,76,0.7)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-luwi-fawn/30 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Índice de preparación</h2>
          <p className="mt-0.5 text-xs text-white/60">Qué tan lista está la plataforma para formar</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F0D4A4]">
          <TrendUpIcon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="relative mt-3 flex justify-center">
        {cargando ? (
          <div className="h-[168px] w-[168px] animate-pulse rounded-full bg-white/10" />
        ) : (
          <RadialGauge value={datos?.preparacion ?? 0} label="Preparación" />
        )}
      </div>

      <ul className="relative mt-1 space-y-3">
        {(datos?.indicadores ?? []).map((i) => {
          const p = porcentaje(i.valor, i.total);
          return (
            <li key={i.label}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-white/70">{i.label}</span>
                <span className="font-semibold">
                  {i.valor}/{i.total}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-colonial-fawn" style={{ width: `${p}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------- Pendientes ----------

function Pendientes({ pendientes, cargando }) {
  if (cargando) return <Esqueleto filas={3} alto="h-24" />;

  if (!pendientes.length) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-luwi-antique text-luwi-fawn-deep">
          <CheckCircleIcon className="h-7 w-7" />
        </span>
        <p className="mt-3 text-sm font-semibold text-luwi-profundo">Todo al día</p>
        <p className="mt-1 text-xs text-luwi-texto/80">No hay cursos en borrador ni puestos sin ruta.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pendientes.map((p) => {
        const Icon = ICONO_PENDIENTE[p.id] ?? AlertIcon;
        const visibles = p.items.slice(0, 3);
        const resto = p.total - visibles.length;
        return (
          <li
            key={p.id}
            className="group relative overflow-hidden rounded-2xl border border-luwi-linea/70 bg-gradient-to-r from-white to-luwi-panel/60 p-4 pl-5 transition hover:border-luwi-tecno/40 hover:shadow-[0_10px_24px_-18px_rgba(17,22,82,0.6)]"
          >
            <span aria-hidden="true" className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-400" />
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 text-orange-600">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-luwi-profundo">{p.titulo}</p>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700">{p.total}</span>
                </div>
                <p className="mt-0.5 text-xs text-luwi-texto/80">{p.detalle}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {visibles.map((item) => (
                    <Link
                      key={item.id}
                      to={item.to}
                      title={item.nota}
                      className="max-w-[220px] truncate rounded-lg border border-luwi-linea bg-white px-2.5 py-1 text-xs font-medium text-luwi-profundo transition hover:border-luwi-tecno hover:text-luwi-medio"
                    >
                      {item.nombre}
                    </Link>
                  ))}
                  {resto > 0 && <span className="px-1 py-1 text-xs text-luwi-texto/70">+{resto} más</span>}
                </div>
              </div>
              <Link
                to={p.accion.to}
                className="hidden shrink-0 items-center gap-1 rounded-xl bg-luwi-cristal-fondo px-3 py-2 text-xs font-semibold text-luwi-medio transition hover:bg-luwi-profundo hover:text-white sm:flex"
              >
                {p.accion.label}
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ---------- Estado de los cursos ----------

function EstadoCursos({ datos, cargando }) {
  if (cargando || !datos) return <Esqueleto filas={4} alto="h-10" />;

  const { publicados, borradores, inactivos, total } = datos.cursosEstado;
  const filas = [
    { key: "publicados", label: "Publicados", value: publicados },
    { key: "borradores", label: "En borrador", value: borradores },
    { key: "inactivos", label: "Inactivos", value: inactivos },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-center">
        <DonutChart
          segmentos={filas.map((f) => ({ label: f.label, value: f.value, color: COLORES_ESTADO[f.key] }))}
          centro={total}
          subcentro="cursos en total"
          size={176}
          grosor={20}
        />
      </div>
      <ul className="mt-6 grid grid-cols-3 gap-2">
        {filas.map((f) => (
          <li key={f.key} className="rounded-2xl bg-luwi-panel px-3 py-3 text-center">
            <span className="mx-auto mb-1.5 block h-1.5 w-6 rounded-full" style={{ background: COLORES_ESTADO[f.key] }} />
            <p className="text-lg font-bold leading-none text-luwi-profundo">{f.value}</p>
            <p className="mt-1 text-[11px] text-luwi-texto/80">{f.label}</p>
            <p className="text-[10.5px] font-semibold text-luwi-texto/60">{porcentaje(f.value, total)}%</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Competencias ----------

function Competencias({ competencias, niveles, cargando }) {
  if (cargando) return <Esqueleto filas={5} alto="h-8" />;

  const maxComp = Math.max(1, ...competencias.map((c) => c.total));
  const totalNiveles = niveles.reduce((a, n) => a + n.total, 0);
  const tonos = ["bg-luwi-profundo", "bg-luwi-medio", "bg-luwi-tecno"];

  return (
    <div>
      {competencias.length ? (
        <ol className="space-y-3.5">
          {competencias.map((c, i) => (
            <li key={c.nombre} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-xs font-bold text-luwi-texto/50">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-luwi-profundo">{c.nombre}</span>
                  <span className="shrink-0 text-xs font-semibold text-luwi-texto">{plural(c.total, "curso", "cursos")}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-luwi-panel">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-luwi-medio to-luwi-tecno"
                    style={{ width: `${(c.total / maxComp) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-6 text-center text-sm text-luwi-texto/80">Los cursos aún no tienen competencias asignadas.</p>
      )}

      {/* Distribución por nivel en una barra apilada */}
      <div className="mt-6 border-t border-luwi-linea/70 pt-5">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-luwi-texto/60">Cursos por nivel</p>
        <div className="flex h-3 overflow-hidden rounded-full bg-luwi-panel">
          {niveles.map((n, i) =>
            n.total ? (
              <div key={n.nivel} className={`${tonos[i]} h-full first:rounded-l-full last:rounded-r-full`} style={{ width: `${porcentaje(n.total, totalNiveles)}%` }} />
            ) : null
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {niveles.map((n, i) => (
            <li key={n.nivel} className="flex items-center gap-1.5 text-xs text-luwi-texto">
              <span className={`h-2 w-2 rounded-full ${tonos[i]}`} />
              <span className="capitalize">{n.nivel}</span>
              <span className="font-semibold text-luwi-profundo">{n.total}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Rutas destacadas ----------

function RutasDestacadas({ rutas, cargando }) {
  if (cargando) return <Esqueleto filas={4} alto="h-16" />;
  if (!rutas.length) return <p className="py-6 text-center text-sm text-luwi-texto/80">Todavía no hay rutas creadas.</p>;

  return (
    <ul className="space-y-2.5">
      {rutas.map((r, i) => (
        <li key={r.id}>
          <Link
            to={`/dashboard/rutas/${r.id}`}
            className="group flex items-center gap-3 rounded-2xl border border-transparent p-2.5 transition hover:border-luwi-linea hover:bg-luwi-panel/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                i === 0 ? "bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white" : "bg-luwi-cristal-fondo text-luwi-medio"
              }`}
            >
              {r.cursos}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-luwi-profundo group-hover:text-luwi-medio">{r.nombre}</p>
              <p className="truncate text-xs text-luwi-texto/75">
                {r.puesto || "Sin puesto"}
                {r.horas ? ` · ${r.horas} h` : ""}
              </p>
              {/* Un punto por curso */}
              <div className="mt-1.5 flex gap-1">
                {Array.from({ length: Math.min(r.cursos, 8) }, (_, k) => (
                  <span key={k} className="h-1.5 w-4 rounded-full bg-gradient-to-r from-luwi-medio to-luwi-tecno opacity-80" />
                ))}
              </div>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-luwi-texto/40 transition group-hover:translate-x-0.5 group-hover:text-luwi-medio" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ---------- Actividad reciente ----------

function ActividadReciente({ recientes, cargando }) {
  if (cargando) return <Esqueleto filas={5} alto="h-12" />;
  if (!recientes.length) {
    return <p className="py-8 text-center text-sm text-luwi-texto/80">Aún no hay registros. Usa el botón “Crear” para empezar.</p>;
  }

  return (
    <ol>
      {recientes.map(({ id, tipo, nombre, fecha }, i) => {
        const t = TIPOS[tipo] ?? TIPOS.curso;
        const Icon = t.icon;
        const ultimo = i === recientes.length - 1;
        return (
          <li key={`${tipo}-${id}`} className="relative">
            {!ultimo && <span aria-hidden="true" className="absolute left-[19px] top-12 h-[calc(100%-40px)] w-px bg-gradient-to-b from-luwi-linea to-transparent" />}
            <Link
              to={t.ruta(id)}
              className="group flex items-center gap-3 rounded-xl py-2.5 pr-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-luwi-cristal-fondo text-luwi-medio ring-4 ring-white transition group-hover:bg-luwi-profundo group-hover:text-white">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-luwi-profundo group-hover:text-luwi-medio">{nombre}</p>
                <p className="flex items-center gap-1 text-xs text-luwi-texto/70">
                  {t.label}
                  <span aria-hidden="true">·</span>
                  <ClockIcon className="h-3 w-3" />
                  {tiempoRelativo(fecha)}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Pantalla ----------

export default function DashboardHome() {
  const { user } = useAuth();
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroPuesto, setFiltroPuesto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { datos, error, cargando, recargar } = useDashboardAdmin({
    empresa: filtroEmpresa,
    puesto: filtroPuesto,
    estado: filtroEstado,
  });
  const listo = !cargando && datos;
  const t = datos?.totales;
  const f = datos?.formacion;
  const esAdmin = user?.rol === "admin";
  const empresasLista = datos?.listas?.empresas ?? [];
  const puestosLista = useMemo(() => {
    const todos = datos?.listas?.puestos ?? [];
    if (!filtroEmpresa) return todos;
    return todos.filter((p) => String(p.empresa?._id ?? p.empresa?.id ?? p.empresa ?? "") === filtroEmpresa);
  }, [datos?.listas?.puestos, filtroEmpresa]);
  const hayFiltrosFormacion = Boolean(filtroEmpresa || filtroPuesto || filtroEstado);

  const [periodo, setPeriodoState] = useState(leerPeriodo);

  const setPeriodo = (p) => {
    setPeriodoState(p);
    try {
      localStorage.setItem("luwi-dashboard-periodo", p);
    } catch {
      // Sin almacenamiento: el periodo dura mientras la página esté abierta
    }
  };

  // Tendencias por tipo y actividad del periodo (se recalculan al cambiar de periodo)
  const porPeriodo = useMemo(() => {
    if (!datos?.listas) return null;
    const texto = `en ${PERIODOS[periodo].label}`;
    const t4 = Object.fromEntries(
      Object.entries(datos.listas).map(([k, lista]) => [k, { ...tendencia(lista, periodo), texto }])
    );
    return { tendencias: t4, actividad: actividadPorIntervalo(datos.listas, periodo) };
  }, [datos, periodo]);

  // Las cuatro tarjetas siguen el flujo de LUWI: empresa → puesto → ruta → curso.
  const pasos = [
    {
      key: "empresas",
      paso: "01",
      label: "Empresas",
      icon: BuildingIcon,
      to: "/dashboard/empresas",
      detalle: "Organizaciones en la plataforma",
    },
    {
      key: "puestos",
      paso: "02",
      label: "Puestos",
      icon: BriefcaseIcon,
      to: "/dashboard/puestos",
      detalle: listo ? `${datos.puestosCubiertos} con ruta asignada` : null,
      progreso: listo ? porcentaje(datos.puestosCubiertos, datos.totalPuestos) : undefined,
    },
    {
      key: "rutas",
      paso: "03",
      label: "Rutas de aprendizaje",
      icon: RouteIcon,
      to: "/dashboard/rutas",
      detalle: listo ? `${datos.promedioCursosPorRuta} cursos por ruta en promedio` : null,
      progreso: listo ? porcentaje(datos.rutasConCursos, datos.totalRutas) : undefined,
    },
    {
      key: "cursos",
      paso: "04",
      label: "Cursos",
      icon: BookIcon,
      to: "/dashboard/cursos",
      detalle: listo ? `${datos.cursosEstado.publicados} publicados · ${datos.cursosEstado.borradores} en borrador` : null,
      progreso: listo ? datos.porcentajePublicado : undefined,
    },
  ];

  return (
    <div className="space-y-6 font-poppins">
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          No se pudieron cargar los datos del panel.
          <button type="button" onClick={recargar} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 shadow-sm hover:bg-red-100">
            Reintentar
          </button>
        </div>
      )}

      {/* Bienvenida + índice */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Bienvenida nombre={user?.nombre ?? "bienvenido"} datos={datos} cargando={cargando} />
        <Preparacion datos={datos} cargando={cargando} />
      </div>

      {/* Flujo de preparación */}
      <section aria-labelledby="flujo-titulo">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="flujo-titulo" className="text-[15px] font-semibold text-luwi-profundo">Flujo de preparación</h2>
            <p className="text-xs text-luwi-texto/75">De la empresa al curso: cada paso habilita el siguiente</p>
          </div>
          <PeriodSelector value={periodo} onChange={setPeriodo} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4 xl:gap-6">
          {pasos.map(({ key, ...card }, i) => (
            <StatCard
              key={key}
              {...card}
              value={t?.[key] ?? 0}
              tendencia={porPeriodo?.tendencias[key]}
              loading={cargando}
              conector={i < pasos.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Seguimiento de formación y evaluaciones (datos reales /api/dashboard/resumen con filtros) */}
      <section aria-labelledby="seguimiento-formacion-titulo" className="rounded-[26px] border border-luwi-linea bg-white p-5 shadow-[0_14px_38px_-22px_rgba(17,22,82,0.14)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-luwi-fawn-deep">Seguimiento en vivo</p>
            <h2 id="seguimiento-formacion-titulo" className="mt-0.5 text-lg font-extrabold text-luwi-profundo">
              Formación, procesos y evaluaciones
            </h2>
            <p className="text-xs text-luwi-texto">
              Cifras calculadas en tiempo real desde la base de datos. Filtra por empresa, puesto o estado del proceso.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {esAdmin && empresasLista.length > 0 && (
              <select
                aria-label="Filtrar resumen por empresa"
                value={filtroEmpresa}
                onChange={(e) => {
                  setFiltroEmpresa(e.target.value);
                  setFiltroPuesto("");
                }}
                className="h-9 rounded-xl border border-luwi-linea bg-luwi-panel px-3 text-xs font-medium text-luwi-profundo outline-none focus:border-luwi-medio focus:bg-white"
              >
                <option value="">Todas las empresas</option>
                {empresasLista.map((emp) => {
                  const eid = String(emp._id ?? emp.id);
                  return (
                    <option key={eid} value={eid}>
                      {emp.nombre}
                    </option>
                  );
                })}
              </select>
            )}

            <select
              aria-label="Filtrar resumen por puesto"
              value={filtroPuesto}
              onChange={(e) => setFiltroPuesto(e.target.value)}
              className="h-9 rounded-xl border border-luwi-linea bg-luwi-panel px-3 text-xs font-medium text-luwi-profundo outline-none focus:border-luwi-medio focus:bg-white"
            >
              <option value="">Todos los puestos</option>
              {puestosLista.map((pu) => {
                const pid = String(pu._id ?? pu.id);
                return (
                  <option key={pid} value={pid}>
                    {pu.titulo ?? pu.nombre}
                  </option>
                );
              })}
            </select>

            <select
              aria-label="Filtrar resumen por estado del proceso"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-9 rounded-xl border border-luwi-linea bg-luwi-panel px-3 text-xs font-medium text-luwi-profundo outline-none focus:border-luwi-medio focus:bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="SUSPENDIDO">Suspendidos</option>
              <option value="FINALIZADO">Finalizados</option>
            </select>

            {hayFiltrosFormacion && (
              <button
                type="button"
                onClick={() => {
                  setFiltroEmpresa("");
                  setFiltroPuesto("");
                  setFiltroEstado("");
                }}
                className="h-9 rounded-xl border border-luwi-linea bg-white px-3 text-xs font-semibold text-luwi-medio transition hover:bg-luwi-cristal"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Postulantes y procesos */}
          <Link
            to="/dashboard/postulantes"
            className="group rounded-2xl border border-luwi-linea bg-luwi-panel/70 p-4 transition hover:-translate-y-0.5 hover:border-luwi-medio/35 hover:bg-white hover:shadow-md"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-luwi-texto/75">Postulantes</p>
            <p className="mt-1.5 text-3xl font-extrabold text-luwi-profundo">
              {cargando ? "—" : f?.postulantes ?? 0}
            </p>
            <p className="mt-2 text-xs text-luwi-texto">
              <strong className="text-luwi-medio">{f?.procesos?.activos ?? 0}</strong> activos ·{" "}
              <strong className="text-luwi-fawn-deep">{f?.procesos?.suspendidos ?? 0}</strong> suspendidos ·{" "}
              {f?.procesos?.finalizados ?? 0} finalizados
            </p>
          </Link>

          {/* Cursos asignados */}
          <Link
            to="/dashboard/postulantes"
            className="group rounded-2xl border border-luwi-linea bg-luwi-panel/70 p-4 transition hover:-translate-y-0.5 hover:border-luwi-medio/35 hover:bg-white hover:shadow-md"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-luwi-texto/75">Cursos asignados</p>
            <p className="mt-1.5 text-3xl font-extrabold text-luwi-profundo">
              {cargando ? "—" : f?.cursosAsignados?.total ?? 0}
            </p>
            <p className="mt-2 text-xs text-luwi-texto">
              <strong className="text-luwi-medio">{f?.cursosAsignados?.habilitados ?? 0}</strong> habilitados ·{" "}
              <strong className="text-luwi-fawn-deep">{f?.cursosAsignados?.pendientes ?? 0}</strong> pendientes
            </p>
          </Link>

          {/* Progreso promedio */}
          <div className="rounded-2xl border border-luwi-linea bg-luwi-panel/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-luwi-texto/75">Progreso de formación</p>
            <p className="mt-1.5 text-3xl font-extrabold text-luwi-profundo">
              {cargando ? "—" : `${f?.progreso?.promedio ?? 0}%`}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-luwi-antique">
              <div
                className="h-full rounded-full bg-colonial-progress transition-all duration-500"
                style={{ width: `${Math.min(100, f?.progreso?.promedio ?? 0)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-luwi-texto">
              {f?.progreso?.completos ?? 0} de {f?.progreso?.asignaciones ?? 0} rutas completadas
            </p>
          </div>

          {/* Resultados de evaluaciones */}
          <Link
            to="/dashboard/evaluaciones"
            className="group rounded-2xl border border-luwi-linea bg-luwi-panel/70 p-4 transition hover:-translate-y-0.5 hover:border-luwi-medio/35 hover:bg-white hover:shadow-md"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-luwi-texto/75">Evaluaciones</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="text-3xl font-extrabold text-luwi-profundo">
                {cargando
                  ? "—"
                  : f?.evaluaciones?.resultados?.promedio != null
                    ? `${f.evaluaciones.resultados.promedio}%`
                    : `${f?.evaluaciones?.publicadas ?? 0}`}
              </p>
              <span className="text-xs font-medium text-luwi-texto">
                {f?.evaluaciones?.resultados?.promedio != null ? "promedio" : "publicadas"}
              </span>
            </div>
            <p className="mt-2 text-xs text-luwi-texto">
              <strong className="text-luwi-medio">{f?.evaluaciones?.resultados?.aprobados ?? 0}</strong> aprob. ·{" "}
              <strong className="text-red-600">{f?.evaluaciones?.resultados?.reprobados ?? 0}</strong> reprob. ·{" "}
              {f?.evaluaciones?.publicadas ?? 0} publicadas
            </p>
          </Link>
        </div>
      </section>

      {/* Actividad del periodo */}
      <Panel title="Actividad del periodo" subtitle="Registros creados en la plataforma por intervalo" icon={TrendUpIcon}>
        {cargando || !porPeriodo ? (
          <div className="h-52 animate-pulse rounded-2xl bg-luwi-cristal-fondo" />
        ) : (
          <ActividadChart datos={porPeriodo.actividad} />
        )}
      </Panel>

      {/* Pendientes + estado de cursos */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div id="pendientes" className="scroll-mt-24 lg:col-span-2">
          <Panel
            title="Requiere tu atención"
            subtitle="Resuélvelos para que cada puesto tenga una ruta de formación lista"
            icon={AlertIcon}
            className="h-full"
          >
            <Pendientes pendientes={datos?.pendientes ?? []} cargando={cargando} />
          </Panel>
        </div>

        <Panel title="Estado de los cursos" subtitle="Catálogo de formación" icon={BookIcon} action={{ label: "Ver", to: "/dashboard/cursos" }}>
          <EstadoCursos datos={datos} cargando={cargando} />
        </Panel>
      </div>

      {/* Competencias + rutas + actividad */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Competencias más cubiertas" subtitle="Según los cursos del catálogo" icon={TrendUpIcon}>
          <Competencias competencias={datos?.competencias ?? []} niveles={datos?.niveles ?? []} cargando={cargando} />
        </Panel>

        <Panel title="Rutas más completas" subtitle="Por cantidad de cursos" icon={RouteIcon} action={{ label: "Ver", to: "/dashboard/rutas" }}>
          <RutasDestacadas rutas={datos?.topRutas ?? []} cargando={cargando} />
        </Panel>

        <Panel title="Actividad reciente" subtitle="Últimos registros creados" icon={ClockIcon} className="md:col-span-2 xl:col-span-1">
          <ActividadReciente recientes={datos?.recientes ?? []} cargando={cargando} />
        </Panel>
      </div>
    </div>
  );
}
