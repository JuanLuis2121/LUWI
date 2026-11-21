import { useEffect, useState } from "react";
import Icon from "./Icon";
import ConfirmModal from "./ConfirmModal";
import FormMessage from "./FormMessage";
import {
  ActionButton, PageHeader, TableCard, SearchBox, CountPill, TableSkeleton, EmptyState, thCls,
} from "./AdminUI";

/**
 * Listado genérico (Empresas, Puestos...). Todo lo específico viene en `config`:
 * title, subtitle, seccion, icon, stats(items, lookups), columns, service, etc.
 */
export default function ModuleListPage({ config }) {
  const { service, columns, basePath } = config;

  const [items, setItems] = useState([]);
  const [lookups, setLookups] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    const lookupEntries = Object.entries(config.lookups || {});

    async function load() {
      try {
        const [list, ...extra] = await Promise.all([
          service.list(),
          ...lookupEntries.map(([, fn]) => fn()),
        ]);

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
  }, [config]);

  const q = query.trim().toLowerCase();
  const filtered = items.filter((i) => !q || config.searchText(i, lookups).toLowerCase().includes(q));
  const [one, many] = config.countWords;

  async function confirmDelete() {
    setDeleting(true);
    try {
      await service.remove(toDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== toDelete.id));
      setNotice("Eliminado correctamente.");
    } catch (e) {
      setError(e?.message || "No se pudo eliminar. Intenta de nuevo.");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const botonNuevo = (
    <ActionButton variant="primary" to={`${basePath}/nuevo`}>
      <Icon name="plus" className="h-4 w-4" />
      {config.newLabel}
    </ActionButton>
  );

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
        <FormMessage type="success">{notice}</FormMessage>
      </div>

      <TableCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-luwi-linea/70 p-5">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder={config.searchPlaceholder}
            className="w-full max-w-md"
          />
          <CountPill>
            {filtered.length} {filtered.length === 1 ? one : many}
          </CountPill>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={config.icon}
            title={q ? "Sin resultados" : `Aún no hay ${many}`}
            text={q ? `No encontramos ${many} que coincidan con “${query}”.` : `Crea el primer registro para empezar.`}
            action={!q && botonNuevo}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-luwi-profundo">
              <thead className="bg-luwi-panel/70">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className={thCls}>
                      {c.label}
                    </th>
                  ))}
                  <th className={`${thCls} text-right`}>Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-luwi-linea/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="group transition hover:bg-luwi-panel/60">
                    {columns.map((c) => (
                      <td key={c.key} className="px-6 py-3.5">
                        {c.render(item, lookups)}
                      </td>
                    ))}

                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <ActionButton size="sm" to={`${basePath}/${item.id}`} aria-label="Ver" title="Ver">
                          <Icon name="eye" className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton size="sm" variant="edit" to={`${basePath}/${item.id}/editar`} aria-label="Editar" title="Editar">
                          <Icon name="pencil" className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton size="sm" variant="danger" onClick={() => setToDelete(item)} aria-label="Eliminar" title="Eliminar">
                          <Icon name="trash" className="h-4 w-4" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <ConfirmModal
        open={!!toDelete}
        message={toDelete ? config.deleteText(toDelete) : ""}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
