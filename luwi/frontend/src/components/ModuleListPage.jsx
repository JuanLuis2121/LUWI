import { useEffect, useState } from "react";
import Icon from "./Icon";
import ConfirmModal from "./ConfirmModal";
import FormMessage from "./FormMessage";
import { ActionButton } from "./AdminUI";

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
  const filtered = items.filter(
    (i) => !q || config.searchText(i, lookups).toLowerCase().includes(q)
  );
  const [one, many] = config.countWords;

  async function confirmDelete() {
    setDeleting(true);
    try {
      await service.remove(toDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== toDelete.id));
      setNotice("Eliminado correctamente.");
    } catch {
      setError("No se pudo eliminar. Intenta de nuevo.");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-admin-ink">{config.title}</h1>
          <p className="mt-1 text-sm text-admin-muted">{config.subtitle}</p>
        </div>
        <ActionButton variant="primary" to={`${basePath}/nuevo`}>
          <Icon name="plus" className="h-4 w-4" />
          {config.newLabel}
        </ActionButton>
      </div>

      <div className="mb-4 space-y-2">
        <FormMessage type="error">{error}</FormMessage>
        <FormMessage type="success">{notice}</FormMessage>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-admin-blue/10">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-admin-line bg-admin-bg px-4 py-2.5 focus-within:border-admin-blue focus-within:ring-4 focus-within:ring-admin-blue/10">
            <Icon name="search" className="h-[18px] w-[18px] text-admin-blue" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={config.searchPlaceholder}
              aria-label={config.searchPlaceholder}
              className="w-full bg-transparent text-sm text-admin-ink outline-none placeholder:text-admin-muted"
            />
          </label>
          <span className="text-xs font-bold text-admin-ink">
            {filtered.length} {filtered.length === 1 ? one : many}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-admin-ink">
            <thead className="border-y border-admin-border bg-admin-bg text-xs uppercase tracking-wide">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-6 py-3 font-bold">
                    {c.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/60">
              {loading && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-admin-muted">
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-admin-muted">
                    {q ? "No hay resultados para tu búsqueda." : "Aún no hay registros."}
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((item) => (
                  <tr key={item.id} className="transition hover:bg-admin-bg/60">
                    {columns.map((c) => (
                      <td key={c.key} className="px-6 py-3">
                        {c.render(item, lookups)}
                      </td>
                    ))}
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton size="sm" to={`${basePath}/${item.id}`}>
                          <Icon name="eye" className="h-3.5 w-3.5" />
                          Ver
                        </ActionButton>
                        <ActionButton size="sm" variant="edit" to={`${basePath}/${item.id}/editar`}>
                          <Icon name="pencil" className="h-3.5 w-3.5" />
                          Editar
                        </ActionButton>
                        <ActionButton size="sm" variant="danger" onClick={() => setToDelete(item)}>
                          <Icon name="trash" className="h-3.5 w-3.5" />
                          Eliminar
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

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