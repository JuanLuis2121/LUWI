import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import ConfirmModal from "./ConfirmModal";
import FormMessage from "./FormMessage";
import {
  ActionButton, PageHeader, TableCard, SearchBox, CountPill, TableSkeleton, EmptyState, thCls,
} from "./AdminUI";
import Checkbox from "./ui/Checkbox";
import FilterMenu, { FilterChips } from "./ui/FilterMenu";
import BulkBar from "./ui/BulkBar";
import Drawer from "./ui/Drawer";
import { DownloadIcon, TrashIcon, ExpandIcon } from "./ui/icons";
import { useToast } from "./ui/toast";
import { descargarCSV } from "../utils/exportar";

// Tiempo para deshacer una eliminación antes de enviarla al servidor
const TIEMPO_DESHACER = 6000;

// ¿El usuario está escribiendo en un campo? (para no robarle las teclas de atajo)
const escribiendo = (e) => ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable;

/**
 * Listado genérico (Empresas, Puestos...). Todo lo específico viene en `config`:
 * - title, subtitle, seccion, icon, stats(items, lookups), columns, service, searchText...
 * - filters: [{ key, label, options(items, lookups) → [{value,label}], value(item, lookups) → valor }]
 * - exportColumns: [{ label, value(item, lookups) }] y exportName
 * - titleOf(item), subtitleOf(item, lookups), quickView(item, lookups) → panel lateral
 */
