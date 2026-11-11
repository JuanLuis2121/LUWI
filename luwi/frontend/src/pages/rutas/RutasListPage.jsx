import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import FormMessage from "../../components/FormMessage";
import { ActionButton, Badge, Bubble } from "../../components/AdminUI";
import { rutasService } from "../../services/rutasService";
import { errMsg } from "../../services/api";

export default function RutasListPage() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message ?? "");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    rutasService
      .list()
      .then((data) => active && setItems(data))
      .catch((e) => active && setError(errMsg(e, "No se pudieron cargar las rutas.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = items.filter(
    (i) =>
      !q ||
      `${i.nombre} ${i.puestoTitulo} ${i.empresaNombre}`.toLowerCase().includes(q)
  );

  async function confirmDelete() {
    setDeleting(true);
    setError("");
    setNotice("");
    try {
      await rutasService.remove(toDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== toDelete.id));
      setNotice("Ruta eliminada correctamente.");
    } catch (e) {
      setError(errMsg(e, "No se pudo eliminar la ruta."));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-admin-ink">Rutas de aprendizaje</h1>
          <p className="mt-1 text-sm text-admin-muted">
            Administra las rutas de capacitación de cada puesto.
          </p>
        </div>
        <ActionButton variant="primary" to="/rutas/nuevo">
          <Icon name="plus" className="h-4 w-4" />
          Nueva ruta
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
              placeholder="Buscar por nombre, puesto o empresa"
              aria-label="Buscar rutas"
              className="w-full bg-transparent text-sm text-admin-ink outline-none placeholder:text-admin-muted"
            />
          </label>
          <span className="text-xs font-bold text-admin-ink">
            {filtered.length} {filtered.length === 1 ? "ruta" : "rutas"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-admin-ink">
            <thead className="border-y border-admin-border bg-admin-bg text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 font-bold">Ruta</th>
                <th className="px-6 py-3 font-bold">Puesto</th>
                <th className="px-6 py-3 font-bold">Cursos</th>
                <th className="px-6 py-3 font-bold">Duración total</th>
                <th className="px-6 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/60">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-admin-muted">
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-admin-muted">
                    {q ? "No hay resultados para tu búsqueda." : "Aún no hay rutas de aprendizaje."}
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-admin-bg/60">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Bubble>
                          <Icon name="book" className="h-4 w-4" />
                        </Bubble>
                        <span className="font-semibold">{r.nombre || "Sin nombre"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge>{r.puestoTitulo || "—"}</Badge>
                      {r.empresaNombre && (
                        <span className="ml-2 text-xs text-admin-muted">{r.empresaNombre}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">{r.cursos.length}</td>
                    <td className="px-6 py-3 font-medium">{r.duracionTotalHoras} h</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton size="sm" to={`/rutas/${r.id}`}>
                          <Icon name="eye" className="h-3.5 w-3.5" />
                          Ver
                        </ActionButton>
                        <ActionButton size="sm" variant="edit" to={`/rutas/${r.id}/editar`}>
                          <Icon name="pencil" className="h-3.5 w-3.5" />
                          Editar
                        </ActionButton>
                        <ActionButton size="sm" variant="danger" onClick={() => setToDelete(r)}>
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
        message={
          toDelete
            ? `¿Seguro que quieres eliminar la ruta "${toDelete.nombre}"? Esta acción no se puede deshacer.`
            : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}