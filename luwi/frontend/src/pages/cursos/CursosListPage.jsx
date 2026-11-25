import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import {
  ActionButton, Badge, Bubble, PageHeader, TableCard, SearchBox, CountPill, TableSkeleton, EmptyState, thCls,
} from "../../components/AdminUI";
import { BookIcon, ClockIcon, RouteIcon } from "../../components/dashboard/icons";
import { EstadoCursoBadge, formatoHoras } from "../../components/cursos/EstadoCurso";
import Checkbox from "../../components/ui/Checkbox";
import FilterMenu, { FilterChips } from "../../components/ui/FilterMenu";
import BulkBar from "../../components/ui/BulkBar";
import Drawer, { DrawerField } from "../../components/ui/Drawer";
import ViewSwitcher, { useVistaGuardada } from "../../components/ui/ViewSwitcher";
import { DownloadIcon, ExpandIcon } from "../../components/ui/icons";
import { useToast } from "../../components/ui/toast";
import useAtajosListado from "../../hooks/useAtajosListado";
import { descargarCSV } from "../../utils/exportar";
import { NIVELES as NIVELES_RUTA, nivelDe } from "../../utils/rutas";
import { getCursos, publicarCurso, desactivarCurso, eliminarCurso } from "../../services/cursosService";

// ---------- Configuración ----------

const FILTROS_ESTADO = [
  { value: "", label: "Todos" },
  { value: "PUBLICADO", label: "Publicados" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "INACTIVO", label: "Inactivos" },
];

const COLUMNAS_KANBAN = [
  { estado: "BORRADOR", titulo: "Borrador", ayuda: "En preparación", punto: "bg-amber-500" },
  { estado: "PUBLICADO", titulo: "Publicado", ayuda: "Disponible para rutas", punto: "bg-luwi-medio" },
  { estado: "INACTIVO", titulo: "Inactivo", ayuda: "Ya no se agrega a rutas", punto: "bg-luwi-texto/50" },
];

const OPCIONES_NIVEL = Object.entries(NIVELES_RUTA).map(([value, n]) => ({ value, label: n.label }));
const OPCIONES_ALCANCE = [
  { value: "GLOBAL", label: "Global" },
  { value: "EMPRESA", label: "De una empresa" },
];

const estadoDe = (c) => c.estado ?? "BORRADOR";
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const COLUMNAS_CSV = [
  { label: "Título", value: (c) => c.titulo },
  { label: "Estado", value: (c) => estadoDe(c) },
  { label: "Nivel", value: (c) => c.nivel },
  { label: "Competencia", value: (c) => c.competencia },
  { label: "Horas", value: (c) => c.duracionHoras },
  { label: "Unidades", value: (c) => c.totalUnidades ?? 0 },
  { label: "Alcance", value: (c) => (c.alcance === "GLOBAL" ? "Global" : "Empresa") },
  { label: "Rutas", value: (c) => (c.rutas ?? []).length },
];

// ---------- Piezas visuales ----------

/** Portada enriquecida estilo LUWI 2.0 (Colonial Cobalt + píldora de duración flotante). */
function Portada({ curso, alto = "h-44" }) {
  const n = nivelDe(curso);
  const gradientes = {
    básico: "from-[#18207A] via-[#3742B8] to-[#BFA06E]",
    intermedio: "from-[#101654] via-[#242EC0] to-[#C9A875]",
    avanzado: "from-[#0E1348] via-[#4A4E99] to-[#D1B17C]",
  };
  const grad = gradientes[curso.nivel] ?? "from-[#111652] via-[#222BB8] to-[#D1B17C]";

  return (
    <div className={`relative ${alto} overflow-hidden rounded-[14px] bg-gradient-to-br ${grad}`}>
      <div aria-hidden="true" className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-luwi-antique/25 blur-2xl" />
      <div aria-hidden="true" className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full border-[18px] border-white/10" />

      {/* Píldora flotante de duración (estilo EduAll / LUWI 2.0) */}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-colonial-btn px-3 py-1 text-[11.5px] font-bold text-white shadow-[0_8px_18px_-6px_rgba(17,22,82,0.55)] ring-1 ring-white/20">
        <ClockIcon className="h-3.5 w-3.5" />
        {formatoHoras(curso.duracionHoras)}
      </span>

      {/* Nivel en esquina superior derecha */}
      <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-luwi-profundo shadow-sm">
        {n.label}
      </span>

      {/* Monograma sutil editorial */}
      <div className="absolute inset-x-4 bottom-3.5 flex items-end justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-xl font-extrabold text-luwi-antique backdrop-blur-md ring-1 ring-white/25">
          {(curso.titulo ?? "?").charAt(0).toUpperCase()}
        </span>
        {curso.alcance === "GLOBAL" && (
          <span className="rounded-full bg-luwi-antique/90 px-2.5 py-0.5 text-[10.5px] font-bold text-luwi-profundo">
            Global
          </span>
        )}
      </div>
    </div>
  );
}

