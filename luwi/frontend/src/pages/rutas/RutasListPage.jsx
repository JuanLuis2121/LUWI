import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import {
  ActionButton, Badge, Bubble, PageHeader, TableCard, SearchBox, CountPill, TableSkeleton, EmptyState, thCls,
} from "../../components/AdminUI";
import { RouteIcon, ClockIcon } from "../../components/dashboard/icons";
import MapaRutas from "../../components/rutas/MapaRutas";
import RutaDestacada from "../../components/rutas/RutaDestacada";
import MezclaNiveles from "../../components/rutas/MezclaNiveles";
import Checkbox from "../../components/ui/Checkbox";
import FilterMenu, { FilterChips } from "../../components/ui/FilterMenu";
import BulkBar from "../../components/ui/BulkBar";
import Drawer from "../../components/ui/Drawer";
import ViewSwitcher, { useVistaGuardada } from "../../components/ui/ViewSwitcher";
import { DownloadIcon, TrashIcon, ExpandIcon } from "../../components/ui/icons";
import { useToast } from "../../components/ui/toast";
import useAtajosListado from "../../hooks/useAtajosListado";
import { descargarCSV } from "../../utils/exportar";
import { NIVELES, nivelDe, formatoHoras } from "../../utils/rutas";
import { rutasService } from "../../services/rutasService";
import { errMsg } from "../../services/api";

const TIEMPO_DESHACER = 6000;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const COLUMNAS_CSV = [
  { label: "Ruta", value: (r) => r.nombre },
  { label: "Puesto", value: (r) => r.puestoTitulo },
  { label: "Empresa", value: (r) => r.empresaNombre },
  { label: "Cursos", value: (r) => r.cursos.length },
  { label: "Horas", value: (r) => r.duracionTotalHoras },
  { label: "Orden de cursos", value: (r) => r.cursos.map((c) => c.titulo).join(" → ") },
];

// ---------- Piezas visuales ----------

/** Mini roadmap: un punto por curso, coloreado por nivel y unido por una línea. */
function MiniRoadmap({ cursos, max = 10 }) {
  if (!cursos.length) return <span className="text-xs font-medium text-amber-600">Sin cursos</span>;
  const visibles = cursos.slice(0, max);
  const resto = cursos.length - visibles.length;
  return (
    <div className="flex items-center" aria-label={`${cursos.length} cursos: ${cursos.map((c) => c.titulo).join(", ")}`}>
      {visibles.map((c, i) => (
        <span key={c.id} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="h-0.5 w-3 bg-luwi-linea" />}
          <span title={`${i + 1}. ${c.titulo} (${nivelDe(c).label})`} className={`h-3 w-3 rounded-full ring-2 ring-white ${nivelDe(c).punto}`} />
        </span>
      ))}
      {resto > 0 && <span className="ml-1.5 text-[11px] font-semibold text-luwi-texto/70">+{resto}</span>}
    </div>
  );
}

function LeyendaNiveles() {
  return (
    <span className="hidden items-center gap-3 text-[11px] text-luwi-texto/70 md:flex">
      {Object.values(NIVELES).map((n) => (
        <span key={n.label} className="inline-flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${n.punto}`} />
          {n.label}
        </span>
      ))}
    </span>
  );
}

// ---------- Pantalla ----------

