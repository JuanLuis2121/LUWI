import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import FormMessage from "../../components/FormMessage";
import {
  ActionButton, Badge, Bubble, PageHeader, TableCard, SearchBox, CountPill, TableSkeleton, EmptyState, thCls,
} from "../../components/AdminUI";
import { RouteIcon } from "../../components/dashboard/icons";
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
    (i) => !q || `${i.nombre} ${i.puestoTitulo} ${i.empresaNombre}`.toLowerCase().includes(q)
  );

  const horasTotales = items.reduce((a, r) => a + (Number(r.duracionTotalHoras) || 0), 0);
  const puestosCubiertos = new Set(items.map((r) => r.puestoId).filter(Boolean)).size;
  const maxCursos = Math.max(1, ...items.map((r) => r.cursos.length));

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

  const botonNuevo = (
    <ActionButton variant="primary" to="/dashboard/rutas/nuevo">
      <Icon name="plus" className="h-4 w-4" />
      Nueva ruta
    </ActionButton>
  );

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
              ]
        }
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
            placeholder="Buscar por nombre, puesto o empresa"
            className="w-full max-w-md"
          />
          <CountPill>
            {filtered.length} {filtered.length === 1 ? "ruta" : "rutas"}
          </CountPill>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={RouteIcon}
            title={q ? "Sin resultados" : "Aún no hay rutas de aprendizaje"}
            text={q ? `No encontramos rutas que coincidan con “${query}”.` : "Crea una ruta y ordena los cursos que necesita cada puesto."}
            action={!q && botonNuevo}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-luwi-profundo">
              <thead className="bg-luwi-panel/70">
                <tr>
                  <th className={thCls}>Ruta</th>
                  <th className={thCls}>Puesto</th>
                  <th className={thCls}>Cursos</th>
                  <th className={thCls}>Duración</th>
                  <th className={`${thCls} text-right`}>Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-luwi-linea/60">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-luwi-panel/60">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Bubble>
                          <Icon name="route" className="h-4 w-4" />
                        </Bubble>
                        <div className="min-w-0">
                          <p className="max-w-[260px] truncate font-semibold" title={r.nombre}>
                            {r.nombre || "Sin nombre"}
                          </p>
                          {r.descripcion && (
                            <p className="max-w-[260px] truncate text-xs text-luwi-texto/75" title={r.descripcion}>
                              {r.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex max-w-[260px] flex-col items-start gap-1">
                        <Badge>{r.puestoTitulo || "—"}</Badge>
                        {r.empresaNombre && <span className="truncate text-xs text-luwi-texto/75">{r.empresaNombre}</span>}
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 font-semibold">{r.cursos.length}</span>
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-luwi-cristal-fondo">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-luwi-medio to-luwi-tecno"
                            style={{ width: `${(r.cursos.length / maxCursos) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-luwi-texto/60" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        {r.duracionTotalHoras} h
                      </span>
                    </td>

                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <ActionButton size="sm" to={`/dashboard/rutas/${r.id}`} aria-label="Ver" title="Ver">
                          <Icon name="eye" className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton size="sm" variant="edit" to={`/dashboard/rutas/${r.id}/editar`} aria-label="Editar" title="Editar">
                          <Icon name="pencil" className="h-4 w-4" />
                        </ActionButton>
                        <ActionButton size="sm" variant="danger" onClick={() => setToDelete(r)} aria-label="Eliminar" title="Eliminar">
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
        message={
          toDelete ? `¿Seguro que quieres eliminar la ruta "${toDelete.nombre}"? Esta acción no se puede deshacer.` : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