function DatosCurso({ curso }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-luwi-texto/80">
      <span className="inline-flex items-center gap-1">
        <ClockIcon className="h-3.5 w-3.5" />
        {formatoHoras(curso.duracionHoras)}
      </span>
      <span>{plural(curso.totalUnidades ?? 0, "unidad", "unidades")}</span>
      {(curso.rutas ?? []).length > 0 && (
        <span className="inline-flex items-center gap-1">
          <RouteIcon className="h-3.5 w-3.5" />
          {plural(curso.rutas.length, "ruta", "rutas")}
        </span>
      )}
    </p>
  );
}

function SelloGlobal() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-luwi-tecno/10 px-2 py-0.5 text-[11px] font-semibold text-luwi-medio">
      <span className="h-1.5 w-1.5 rounded-full bg-luwi-tecno" />
      Curso global
    </span>
  );
}

// ---------- Pantalla ----------

export default function CursosListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const buscarRef = useRef(null);

  const [cursos, setCursos] = useState([]);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [niveles, setNiveles] = useState([]);
  const [alcances, setAlcances] = useState([]);
  const [vista, setVista] = useVistaGuardada("cursos", "tarjetas", ["tarjetas", "tabla", "kanban"]);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [abierto, setAbierto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ocupado, setOcupado] = useState(() => new Set());
  const [aDesactivar, setADesactivar] = useState(null); // array de cursos
  const [aEliminar, setAEliminar] = useState(null);
  const [sobreColumna, setSobreColumna] = useState(null);

  // ---------- Carga ----------
  useEffect(() => {
    let active = true;
    getCursos()
      .then((data) => active && setCursos(data))
      .catch((e) => active && toast({ variant: "error", title: "No se pudieron cargar los cursos", description: e.message }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [toast]);

  // Mensaje que llega desde el formulario (ej. "Curso creado")
  useEffect(() => {
    if (location.state?.message) {
      toast({ variant: "success", title: location.state.message });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, toast]);

  // ---------- Atajos ----------
  const irANuevo = useCallback(() => navigate("/dashboard/cursos/nuevo"), [navigate]);
  const limpiarSeleccion = useCallback(() => setSeleccion(new Set()), []);
  useAtajosListado({ buscarRef, onNuevo: irANuevo, onEscape: limpiarSeleccion });

  // ---------- Filtrado ----------
  const q = query.trim().toLowerCase();
  const pasaFiltros = useCallback(
    (c, ignorarEstado = false) =>
      (ignorarEstado || !estado || estadoDe(c) === estado) &&
      (niveles.length === 0 || niveles.includes(c.nivel)) &&
      (alcances.length === 0 || alcances.includes(c.alcance)) &&
      (!q || `${c.titulo} ${c.descripcion} ${c.competencia} ${c.nivel}`.toLowerCase().includes(q)),
    [estado, niveles, alcances, q]
  );

  const filtrados = useMemo(() => cursos.filter((c) => pasaFiltros(c)), [cursos, pasaFiltros]);
  // En kanban se ignoran las pestañas de estado (las columnas ya separan por estado)
  const paraKanban = useMemo(() => cursos.filter((c) => pasaFiltros(c, true)), [cursos, pasaFiltros]);
  const cuenta = (valor) => (valor ? cursos.filter((c) => estadoDe(c) === valor).length : cursos.length);

  const chips = [
    ...niveles.map((n) => ({ key: `nivel::${n}`, label: `Nivel: ${NIVELES_RUTA[n]?.label ?? n}` })),
    ...alcances.map((a) => ({ key: `alcance::${a}`, label: `Alcance: ${OPCIONES_ALCANCE.find((o) => o.value === a)?.label}` })),
  ];
  const quitarChip = (clave) => {
    const [tipo, v] = clave.split("::");
    if (tipo === "nivel") setNiveles((p) => p.filter((x) => x !== v));
    else setAlcances((p) => p.filter((x) => x !== v));
  };
  const limpiarTodo = () => {
    setNiveles([]);
    setAlcances([]);
    setQuery("");
    setEstado("");
  };
  const hayFiltros = q || estado || chips.length > 0;

  const horasTotales = cursos.reduce((a, c) => a + (Number(c.duracionHoras) || 0), 0);
  const unidadesTotales = cursos.reduce((a, c) => a + (c.totalUnidades ?? 0), 0);
  const enRutas = cursos.filter((c) => (c.rutas ?? []).length > 0).length;

  // ---------- Selección ----------
  const visibles = vista === "kanban" ? paraKanban : filtrados;
  const idsVisibles = visibles.map((c) => c._id);
  const marcados = idsVisibles.filter((id) => seleccion.has(id));
  const todos = idsVisibles.length > 0 && marcados.length === idsVisibles.length;
  const seleccionados = visibles.filter((c) => seleccion.has(c._id));

  const alternar = (id) =>
    setSeleccion((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // ---------- Acciones ----------
  const reemplazar = (actualizado) =>
    setCursos((prev) => prev.map((c) => (c._id === actualizado._id ? { ...c, ...actualizado } : c)));

  const marcarOcupado = (ids, si) =>
    setOcupado((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => (si ? n.add(id) : n.delete(id)));
      return n;
    });

  /** Ejecuta una acción sobre varios cursos y resume el resultado en un aviso. */
  async function enLote(lista, accion, textos) {
    const ids = lista.map((c) => c._id);
    marcarOcupado(ids, true);
    let ok = 0;
    const errores = [];
    for (const c of lista) {
      try {
        reemplazar(await accion(c._id));
        ok += 1;
      } catch (e) {
        errores.push(`${c.titulo}: ${e.message}`);
      }
    }
    marcarOcupado(ids, false);
    if (ok) toast({ variant: "success", title: textos.ok(ok) });
    if (errores.length) toast({ variant: "error", title: textos.error(errores.length), description: errores.at(0), duration: 8000 });
  }

  const publicar = (lista) => {
    const editables = lista.filter((c) => c.editable !== false && estadoDe(c) !== "PUBLICADO");
    if (!editables.length) {
      toast({ variant: "info", title: "No hay cursos para publicar", description: "Los seleccionados ya están publicados o son de solo lectura." });
      return;
    }
    enLote(editables, publicarCurso, {
      ok: (n) => (n === 1 ? `“${editables.at(0).titulo}” quedó publicado` : `${n} cursos publicados`),
      error: (n) => `No se pudo publicar ${plural(n, "curso", "cursos")}`,
    });
  };

  const desactivar = async (lista) => {
    setADesactivar(null);
    const editables = lista.filter((c) => c.editable !== false && estadoDe(c) !== "INACTIVO");
    if (!editables.length) return;
    await enLote(editables, desactivarCurso, {
      ok: (n) => (n === 1 ? `“${editables.at(0).titulo}” quedó desactivado` : `${n} cursos desactivados`),
      error: (n) => `No se pudo desactivar ${plural(n, "curso", "cursos")}`,
    });
  };

  // El backend no deja eliminar un curso que está en alguna ruta (409 con el motivo)
  async function eliminar(curso) {
    setAEliminar(null);
    setAbierto(null);
    marcarOcupado([curso._id], true);
    try {
      await eliminarCurso(curso._id);
      setCursos((prev) => prev.filter((c) => c._id !== curso._id));
      toast({ variant: "success", title: `Se eliminó “${curso.titulo}”` });
    } catch (e) {
      toast({ variant: "error", title: "No se pudo eliminar", description: e.message, duration: 8000 });
    } finally {
      marcarOcupado([curso._id], false);
    }
  }

  const exportar = (lista) => {
    descargarCSV("cursos-luwi", COLUMNAS_CSV, lista);
    toast({ variant: "success", title: "Exportación lista", description: `${plural(lista.length, "curso", "cursos")} en formato CSV.` });
  };

  // ---------- Kanban: arrastrar entre columnas ----------
  const soltarEn = (destino, cursoId) => {
    setSobreColumna(null);
    const curso = cursos.find((c) => c._id === cursoId);
    if (!curso || estadoDe(curso) === destino) return;
    if (curso.editable === false) {
      toast({ variant: "info", title: "Curso de solo lectura", description: "No tienes permiso para cambiar su estado." });
    } else if (destino === "PUBLICADO") {
      publicar([curso]);
    } else if (destino === "INACTIVO") {
      setADesactivar([curso]);
    } else {
      toast({ variant: "info", title: "No se puede volver a borrador", description: "Un curso publicado o inactivo no regresa a borrador. Puedes editarlo o desactivarlo." });
    }
  };

  // ---------- Botones por curso ----------
  const icono = (nombre, label) => ({ "aria-label": label, title: label, children: <Icon name={nombre} className="h-4 w-4" /> });

  const acciones = (c) => {
    const est = estadoDe(c);
    const bloqueado = ocupado.has(c._id);
    if (c.editable === false) {
      return (
        <>
          <span className="text-xs text-luwi-texto/70">Solo lectura</span>
          <ActionButton size="sm" to={`/dashboard/cursos/${c._id}/unidades`} {...icono("layers", `Ver unidades de ${c.titulo}`)} />
        </>
      );
    }
    return (
      <>
        {est !== "PUBLICADO" && (
          <ActionButton size="sm" variant="edit" disabled={bloqueado} onClick={() => publicar([c])} {...icono("send", `Publicar ${c.titulo}`)} />
        )}
        <ActionButton size="sm" variant="edit" to={`/dashboard/cursos/${c._id}/editar`} {...icono("pencil", `Editar ${c.titulo}`)} />
        <ActionButton size="sm" to={`/dashboard/cursos/${c._id}/unidades`} {...icono("layers", `Gestionar unidades de ${c.titulo}`)} />
        {est !== "INACTIVO" && (
          <ActionButton size="sm" variant="danger" disabled={bloqueado} onClick={() => setADesactivar([c])} {...icono("ban", `Desactivar ${c.titulo}`)} />
        )}
        <ActionButton size="sm" variant="danger" disabled={bloqueado} onClick={() => setAEliminar(c)} {...icono("trash", `Eliminar ${c.titulo}`)} />
      </>
    );
  };

  const botonNuevo = (
    <ActionButton variant="fawn" to="/dashboard/cursos/nuevo" title="Atajo: N">
      <Icon name="plus" className="h-4 w-4" />
      Nuevo curso
    </ActionButton>
  );

  // Acceso rápido del dashboard: /dashboard/cursos?nuevo=1
  if (searchParams.get("nuevo") === "1") {
    return <Navigate to="/dashboard/cursos/nuevo" replace />;
  }

  // ---------- Vistas ----------

  const vistaTabla = (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-luwi-profundo">
        <thead className="bg-luwi-panel/70">
          <tr>
            <th className="w-12 py-3 pl-6 pr-0">
              <Checkbox
                checked={todos}
                indeterminate={marcados.length > 0 && !todos}
                onChange={(si) => setSeleccion(si ? new Set(idsVisibles) : new Set())}
                label="Seleccionar todos"
              />
            </th>
            <th className={thCls}>Curso</th>
            <th className={`${thCls} px-4`}>Detalles</th>
            <th className={`${thCls} px-4`}>Estado</th>
            <th className={`${thCls} px-4 text-right`}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-luwi-linea/60">
          {filtrados.map((c) => {
            const marcado = seleccion.has(c._id);
            return (
              <tr
                key={c._id}
                onClick={() => setAbierto(c)}
                className={`cursor-pointer align-top transition ${marcado ? "bg-luwi-cristal-fondo/70" : "hover:bg-luwi-panel/60"}`}
              >
                <td className="w-12 py-4 pl-6 pr-0">
                  <Checkbox checked={marcado} onChange={() => alternar(c._id)} label={`Seleccionar ${c.titulo}`} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex min-w-[220px] items-start gap-3">
                    <Bubble>
                      <Icon name="book" className="h-4 w-4" />
                    </Bubble>
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-luwi-profundo">{c.titulo}</p>
                      <p className="mt-0.5 line-clamp-2 max-w-[360px] break-words text-xs text-luwi-texto/80">{c.descripcion}</p>
                      {c.alcance === "GLOBAL" && (
                        <div className="mt-1.5">
                          <SelloGlobal />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1 whitespace-nowrap text-xs">
                    <span className="capitalize">
                      <Badge>{c.nivel}</Badge>
                    </span>
                    <p className="font-medium text-luwi-profundo">{formatoHoras(c.duracionHoras)}</p>
                    <p className="text-luwi-texto/80">{plural(c.totalUnidades ?? 0, "unidad", "unidades")}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <EstadoCursoBadge estado={estadoDe(c)} />
                </td>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">{acciones(c)}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const vistaTarjetas = (
    <ul className="grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-3">
      {filtrados.map((c, idx) => {
        const marcado = seleccion.has(c._id);
        const warmTag = idx % 2 === 1;
        return (
          <li
            key={c._id}
            onClick={() => setAbierto(c)}
            className={`group flex cursor-pointer flex-col overflow-hidden rounded-[22px] border bg-white p-3.5 shadow-[0_10px_28px_-14px_rgba(17,22,82,0.14)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_38px_-16px_rgba(17,22,82,0.22)] ${
              marcado ? "border-luwi-medio ring-2 ring-luwi-medio/30" : "border-luwi-linea"
            }`}
          >
            <div className="relative">
              <Portada curso={c} alto="h-44" />
              <div
                className="absolute bottom-3 right-3 rounded-lg bg-white/95 p-1 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox checked={marcado} onChange={() => alternar(c._id)} label={`Seleccionar ${c.titulo}`} />
              </div>
            </div>

            <div className="flex flex-1 flex-col px-1.5 pb-1 pt-4">
              {/* Tag de competencia */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-block max-w-[75%] truncate rounded-lg px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] ${
                    warmTag ? "bg-luwi-antique text-luwi-fawn-deep" : "bg-luwi-cristal text-luwi-medio"
                  }`}
                >
                  {c.competencia || "Formación"}
                </span>
                <EstadoCursoBadge estado={estadoDe(c)} />
              </div>

              {/* Título */}
              <h3 className="mt-2.5 line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.015em] text-luwi-profundo transition-colors group-hover:text-luwi-medio">
                {c.titulo}
              </h3>

              {c.descripcion && (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-luwi-texto/80">{c.descripcion}</p>
              )}

              {/* Metadatos fila 1: Unidades y Nivel */}
              <div className="mt-4 flex items-center justify-between gap-2 text-xs font-medium text-luwi-texto">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="layers" className="h-3.5 w-3.5 text-luwi-medio" />
                  {plural(c.totalUnidades ?? 0, "unidad", "unidades")}
                </span>
                <span className="inline-flex items-center gap-1.5 capitalize">
                  <RouteIcon className="h-3.5 w-3.5 text-luwi-fawn-deep" />
                  {plural((c.rutas ?? []).length, "ruta", "rutas")}
                </span>
              </div>

              {/* Separador cálido + acciones */}
              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-luwi-linea pt-3.5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap gap-1.5">{acciones(c)}</div>
                <Link
                  to={`/dashboard/cursos/${c._id}/unidades`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-luwi-medio transition hover:text-luwi-profundo"
                >
                  Ver curso →
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  const vistaKanban = (
    <div className="grid gap-4 p-5 lg:grid-cols-3">
      {COLUMNAS_KANBAN.map((col) => {
        const lista = paraKanban.filter((c) => estadoDe(c) === col.estado);
        const activa = sobreColumna === col.estado;
        return (
          <section
            key={col.estado}
            aria-label={col.titulo}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("text/curso-id")) {
                e.preventDefault();
                setSobreColumna(col.estado);
              }
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setSobreColumna(null)}
            onDrop={(e) => {
              e.preventDefault();
              soltarEn(col.estado, e.dataTransfer.getData("text/curso-id"));
            }}
            className={`flex min-h-[320px] flex-col rounded-[22px] p-3 transition ${
              activa ? "bg-luwi-tecno/10 outline-2 outline-dashed outline-luwi-tecno/50" : "bg-luwi-panel"
            }`}
          >
            <header className="mb-3 flex items-center justify-between px-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.punto}`} />
                <h3 className="text-sm font-semibold text-luwi-profundo">{col.titulo}</h3>
                <span className="rounded-md bg-white px-1.5 text-xs font-semibold text-luwi-texto ring-1 ring-luwi-linea">{lista.length}</span>
              </div>
              <span className="text-[11px] text-luwi-texto/60">{col.ayuda}</span>
            </header>
            <ul className="flex-1 space-y-2.5">
              {lista.length === 0 && (
                <li className="rounded-2xl border-2 border-dashed border-luwi-linea px-4 py-8 text-center text-xs text-luwi-texto/60">
                  Arrastra un curso aquí
                </li>
              )}
              {lista.map((c) => (
                <li
                  key={c._id}
                  draggable={c.editable !== false && !ocupado.has(c._id)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/curso-id", c._id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => setAbierto(c)}
                  className={`group relative cursor-grab overflow-hidden rounded-2xl border bg-white p-3.5 pl-4 shadow-[0_6px_16px_-12px_rgba(17,22,82,0.5)] transition hover:border-luwi-tecno/40 active:cursor-grabbing ${
                    ocupado.has(c._id) ? "opacity-60" : ""
                  } ${seleccion.has(c._id) ? "border-luwi-tecno ring-2 ring-luwi-tecno/25" : "border-luwi-linea/80"}`}
                >
                  <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${nivelDe(c).punto}`} />
                  <div className="flex items-start gap-2.5">
                    <Checkbox checked={seleccion.has(c._id)} onChange={() => alternar(c._id)} label={`Seleccionar ${c.titulo}`} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-luwi-profundo">{c.titulo}</p>
                      <p className="mt-0.5 text-[11.5px] capitalize text-luwi-texto/70">
                        {c.nivel}
                        {c.competencia ? ` · ${c.competencia}` : ""}
                      </p>
                      <div className="mt-2">
                        <DatosCurso curso={c} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );

  const contenido = loading ? (
    <TableSkeleton />
  ) : visibles.length === 0 ? (
    <EmptyState
      icon={BookIcon}
      title={hayFiltros ? "Sin resultados" : "Aún no hay cursos"}
      text={hayFiltros ? "No hay cursos que coincidan con la búsqueda o los filtros." : "Crea el primer curso y agrégale unidades."}
      action={hayFiltros ? <ActionButton onClick={limpiarTodo}>Limpiar filtros</ActionButton> : botonNuevo}
    />
  ) : vista === "tarjetas" ? (
    vistaTarjetas
  ) : vista === "kanban" ? (
    vistaKanban
  ) : (
    vistaTabla
  );

  return (
    <div>
      <PageHeader
        icon={BookIcon}
        seccion="Formación"
        title="Cursos"
        subtitle="Prepara los cursos, sus unidades y publícalos para usarlos en las rutas."
        stats={
          loading
            ? []
            : [
                { label: "Cursos en catálogo", value: cursos.length },
                { label: "Horas de contenido", value: horasTotales.toLocaleString("es-DO") },
                { label: "Unidades creadas", value: unidadesTotales },
                { label: "Usados en rutas", value: `${enRutas} de ${cursos.length}` },
              ]
        }
        action={botonNuevo}
      />

      <TableCard>
        {/* Barra de herramientas */}
        <div className="space-y-3 border-b border-luwi-linea/70 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div ref={buscarRef} className="min-w-0 flex-1 basis-56">
              <SearchBox value={query} onChange={setQuery} placeholder="Buscar por título o competencia  ( / )" className="w-full" />
            </div>
            <FilterMenu label="Nivel" options={OPCIONES_NIVEL} value={niveles} onChange={setNiveles} />
            <FilterMenu label="Alcance" options={OPCIONES_ALCANCE} value={alcances} onChange={setAlcances} />
            <ViewSwitcher value={vista} onChange={setVista} opciones={["tabla", "tarjetas", "kanban"]} />
            <ActionButton onClick={() => exportar(visibles)} disabled={!visibles.length} title="Exportar lo que ves a CSV">
              <DownloadIcon className="h-4 w-4" />
              Exportar
            </ActionButton>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {vista !== "kanban" ? (
              <div role="tablist" aria-label="Filtrar por estado" className="flex flex-wrap gap-1 rounded-xl bg-luwi-panel p-1 ring-1 ring-inset ring-luwi-linea">
                {FILTROS_ESTADO.map((f) => {
                  const activo = estado === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      role="tab"
                      aria-selected={activo}
                      onClick={() => setEstado(f.value)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40 ${
                        activo ? "bg-white text-luwi-profundo shadow-sm" : "text-luwi-texto hover:text-luwi-profundo"
                      }`}
                    >
                      {f.label}
                      <span className={`rounded-md px-1.5 text-[10.5px] ${activo ? "bg-luwi-cristal text-luwi-medio" : "bg-white/70 text-luwi-texto/70"}`}>
                        {cuenta(f.value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-luwi-texto/70">Arrastra un curso a “Publicado” para publicarlo o a “Inactivo” para desactivarlo.</p>
            )}
            <CountPill>{plural(visibles.length, "curso", "cursos")}</CountPill>
          </div>

          <FilterChips chips={chips} onRemove={quitarChip} onClear={limpiarTodo} />
        </div>

        {contenido}

        {!loading && visibles.length > 0 && (
          <p className="border-t border-luwi-linea/60 px-6 py-3 text-xs text-luwi-texto/60">
            Haz clic en un curso para verlo al lado · <kbd className="font-sans font-semibold">/</kbd> buscar ·{" "}
            <kbd className="font-sans font-semibold">N</kbd> nuevo · <kbd className="font-sans font-semibold">Esc</kbd> quitar selección
          </p>
        )}
      </TableCard>

      {/* Acciones masivas */}
      <BulkBar
        count={seleccionados.length}
        onClear={limpiarSeleccion}
        actions={[
          { key: "publicar", label: "Publicar", icon: (p) => <Icon name="send" {...p} />, onClick: () => publicar(seleccionados) },
          { key: "exportar", label: "Exportar", icon: DownloadIcon, onClick: () => exportar(seleccionados) },
          { key: "desactivar", label: "Desactivar", icon: (p) => <Icon name="ban" {...p} />, danger: true, onClick: () => setADesactivar(seleccionados) },
        ]}
      />

      {/* Vista rápida */}
      <Drawer
        open={!!abierto}
        onClose={() => setAbierto(null)}
        icon={BookIcon}
        title={abierto?.titulo}
        subtitle={abierto ? `${NIVELES_RUTA[abierto.nivel]?.label ?? abierto.nivel} · ${formatoHoras(abierto.duracionHoras)}` : ""}
        footer={
          abierto && (
            <>
              {abierto.editable !== false && estadoDe(abierto) !== "PUBLICADO" && (
                <ActionButton
                  variant="edit"
                  onClick={() => {
                    publicar([abierto]);
                    setAbierto(null);
                  }}
                >
                  <Icon name="send" className="h-4 w-4" />
                  Publicar
                </ActionButton>
              )}
              <ActionButton to={`/dashboard/cursos/${abierto._id}/unidades`}>
                <ExpandIcon className="h-4 w-4" />
                Unidades
              </ActionButton>
              {abierto.editable !== false && (
                <ActionButton variant="primary" to={`/dashboard/cursos/${abierto._id}/editar`}>
                  <Icon name="pencil" className="h-4 w-4" />
                  Editar
                </ActionButton>
              )}
            </>
          )
        }
      >
        {abierto && (
          <>
            <div className="mb-4 overflow-hidden rounded-2xl">
              <Portada curso={abierto} alto="h-28" />
            </div>
            <dl>
              <DrawerField label="Estado">
                <EstadoCursoBadge estado={estadoDe(abierto)} />
              </DrawerField>
              <DrawerField label="Descripción">
                <span className="whitespace-pre-line">{abierto.descripcion}</span>
              </DrawerField>
              <DrawerField label="Competencia">{abierto.competencia}</DrawerField>
              <DrawerField label="Contenido">{plural(abierto.totalUnidades ?? 0, "unidad", "unidades")}</DrawerField>
              <DrawerField label="Alcance">{abierto.alcance === "GLOBAL" ? <SelloGlobal /> : "Solo para su empresa"}</DrawerField>
            </dl>
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-luwi-texto/60">Rutas que lo usan</p>
              {(abierto.rutas ?? []).length === 0 ? (
                <p className="rounded-xl bg-luwi-panel px-4 py-5 text-center text-xs text-luwi-texto/80">Todavía no está en ninguna ruta.</p>
              ) : (
                <ul className="space-y-2">
                  {abierto.rutas.map((r) => (
                    <li key={r._id}>
                      <Link
                        to={`/dashboard/rutas/${r._id}`}
                        className="flex items-center gap-3 rounded-xl border border-luwi-linea/80 px-3 py-2.5 text-sm font-medium text-luwi-profundo transition hover:border-luwi-tecno/40 hover:bg-luwi-cristal-fondo/60"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-luwi-cristal-fondo text-luwi-medio">
                          <RouteIcon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{r.nombre}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {abierto.editable !== false && (
              <button
                type="button"
                onClick={() => {
                  setAEliminar(abierto);
                  setAbierto(null);
                }}
                className="mt-6 text-xs font-semibold text-red-500 hover:text-red-600 hover:underline"
              >
                Eliminar este curso
              </button>
            )}
          </>
        )}
      </Drawer>

      <ConfirmModal
        open={!!aDesactivar}
        title={aDesactivar?.length > 1 ? `Desactivar ${aDesactivar.length} cursos` : "Desactivar curso"}
        message={
          aDesactivar
            ? aDesactivar.length === 1
              ? `¿Desactivar el curso "${aDesactivar.at(0).titulo}"? Ya no se podrá agregar a rutas nuevas. Sus unidades, las rutas donde aparece y el avance de los postulantes se conservan.`
              : `¿Desactivar ${aDesactivar.length} cursos? Ya no se podrán agregar a rutas nuevas. Sus unidades, rutas y el avance de los postulantes se conservan.`
            : ""
        }
        confirmLabel="Desactivar"
        loadingLabel="Desactivando..."
        loading={false}
        onConfirm={() => desactivar(aDesactivar)}
        onCancel={() => setADesactivar(null)}
      />

      <ConfirmModal
        open={!!aEliminar}
        title="Eliminar curso"
        message={
          aEliminar
            ? `¿Eliminar el curso "${aEliminar.titulo}" y todas sus unidades? Esta acción no se puede deshacer. Si el curso está en alguna ruta no se podrá eliminar: en ese caso desactívalo.`
            : ""
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando..."
        loading={false}
        onConfirm={() => eliminar(aEliminar)}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  );
}
