import { useEffect, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import {
  ActionButton, Badge, Bubble, PageHeader, TableCard, SearchBox, CountPill, TableSkeleton, EmptyState, thCls,
} from "../../components/AdminUI";
import { BookIcon } from "../../components/dashboard/icons";
import { ErrorBanner, SuccessBanner } from "../../components/FormControls";
import { EstadoCursoBadge, formatoHoras } from "../../components/cursos/EstadoCurso";
import { getCursos, publicarCurso, desactivarCurso, eliminarCurso } from "../../services/cursosService";

const FILTROS_ESTADO = [
  { value: "", label: "Todos" },
  { value: "PUBLICADO", label: "Publicados" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "INACTIVO", label: "Inactivos" },
];

export default function CursosListPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [cursos, setCursos] = useState([]);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message ?? "");
  // id del curso que se está publicando o desactivando (sus botones quedan inactivos)
  const [ocupado, setOcupado] = useState(null);
  const [aDesactivar, setADesactivar] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  useEffect(() => {
    let active = true;
    getCursos()
      .then((data) => active && setCursos(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Acceso rápido del dashboard: /dashboard/cursos?nuevo=1
  if (searchParams.get("nuevo") === "1") {
    return <Navigate to="/dashboard/cursos/nuevo" replace />;
  }

  const q = query.trim().toLowerCase();
  const estadoDe = (c) => c.estado ?? "BORRADOR";
  const cuenta = (valor) => (valor ? cursos.filter((c) => estadoDe(c) === valor).length : cursos.length);
  const horasTotales = cursos.reduce((a, c) => a + (Number(c.duracionHoras) || 0), 0);
  const unidadesTotales = cursos.reduce((a, c) => a + (c.totalUnidades ?? 0), 0);
  const filtrados = cursos.filter(
    (c) =>
      (!estado || (c.estado ?? "BORRADOR") === estado) &&
      (!q || `${c.titulo} ${c.descripcion} ${c.competencia} ${c.nivel}`.toLowerCase().includes(q))
  );

  // Reemplaza el curso solo con lo que devolvió el servidor
  const reemplazar = (actualizado) =>
    setCursos((prev) => prev.map((c) => (c._id === actualizado._id ? { ...c, ...actualizado } : c)));

  async function publicar(curso) {
    setOcupado(curso._id);
    setError("");
    setNotice("");
    try {
      reemplazar(await publicarCurso(curso._id));
      setNotice(`El curso "${curso.titulo}" quedó publicado.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(null);
    }
  }

  async function confirmarDesactivar() {
    const curso = aDesactivar;
    setOcupado(curso._id);
    setError("");
    setNotice("");
    try {
      reemplazar(await desactivarCurso(curso._id));
      setNotice(`El curso "${curso.titulo}" quedó desactivado.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(null);
      setADesactivar(null);
    }
  }

  // El backend no deja eliminar un curso que está en alguna ruta (409 con el motivo)
  async function confirmarEliminar() {
    const curso = aEliminar;
    setOcupado(curso._id);
    setError("");
    setNotice("");
    try {
      await eliminarCurso(curso._id);
      setCursos((prev) => prev.filter((c) => c._id !== curso._id));
      setNotice(`El curso "${curso.titulo}" se eliminó.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(null);
      setAEliminar(null);
    }
  }

  const resumen = (c) => (
    <div className="min-w-0">
      <p className="break-words font-semibold text-luwi-profundo">{c.titulo}</p>
      <p className="mt-0.5 line-clamp-2 max-w-[360px] break-words text-xs text-luwi-texto/80">{c.descripcion}</p>
      {c.alcance === "GLOBAL" && (
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-luwi-tecno/10 px-2 py-0.5 text-[11px] font-semibold text-luwi-medio">
          <span className="h-1.5 w-1.5 rounded-full bg-luwi-tecno" />
          Curso global
        </span>
      )}
    </div>
  );

  const detalles = (c, enLinea = false) => (
    <div className={`text-xs ${enLinea ? "flex flex-wrap items-center gap-x-3 gap-y-1" : "space-y-1 whitespace-nowrap"}`}>
      <span className="capitalize">
        <Badge>{c.nivel}</Badge>
      </span>
      <p className="font-medium text-luwi-profundo">{formatoHoras(c.duracionHoras)}</p>
      <p className="text-luwi-texto/80">
        {c.totalUnidades ?? 0} {(c.totalUnidades ?? 0) === 1 ? "unidad" : "unidades"}
      </p>
    </div>
  );

  // Íconos con nombre accesible (aria-label) y texto al pasar el cursor (title)
  const icono = (nombre, label) => ({ "aria-label": `${label}`, title: label, children: <Icon name={nombre} className="h-4 w-4" /> });

  const acciones = (c) => {
    const est = c.estado ?? "BORRADOR";
    const bloqueado = ocupado === c._id;
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
          <ActionButton
            size="sm"
            variant="edit"
            disabled={bloqueado}
            onClick={() => publicar(c)}
            {...icono("send", bloqueado ? `Publicando ${c.titulo}` : `Publicar ${c.titulo}`)}
          />
        )}
        <ActionButton size="sm" variant="edit" to={`/dashboard/cursos/${c._id}/editar`} {...icono("pencil", `Editar ${c.titulo}`)} />
        <ActionButton size="sm" to={`/dashboard/cursos/${c._id}/unidades`} {...icono("layers", `Gestionar unidades de ${c.titulo}`)} />
        {est !== "INACTIVO" && (
          <ActionButton size="sm" variant="danger" disabled={bloqueado} onClick={() => setADesactivar(c)} {...icono("ban", `Desactivar ${c.titulo}`)} />
        )}
        <ActionButton size="sm" variant="danger" disabled={bloqueado} onClick={() => setAEliminar(c)} {...icono("trash", `Eliminar ${c.titulo}`)} />
      </>
    );
  };

  const botonNuevo = (
    <ActionButton variant="primary" to="/dashboard/cursos/nuevo">
      <Icon name="plus" className="h-4 w-4" />
      Nuevo curso
    </ActionButton>
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
              ]
        }
        action={botonNuevo}
      />

      <div className="mb-4 space-y-2 empty:hidden">
        <ErrorBanner>{error}</ErrorBanner>
        <SuccessBanner>{notice}</SuccessBanner>
      </div>

      <TableCard>
        <div className="flex flex-wrap items-center gap-3 border-b border-luwi-linea/70 p-5">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Buscar por título, competencia o nivel"
            className="min-w-0 flex-1 basis-64"
          />

          {/* Filtro por estado en pestañas */}
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

          <CountPill>
            {filtrados.length} {filtrados.length === 1 ? "curso" : "cursos"}
          </CountPill>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={BookIcon}
            title={q || estado ? "Sin resultados" : "Aún no hay cursos"}
            text={q || estado ? "No hay cursos que coincidan con la búsqueda o el filtro." : "Crea el primer curso y agrégale unidades."}
            action={!q && !estado && botonNuevo}
          />
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm text-luwi-profundo">
                <thead className="bg-luwi-panel/70">
                  <tr>
                    <th className={thCls}>Curso</th>
                    <th className={`${thCls} px-4`}>Detalles</th>
                    <th className={`${thCls} px-4`}>Estado</th>
                    <th className={`${thCls} px-4 text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luwi-linea/60">
                  {filtrados.map((c) => (
                    <tr key={c._id} className="align-top transition hover:bg-luwi-panel/60">
                      <td className="px-6 py-4">
                        <div className="flex min-w-[220px] items-start gap-3">
                          <Bubble>
                            <Icon name="book" className="h-4 w-4" />
                          </Bubble>
                          {resumen(c)}
                        </div>
                      </td>
                      <td className="px-4 py-4">{detalles(c)}</td>
                      <td className="px-4 py-4">
                        <EstadoCursoBadge estado={estadoDe(c)} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">{acciones(c)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Celular: tarjetas */}
            <ul className="divide-y divide-luwi-linea/60 md:hidden">
              {filtrados.map((c) => (
                <li key={c._id} className="space-y-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    {resumen(c)}
                    <EstadoCursoBadge estado={estadoDe(c)} />
                  </div>
                  {detalles(c, true)}
                  <div className="flex flex-wrap items-center gap-1.5">{acciones(c)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </TableCard>

      <ConfirmModal
        open={!!aDesactivar}
        title="Desactivar curso"
        message={
          aDesactivar
            ? `¿Desactivar el curso "${aDesactivar.titulo}"? Ya no se podrá agregar a rutas nuevas. Sus unidades, las rutas donde aparece y el avance de los postulantes se conservan.`
            : ""
        }
        confirmLabel="Desactivar"
        loadingLabel="Desactivando..."
        loading={ocupado === aDesactivar?._id}
        onConfirm={confirmarDesactivar}
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
        loading={ocupado === aEliminar?._id}
        onConfirm={confirmarEliminar}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  );
}