export default function ModuleListPage({ config }) {
  const { service, columns, basePath } = config;
  const navigate = useNavigate();
  const toast = useToast();
  const searchRef = useRef(null);

  const [items, setItems] = useState([]);
  const [lookups, setLookups] = useState({});
  const [query, setQuery] = useState("");
  const [filtros, setFiltros] = useState({});
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [vista, setVista] = useState(null); // registro abierto en el panel lateral
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null); // array de registros a eliminar

  // ---------- Carga ----------
  useEffect(() => {
    let active = true;
    const lookupEntries = Object.entries(config.lookups || {});

    async function load() {
      try {
        const [list, ...extra] = await Promise.all([service.list(), ...lookupEntries.map(([, fn]) => fn())]);
        if (!active) return;
        setItems(list);
        setLookups(Object.fromEntries(lookupEntries.map(([k], i) => [k, extra[i]])));
      } catch {
        if (active) setError("No se pudieron cargar los datos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [config, service]);

  // ---------- Filtrado ----------
  const q = query.trim().toLowerCase();
  const definicionFiltros = config.filters ?? [];

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (q && !config.searchText(i, lookups).toLowerCase().includes(q)) return false;
        return definicionFiltros.every((f) => {
          const elegidos = filtros[f.key] ?? [];
          return elegidos.length === 0 || elegidos.includes(f.value(i, lookups));
        });
      }),
    [items, q, filtros, lookups, config, definicionFiltros]
  );

  const opcionesFiltro = (f) =>
    f.options(items, lookups).map((o) => ({ ...o, count: items.filter((i) => f.value(i, lookups) === o.value).length }));

  const chips = definicionFiltros.flatMap((f) =>
    (filtros[f.key] ?? []).map((v) => ({
      key: `${f.key}::${v}`,
      label: `${f.label}: ${f.options(items, lookups).find((o) => o.value === v)?.label ?? v}`,
    }))
  );

  const quitarChip = (clave) => {
    const [k, v] = clave.split("::");
    setFiltros((prev) => ({ ...prev, [k]: (prev[k] ?? []).filter((x) => x !== v) }));
  };

  const hayFiltros = q || chips.length > 0;
  const [one, many] = config.countWords;

  // ---------- Selección ----------
  const idsVisibles = filtered.map((i) => i.id);
  const seleccionVisible = idsVisibles.filter((id) => seleccion.has(id));
  const todos = idsVisibles.length > 0 && seleccionVisible.length === idsVisibles.length;
  const algunos = seleccionVisible.length > 0 && !todos;

  const alternarFila = (id) =>
    setSeleccion((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const alternarTodos = (marcar) => setSeleccion(marcar ? new Set(idsVisibles) : new Set());
  const seleccionados = filtered.filter((i) => seleccion.has(i.id));

  // ---------- Exportar ----------
  const exportar = (filas) => {
    if (!config.exportColumns) return;
    descargarCSV(
      config.exportName ?? many,
      config.exportColumns.map((c) => ({ label: c.label, value: (fila) => c.value(fila, lookups) })),
      filas
    );
    toast({
      variant: "success",
      title: "Exportación lista",
      description: `${filas.length} ${filas.length === 1 ? one : many} en formato CSV.`,
    });
  };

  // ---------- Eliminar con opción de deshacer ----------
  async function eliminar(registros) {
    setToDelete(null);
    setVista(null);
    const ids = new Set(registros.map((r) => r.id));
    setItems((prev) => prev.filter((i) => !ids.has(i.id)));
    setSeleccion((prev) => new Set([...prev].filter((id) => !ids.has(id))));

    const restaurar = () =>
      setItems((prev) => {
        const presentes = new Set(prev.map((i) => i.id));
        return [...prev, ...registros.filter((r) => !presentes.has(r.id))];
      });

    const texto = registros.length === 1 ? config.titleOf?.(registros[0]) ?? one : `${registros.length} ${many}`;

    toast({
      variant: "info",
      title: registros.length === 1 ? `Se eliminó “${texto}”` : `Se eliminaron ${texto}`,
      description: "Puedes deshacerlo durante unos segundos.",
      duration: TIEMPO_DESHACER,
      action: { label: "Deshacer", onClick: restaurar },
      onExpire: async () => {
        const fallidos = [];
        for (const r of registros) {
          try {
            await service.remove(r.id);
          } catch {
            fallidos.push(r);
          }
        }
        if (fallidos.length) {
          setItems((prev) => [...prev, ...fallidos]);
          toast({
            variant: "error",
            title: "No se pudo eliminar",
            description: `${fallidos.length} ${fallidos.length === 1 ? one : many} siguen en la lista. Intenta de nuevo.`,
          });
        }
      },
    });
  }

  // ---------- Atajos de teclado ----------
  const alTeclear = useCallback(
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape" && !escribiendo(e)) setSeleccion(new Set());
      if (escribiendo(e)) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.querySelector("input")?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        navigate(`${basePath}/nuevo`);
      }
    },
    [navigate, basePath]
  );

  useEffect(() => {
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [alTeclear]);

  // ---------- Piezas ----------
  const botonNuevo = (
    <ActionButton variant="primary" to={`${basePath}/nuevo`} title="Atajo: N">
      <Icon name="plus" className="h-4 w-4" />
      {config.newLabel}
    </ActionButton>
  );

  const columnasTotales = columns.length + 2;

  return (
    <div>
      <PageHeader
        icon={config.icon}
        seccion={config.seccion}
        title={config.title}
        subtitle={config.subtitle}
        stats={!loading && config.stats ? config.stats(items, lookups) : []}
        action={botonNuevo}
      />

      <div className="mb-4 space-y-2 empty:hidden">
        <FormMessage type="error">{error}</FormMessage>
      </div>

      <TableCard>
        {/* Barra de herramientas */}
        <div className="space-y-3 border-b border-luwi-linea/70 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div ref={searchRef} className="min-w-0 flex-1 basis-64">
              <SearchBox value={query} onChange={setQuery} placeholder={`${config.searchPlaceholder}  ( / )`} className="w-full max-w-md" />
            </div>
            {definicionFiltros.map((f) => (
              <FilterMenu
                key={f.key}
                label={f.label}
                options={opcionesFiltro(f)}
                value={filtros[f.key] ?? []}
                onChange={(v) => setFiltros((prev) => ({ ...prev, [f.key]: v }))}
              />
            ))}
            {config.exportColumns && (
              <ActionButton onClick={() => exportar(filtered)} disabled={!filtered.length} title="Exportar lo que ves a CSV">
                <DownloadIcon className="h-4 w-4" />
                Exportar
              </ActionButton>
            )}
            <CountPill>
              {filtered.length} {filtered.length === 1 ? one : many}
            </CountPill>
          </div>
          <FilterChips
            chips={chips}
            onRemove={quitarChip}
            onClear={() => {
              setFiltros({});
              setQuery("");
            }}
          />
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={config.icon}
            title={hayFiltros ? "Sin resultados" : `Aún no hay ${many}`}
            text={hayFiltros ? `No hay ${many} que coincidan con la búsqueda o los filtros.` : "Crea el primer registro para empezar."}
            action={
              hayFiltros ? (
                <ActionButton
                  onClick={() => {
                    setFiltros({});
                    setQuery("");
                  }}
                >
                  Limpiar filtros
                </ActionButton>
              ) : (
                botonNuevo
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-luwi-profundo">
              <thead className="bg-luwi-panel/70">
                <tr>
                  <th className="w-12 py-3 pl-6 pr-0">
                    <Checkbox checked={todos} indeterminate={algunos} onChange={alternarTodos} label="Seleccionar todos" />
                  </th>
                  {columns.map((c) => (
                    <th key={c.key} className={thCls}>
                      {c.label}
                    </th>
                  ))}
                  <th className={`${thCls} text-right`}>Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-luwi-linea/60">
                {filtered.map((item) => {
                  const marcado = seleccion.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => config.quickView && setVista(item)}
                      className={`group transition ${config.quickView ? "cursor-pointer" : ""} ${
                        marcado ? "bg-luwi-cristal-fondo/70" : "hover:bg-luwi-panel/60"
                      }`}
                    >
                      <td className="w-12 py-3.5 pl-6 pr-0">
                        <Checkbox checked={marcado} onChange={() => alternarFila(item.id)} label={`Seleccionar ${config.titleOf?.(item) ?? one}`} />
                      </td>
                      {columns.map((c) => (
                        <td key={c.key} className="px-6 py-3.5">
                          {c.render(item, lookups)}
                        </td>
                      ))}
                      <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <ActionButton size="sm" to={`${basePath}/${item.id}`} aria-label="Ver" title="Ver ficha">
                            <Icon name="eye" className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton size="sm" variant="edit" to={`${basePath}/${item.id}/editar`} aria-label="Editar" title="Editar">
                            <Icon name="pencil" className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton size="sm" variant="danger" onClick={() => setToDelete([item])} aria-label="Eliminar" title="Eliminar">
                            <Icon name="trash" className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {config.quickView && (
                <tfoot>
                  <tr>
                    <td colSpan={columnasTotales} className="px-6 py-3 text-xs text-luwi-texto/60">
                      Haz clic en una fila para verla al lado · <kbd className="font-sans font-semibold">/</kbd> buscar ·{" "}
                      <kbd className="font-sans font-semibold">N</kbd> nuevo · <kbd className="font-sans font-semibold">Esc</kbd> quitar selección
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </TableCard>

      {/* Acciones masivas */}
      <BulkBar
        count={seleccionados.length}
        onClear={() => setSeleccion(new Set())}
        actions={[
          ...(config.exportColumns ? [{ key: "exportar", label: "Exportar", icon: DownloadIcon, onClick: () => exportar(seleccionados) }] : []),
          { key: "eliminar", label: "Eliminar", icon: TrashIcon, danger: true, onClick: () => setToDelete(seleccionados) },
        ]}
      />

      {/* Vista rápida */}
      {config.quickView && (
        <Drawer
          open={!!vista}
          onClose={() => setVista(null)}
          icon={config.icon}
          title={vista ? config.titleOf?.(vista) : ""}
          subtitle={vista ? config.subtitleOf?.(vista, lookups) : ""}
          footer={
            vista && (
              <>
                <ActionButton
                  variant="danger"
                  onClick={() => {
                    setToDelete([vista]);
                    setVista(null);
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                  Eliminar
                </ActionButton>
                <ActionButton to={`${basePath}/${vista.id}`}>
                  <ExpandIcon className="h-4 w-4" />
                  Abrir ficha
                </ActionButton>
                <ActionButton variant="primary" to={`${basePath}/${vista.id}/editar`}>
                  <Icon name="pencil" className="h-4 w-4" />
                  Editar
                </ActionButton>
              </>
            )
          }
        >
          {vista && config.quickView(vista, lookups)}
        </Drawer>
      )}

      <ConfirmModal
        open={!!toDelete}
        message={
          toDelete
            ? toDelete.length === 1
              ? config.deleteText(toDelete[0])
              : `¿Seguro que quieres eliminar ${toDelete.length} ${many}? Tendrás unos segundos para deshacerlo.`
            : ""
        }
        loading={false}
        onConfirm={() => eliminar(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