export default function RutasListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const buscarRef = useRef(null);

  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [empresas, setEmpresas] = useState([]);
  const [estadoCursos, setEstadoCursos] = useState([]);
  const [vista, setVista] = useVistaGuardada("rutas", "mapa", ["mapa", "tabla"]);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [abierta, setAbierta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [duplicando, setDuplicando] = useState(null);

  const cargar = useCallback(
    () =>
      rutasService
        .list()
        .then(setItems)
        .catch((e) => toast({ variant: "error", title: "No se pudieron cargar las rutas", description: errMsg(e) }))
        .finally(() => setLoading(false)),
    [toast]
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Mensaje que llega desde el formulario (ej. "Ruta creada correctamente")
  useEffect(() => {
    if (location.state?.message) {
      toast({ variant: "success", title: location.state.message });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, toast]);

  const irANueva = useCallback(() => navigate("/dashboard/rutas/nuevo"), [navigate]);
  const limpiarSeleccion = useCallback(() => setSeleccion(new Set()), []);
  useAtajosListado({ buscarRef, onNuevo: irANueva, onEscape: limpiarSeleccion });

  // ---------- Filtros ----------
  const q = query.trim().toLowerCase();
  const opcionesEmpresa = useMemo(
    () =>
      [...new Set(items.map((r) => r.empresaNombre).filter(Boolean))]
        .sort()
        .map((e) => ({ value: e, label: e, count: items.filter((r) => r.empresaNombre === e).length })),
    [items]
  );
  const opcionesCursos = [
    { value: "con", label: "Con cursos", count: items.filter((r) => r.cursos.length > 0).length },
    { value: "sin", label: "Sin cursos", count: items.filter((r) => r.cursos.length === 0).length },
  ];

  const filtered = items.filter(
    (r) =>
      (!q || `${r.nombre} ${r.puestoTitulo} ${r.empresaNombre}`.toLowerCase().includes(q)) &&
      (empresas.length === 0 || empresas.includes(r.empresaNombre)) &&
      (estadoCursos.length === 0 || estadoCursos.includes(r.cursos.length ? "con" : "sin"))
  );

  const chips = [
    ...empresas.map((e) => ({ key: `empresa::${e}`, label: `Empresa: ${e}` })),
    ...estadoCursos.map((v) => ({ key: `cursos::${v}`, label: v === "con" ? "Con cursos" : "Sin cursos" })),
  ];
  const quitarChip = (clave) => {
    const [tipo, v] = clave.split("::");
    if (tipo === "empresa") setEmpresas((p) => p.filter((x) => x !== v));
    else setEstadoCursos((p) => p.filter((x) => x !== v));
  };
  const limpiarTodo = () => {
    setEmpresas([]);
    setEstadoCursos([]);
    setQuery("");
  };
  const hayFiltros = q || chips.length > 0;

  const horasTotales = items.reduce((a, r) => a + (Number(r.duracionTotalHoras) || 0), 0);
  const puestosCubiertos = new Set(items.map((r) => r.puestoId).filter(Boolean)).size;
  const promedio = items.length ? Math.round((items.reduce((a, r) => a + r.cursos.length, 0) / items.length) * 10) / 10 : 0;

  // ---------- Selección ----------
  const ids = filtered.map((r) => r.id);
  const marcados = ids.filter((id) => seleccion.has(id));
  const todos = ids.length > 0 && marcados.length === ids.length;
  const seleccionadas = filtered.filter((r) => seleccion.has(r.id));
  const alternar = (id) =>
    setSeleccion((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // ---------- Acciones ----------
  const exportar = (lista) => {
    descargarCSV("rutas-luwi", COLUMNAS_CSV, lista);
    toast({ variant: "success", title: "Exportación lista", description: `${plural(lista.length, "ruta", "rutas")} en formato CSV.` });
  };

  async function duplicar(ruta) {
    setDuplicando(ruta.id);
    try {
      await rutasService.create({
        nombre: `${ruta.nombre} (copia)`.slice(0, 120),
        descripcion: ruta.descripcion || `Copia de ${ruta.nombre}`,
        puestoId: ruta.puestoId,
        cursoIds: ruta.cursos.map((c) => c.id),
      });
      toast({ variant: "success", title: `Se duplicó “${ruta.nombre}”`, description: "La copia aparece en la lista con “(copia)” al final." });
      setAbierta(null);
      await cargar();
    } catch (e) {
      toast({ variant: "error", title: "No se pudo duplicar", description: errMsg(e, "Revisa que sus cursos sigan publicados."), duration: 8000 });
    } finally {
      setDuplicando(null);
    }
  }

  function eliminar(lista) {
    setToDelete(null);
    setAbierta(null);
    const idsBorrar = new Set(lista.map((r) => r.id));
    setItems((prev) => prev.filter((r) => !idsBorrar.has(r.id)));
    setSeleccion((prev) => new Set([...prev].filter((id) => !idsBorrar.has(id))));

    toast({
      variant: "info",
      title: lista.length === 1 ? `Se eliminó “${lista.at(0).nombre}”` : `Se eliminaron ${lista.length} rutas`,
      description: "Puedes deshacerlo durante unos segundos.",
      duration: TIEMPO_DESHACER,
      action: {
        label: "Deshacer",
        onClick: () =>
          setItems((prev) => {
            const presentes = new Set(prev.map((r) => r.id));
            return [...prev, ...lista.filter((r) => !presentes.has(r.id))];
          }),
      },
      onExpire: async () => {
        const fallidas = [];
        for (const r of lista) {
          try {
            await rutasService.remove(r.id);
          } catch {
            fallidas.push(r);
          }
        }
        if (fallidas.length) {
          setItems((prev) => [...prev, ...fallidas]);
          toast({ variant: "error", title: "No se pudo eliminar", description: `${plural(fallidas.length, "ruta sigue", "rutas siguen")} en la lista.` });
        }
      },
    });
  }

  const botonNuevo = (
    <ActionButton variant="primary" to="/dashboard/rutas/nuevo" title="Atajo: N">
      <Icon name="plus" className="h-4 w-4" />
      Nueva ruta
    </ActionButton>
  );

  const accionesFila = (r) => (
    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <ActionButton size="sm" to={`/dashboard/rutas/${r.id}`} aria-label="Ver roadmap" title="Ver roadmap">
        <Icon name="eye" className="h-4 w-4" />
      </ActionButton>
      <ActionButton size="sm" variant="edit" to={`/dashboard/rutas/${r.id}/editar`} aria-label="Editar" title="Editar">
        <Icon name="pencil" className="h-4 w-4" />
      </ActionButton>
      <ActionButton size="sm" variant="danger" onClick={() => setToDelete([r])} aria-label="Eliminar" title="Eliminar">
        <Icon name="trash" className="h-4 w-4" />
      </ActionButton>
    </div>
  );

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
                onChange={(si) => setSeleccion(si ? new Set(ids) : new Set())}
                label="Seleccionar todas"
              />
            </th>
            <th className={thCls}>Ruta</th>
            <th className={thCls}>Puesto</th>
            <th className={thCls}>Camino</th>
            <th className={thCls}>Duración</th>
            <th className={`${thCls} text-right`}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-luwi-linea/60">
          {filtered.map((r) => {
            const marcado = seleccion.has(r.id);
            return (
              <tr key={r.id} onClick={() => setAbierta(r)} className={`cursor-pointer transition ${marcado ? "bg-luwi-cristal-fondo/70" : "hover:bg-luwi-panel/60"}`}>
                <td className="w-12 py-3.5 pl-6 pr-0">
                  <Checkbox checked={marcado} onChange={() => alternar(r.id)} label={`Seleccionar ${r.nombre}`} />
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <Bubble>
                      <Icon name="route" className="h-4 w-4" />
                    </Bubble>
                    <div className="min-w-0">
                      <p className="max-w-[240px] truncate font-semibold" title={r.nombre}>
                        {r.nombre || "Sin nombre"}
                      </p>
                      {r.descripcion && (
                        <p className="max-w-[240px] truncate text-xs text-luwi-texto/75" title={r.descripcion}>
                          {r.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex max-w-[240px] flex-col items-start gap-1">
                    <Badge>{r.puestoTitulo || "—"}</Badge>
                    {r.empresaNombre && <span className="truncate text-xs text-luwi-texto/75">{r.empresaNombre}</span>}
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <MiniRoadmap cursos={r.cursos} max={8} />
                  {r.cursos.length > 0 && <p className="mt-1 text-[11px] text-luwi-texto/60">{plural(r.cursos.length, "curso", "cursos")}</p>}
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <ClockIcon className="h-4 w-4 text-luwi-texto/60" />
                    {formatoHoras(r.duracionTotalHoras)}
                  </span>
                </td>
                <td className="px-6 py-3.5">{accionesFila(r)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const vistaMapa = (
    <MapaRutas rutas={filtered} seleccion={seleccion} onSeleccionar={alternar} onAbrir={setAbierta} onEliminar={(r) => setToDelete([r])} />
  );

  // Rutas del carrusel: las más completas primero
  const destacadas = useMemo(
    () =>
      [...items]
        .filter((r) => r.cursos.length > 0)
        .sort((a, b) => b.cursos.length - a.cursos.length || (b.duracionTotalHoras ?? 0) - (a.duracionTotalHoras ?? 0))
        .slice(0, 5),
    [items]
  );

  const tablaRef = useRef(null);
  const verSinCursos = () => {
    setEstadoCursos(["sin"]);
    tablaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <PageHeader
        icon={RouteIcon}
        seccion="Formación"
        title="Rutas de aprendizaje"
        subtitle="Administra las rutas de capacitación de cada puesto."
        stats={
          loading
            ? []
            : [
                { label: "Rutas creadas", value: items.length },
                { label: "Puestos cubiertos", value: puestosCubiertos },
                { label: "Horas de formación", value: `${horasTotales.toLocaleString("es-DO")} h` },
                { label: "Cursos por ruta", value: promedio },
              ]
        }
        action={botonNuevo}
      />

      {!loading && items.length > 0 && (
        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {destacadas.length > 0 ? (
            <RutaDestacada rutas={destacadas} onAbrir={setAbierta} />
          ) : (
            <div className="rounded-[28px] bg-luwi-panel p-6 text-sm text-luwi-texto">Agrega cursos a tus rutas para verlas aquí como un camino.</div>
          )}
          <MezclaNiveles rutas={items} onFiltrarSinCursos={verSinCursos} />
        </div>
      )}

      <div ref={tablaRef} className="scroll-mt-24">
      <TableCard>
        <div className="space-y-3 border-b border-luwi-linea/70 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div ref={buscarRef} className="min-w-0 flex-1 basis-56">
              <SearchBox value={query} onChange={setQuery} placeholder="Buscar por nombre, puesto o empresa  ( / )" className="w-full" />
            </div>
            <FilterMenu label="Empresa" options={opcionesEmpresa} value={empresas} onChange={setEmpresas} />
            <FilterMenu label="Contenido" options={opcionesCursos} value={estadoCursos} onChange={setEstadoCursos} />
            <ViewSwitcher value={vista} onChange={setVista} opciones={["mapa", "tabla"]} />
            <ActionButton onClick={() => exportar(filtered)} disabled={!filtered.length} title="Exportar lo que ves a CSV">
              <DownloadIcon className="h-4 w-4" />
              Exportar
            </ActionButton>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterChips chips={chips} onRemove={quitarChip} onClear={limpiarTodo} />
            <div className="ml-auto flex items-center gap-4">
              <LeyendaNiveles />
              <CountPill>{plural(filtered.length, "ruta", "rutas")}</CountPill>
            </div>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={RouteIcon}
            title={hayFiltros ? "Sin resultados" : "Aún no hay rutas de aprendizaje"}
            text={hayFiltros ? "No hay rutas que coincidan con la búsqueda o los filtros." : "Crea una ruta y ordena los cursos que necesita cada puesto."}
            action={hayFiltros ? <ActionButton onClick={limpiarTodo}>Limpiar filtros</ActionButton> : botonNuevo}
          />
        ) : vista === "mapa" ? (
          vistaMapa
        ) : (
          vistaTabla
        )}

        {!loading && filtered.length > 0 && (
          <p className="border-t border-luwi-linea/60 px-6 py-3 text-xs text-luwi-texto/60">
            Haz clic en una ruta para verla al lado · <kbd className="font-sans font-semibold">/</kbd> buscar ·{" "}
            <kbd className="font-sans font-semibold">N</kbd> nueva · <kbd className="font-sans font-semibold">Esc</kbd> quitar selección
          </p>
        )}
      </TableCard>
      </div>

      <BulkBar
        count={seleccionadas.length}
        onClear={limpiarSeleccion}
        actions={[
          { key: "exportar", label: "Exportar", icon: DownloadIcon, onClick: () => exportar(seleccionadas) },
          { key: "eliminar", label: "Eliminar", icon: TrashIcon, danger: true, onClick: () => setToDelete(seleccionadas) },
        ]}
      />

      {/* Vista rápida con el camino de la ruta */}
      <Drawer
        open={!!abierta}
        onClose={() => setAbierta(null)}
        icon={RouteIcon}
        title={abierta?.nombre}
        subtitle={abierta ? [abierta.puestoTitulo, abierta.empresaNombre].filter(Boolean).join(" · ") : ""}
        footer={
          abierta && (
            <>
              <ActionButton onClick={() => duplicar(abierta)} disabled={duplicando === abierta.id}>
                <Icon name="layers" className="h-4 w-4" />
                {duplicando === abierta.id ? "Duplicando…" : "Duplicar"}
              </ActionButton>
              <ActionButton to={`/dashboard/rutas/${abierta.id}`}>
                <ExpandIcon className="h-4 w-4" />
                Roadmap
              </ActionButton>
              <ActionButton variant="primary" to={`/dashboard/rutas/${abierta.id}/editar`}>
                <Icon name="pencil" className="h-4 w-4" />
                Editar
              </ActionButton>
            </>
          )
        }
      >
        {abierta && (
          <>
            {abierta.descripcion && <p className="mb-5 whitespace-pre-line text-sm text-luwi-texto">{abierta.descripcion}</p>}

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-luwi-panel px-4 py-3">
                <p className="text-[11px] text-luwi-texto/75">Cursos</p>
                <p className="text-xl font-bold text-luwi-profundo">{abierta.cursos.length}</p>
              </div>
              <div className="rounded-2xl bg-luwi-panel px-4 py-3">
                <p className="text-[11px] text-luwi-texto/75">Duración total</p>
                <p className="text-xl font-bold text-luwi-profundo">{formatoHoras(abierta.duracionTotalHoras)}</p>
              </div>
            </div>

            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-luwi-texto/60">Camino de la ruta</p>
            {abierta.cursos.length === 0 ? (
              <p className="rounded-xl bg-amber-50 px-4 py-5 text-center text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
                Esta ruta no tiene cursos. Edítala para agregarlos.
              </p>
            ) : (
              <ol className="relative">
                {abierta.cursos.map((c, i) => {
                  const ultimo = i === abierta.cursos.length - 1;
                  return (
                    <li key={c.id} className="relative flex gap-3 pb-4 last:pb-0">
                      {!ultimo && <span aria-hidden="true" className="absolute left-[15px] top-9 h-[calc(100%-28px)] w-0.5 rounded-full bg-luwi-linea" />}
                      <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white ${nivelDe(c).nodo}`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-semibold leading-snug text-luwi-profundo">{c.titulo}</p>
                        <p className="text-xs text-luwi-texto/70">
                          {nivelDe(c).label}
                          {c.duracionHoras ? ` · ${formatoHoras(c.duracionHoras)}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <button
              type="button"
              onClick={() => {
                setToDelete([abierta]);
                setAbierta(null);
              }}
              className="mt-6 text-xs font-semibold text-red-500 hover:text-red-600 hover:underline"
            >
              Eliminar esta ruta
            </button>
          </>
        )}
      </Drawer>

      <ConfirmModal
        open={!!toDelete}
        message={
          toDelete
            ? toDelete.length === 1
              ? `¿Seguro que quieres eliminar la ruta "${toDelete.at(0).nombre}"? Tendrás unos segundos para deshacerlo.`
              : `¿Seguro que quieres eliminar ${toDelete.length} rutas? Tendrás unos segundos para deshacerlo.`
            : ""
        }
        loading={false}
        onConfirm={() => eliminar(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
