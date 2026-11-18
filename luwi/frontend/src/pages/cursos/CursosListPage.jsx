import { useEffect, useState } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import { ActionButton, Badge, Bubble } from "../../components/AdminUI";
import { ErrorBanner, SuccessBanner } from "../../components/FormControls";
import { EstadoCursoBadge, formatoHoras } from "../../components/cursos/EstadoCurso";
import { getCursos, publicarCurso, desactivarCurso, eliminarCurso } from "../../services/cursosService";

const FILTROS_ESTADO = [
  { value: "", label: "Todos los estados" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "PUBLICADO", label: "Publicado" },
  { value: "INACTIVO", label: "Inactivo" },
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
      <p className="break-words font-semibold text-admin-ink">{c.titulo}</p>
      <p className="line-clamp-2 max-w-[320px] break-words text-xs text-admin-muted">{c.descripcion}</p>
      {c.alcance === "GLOBAL" && <p className="mt-1 text-xs font-semibold text-admin-blue">Curso global</p>}
    </div>
  );

  const detalles = (c, enLinea = false) => (
    <div className={`text-xs ${enLinea ? "flex flex-wrap items-center gap-x-3 gap-y-1" : "space-y-1 whitespace-nowrap"}`}>
      <span className="capitalize">
        <Badge>{c.nivel}</Badge>
      </span>
      <p className="font-medium">{formatoHoras(c.duracionHoras)}</p>
      <p className="text-admin-muted">
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
          <span className="text-xs text-admin-muted">Solo lectura</span>
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-admin-ink">Cursos</h1>
          <p className="mt-1 text-sm text-admin-muted">
            Prepara los cursos, sus unidades y publícalos para usarlos en las rutas.
          </p>
        </div>
        <ActionButton variant="primary" to="/dashboard/cursos/nuevo">
          <Icon name="plus" className="h-4 w-4" />
          Nuevo curso
        </ActionButton>
      </div>

      <div className="mb-4 space-y-2">
        <ErrorBanner>{error}</ErrorBanner>
        <SuccessBanner>{notice}</SuccessBanner>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-admin-blue/10">
        <div className="flex flex-wrap items-center gap-3 p-5">
          <label className="flex min-w-0 flex-1 basis-64 items-center gap-3 rounded-2xl border-2 border-admin-line bg-admin-bg px-4 py-2.5 focus-within:border-admin-blue focus-within:ring-4 focus-within:ring-admin-blue/10">
            <Icon name="search" className="h-[18px] w-[18px] shrink-0 text-admin-blue" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, competencia o nivel"
              aria-label="Buscar cursos"
              className="w-full bg-transparent text-sm text-admin-ink outline-none placeholder:text-admin-muted"
            />
          </label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            aria-label="Filtrar por estado"
            className="rounded-2xl border-2 border-admin-line bg-admin-bg px-4 py-2.5 text-sm text-admin-ink outline-none focus:border-admin-blue"
          >
            {FILTROS_ESTADO.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <span className="text-xs font-bold text-admin-ink">
            {filtrados.length} {filtrados.length === 1 ? "curso" : "cursos"}
          </span>
        </div>

        {/* Escritorio: tabla */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm text-admin-ink">
            <thead className="border-y border-admin-border bg-admin-bg text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 font-bold">Curso</th>
                <th className="px-4 py-3 font-bold">Detalles</th>
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/60">
              {!loading &&
                filtrados.map((c) => (
                  <tr key={c._id} className="align-top transition hover:bg-admin-bg/60">
                    <td className="px-6 py-3">
                      <div className="flex min-w-[200px] items-start gap-3">
                        <Bubble>
                          <Icon name="book" className="h-4 w-4" />
                        </Bubble>
                        {resumen(c)}
                      </div>
                    </td>
                    <td className="px-4 py-3">{detalles(c)}</td>
                    <td className="px-4 py-3">
                      <EstadoCursoBadge estado={c.estado ?? "BORRADOR"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">{acciones(c)}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Celular: tarjetas */}
        <ul className="divide-y divide-admin-border/60 border-t border-admin-border md:hidden">
          {!loading &&
            filtrados.map((c) => (
              <li key={c._id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  {resumen(c)}
                  <EstadoCursoBadge estado={c.estado ?? "BORRADOR"} />
                </div>
                {detalles(c, true)}
                <div className="flex flex-wrap items-center gap-2">{acciones(c)}</div>
              </li>
            ))}
        </ul>

        {(loading || filtrados.length === 0) && (
          <p className="border-t border-admin-border px-6 py-10 text-center text-sm text-admin-muted">
            {loading
              ? "Cargando..."
              : q || estado
                ? "No hay cursos que coincidan con la búsqueda."
                : "Aún no hay cursos."}
          </p>
        )}
      </section>

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
