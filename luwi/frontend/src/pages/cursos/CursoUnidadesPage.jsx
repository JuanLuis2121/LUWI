import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import { ActionButton, Badge } from "../../components/AdminUI";
import { ErrorBanner, FieldError, Label, SuccessBanner, inputCls } from "../../components/FormControls";
import { EstadoCursoBadge, TIPOS_UNIDAD_LABEL, formatoHoras } from "../../components/cursos/EstadoCurso";
import {
  getCurso,
  crearUnidad,
  actualizarUnidad,
  moverUnidad,
  retirarUnidad,
  publicarCurso,
  desactivarCurso,
} from "../../services/cursosService";

const TIPOS = ["TEXTO", "VIDEO", "ENLACE"];

const esUrl = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// Mismas reglas que unidadValidator del backend
function validarUnidad(u) {
  const e = {};
  const titulo = u.titulo.trim();
  if (titulo.length < 3 || titulo.length > 150) e.titulo = "El título debe tener entre 3 y 150 caracteres.";
  if (u.tipo === "TEXTO" && u.contenido.trim().length < 10)
    e.contenido = "El texto de la unidad debe tener al menos 10 caracteres.";
  if (u.tipo !== "TEXTO" && !esUrl(u.recursoUrl.trim()))
    e.recursoUrl = "Escribe una URL válida que empiece con http:// o https://.";
  return e;
}

const unidadVacia = () => ({ titulo: "", tipo: "TEXTO", contenido: "", recursoUrl: "", obligatoria: true });

function EditorUnidad({ inicial, numero, guardando, error, onGuardar, onCancelar }) {
  const [u, setU] = useState(inicial);
  const [enviado, setEnviado] = useState(false);
  const errores = enviado ? validarUnidad(u) : {};
  const set = (campo, valor) => setU((prev) => ({ ...prev, [campo]: valor }));
  const prefijo = inicial._id ?? "nueva";

  function guardar(ev) {
    ev.preventDefault();
    setEnviado(true);
    if (Object.keys(validarUnidad(u)).length) return;
    onGuardar({
      titulo: u.titulo.trim(),
      tipo: u.tipo,
      contenido: u.tipo === "TEXTO" ? u.contenido.trim() : "",
      recursoUrl: u.tipo === "TEXTO" ? null : u.recursoUrl.trim(),
      obligatoria: u.obligatoria,
    });
  }

  return (
    <form
      onSubmit={guardar}
      noValidate
      className="space-y-4 rounded-2xl border-2 border-admin-blue bg-white p-4 shadow-lg shadow-admin-blue/10 sm:p-5"
    >
      <p className="text-sm font-bold text-admin-ink">
        {inicial._id ? `Editar unidad ${numero}` : "Nueva unidad"}
      </p>
      <ErrorBanner>{error}</ErrorBanner>

      <fieldset disabled={guardando} className="space-y-4">
        <div>
          <Label htmlFor={`${prefijo}-titulo`} required>Título</Label>
          <input
            id={`${prefijo}-titulo`}
            value={u.titulo}
            maxLength={150}
            onChange={(e) => set("titulo", e.target.value)}
            placeholder="Ej. Bienvenida a la empresa"
            className={inputCls(errores.titulo)}
          />
          <FieldError>{errores.titulo}</FieldError>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-admin-ink">Tipo de contenido</p>
          <div role="radiogroup" aria-label="Tipo de contenido" className="grid grid-cols-3 gap-2 sm:inline-grid">
            {TIPOS.map((t) => (
              <label
                key={t}
                className={`flex cursor-pointer items-center justify-center rounded-full border-2 px-4 py-2 text-sm font-semibold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-admin-blue/20 ${
                  u.tipo === t
                    ? "border-admin-blue bg-admin-soft text-admin-ink"
                    : "border-admin-line bg-admin-bg text-admin-muted hover:border-admin-blue/50"
                }`}
              >
                <input
                  type="radio"
                  name={`${prefijo}-tipo`}
                  value={t}
                  checked={u.tipo === t}
                  onChange={() => set("tipo", t)}
                  className="sr-only"
                />
                {TIPOS_UNIDAD_LABEL[t]}
              </label>
            ))}
          </div>
        </div>

        {u.tipo === "TEXTO" ? (
          <div>
            <Label htmlFor={`${prefijo}-contenido`} required>Texto</Label>
            <textarea
              id={`${prefijo}-contenido`}
              rows={6}
              value={u.contenido}
              maxLength={20000}
              onChange={(e) => set("contenido", e.target.value)}
              placeholder="Escribe el contenido que leerá el postulante."
              className={`${inputCls(errores.contenido)} resize-y`}
            />
            <FieldError>{errores.contenido}</FieldError>
          </div>
        ) : (
          <div>
            <Label htmlFor={`${prefijo}-url`} required>
              {u.tipo === "VIDEO" ? "URL del video" : "URL del enlace"}
            </Label>
            <input
              id={`${prefijo}-url`}
              type="url"
              inputMode="url"
              value={u.recursoUrl}
              maxLength={500}
              onChange={(e) => set("recursoUrl", e.target.value)}
              placeholder="https://"
              className={inputCls(errores.recursoUrl)}
            />
            <FieldError>{errores.recursoUrl}</FieldError>
          </div>
        )}

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-admin-ink">
          <input
            type="checkbox"
            checked={u.obligatoria}
            onChange={(e) => set("obligatoria", e.target.checked)}
            className="h-4 w-4 accent-admin-blue"
          />
          Unidad obligatoria
          <span className="text-xs text-admin-muted">(solo las obligatorias cuentan para el avance)</span>
        </label>
      </fieldset>

      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton onClick={onCancelar} disabled={guardando}>
          Cancelar
        </ActionButton>
        <ActionButton variant="primary" type="submit" disabled={guardando}>
          <Icon name="check" className="h-4 w-4" />
          {guardando ? "Guardando..." : "Guardar unidad"}
        </ActionButton>
      </div>
    </form>
  );
}

export default function CursoUnidadesPage() {
  const { id } = useParams();
  const location = useLocation();

  const [curso, setCurso] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.message ?? "");

  // editor: null | { _id?, titulo, tipo, contenido, recursoUrl, obligatoria }
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState("");
  // Operación en curso: "editor", "curso" o el _id de la unidad que se mueve o retira
  const [ocupado, setOcupado] = useState(null);
  const [aRetirar, setARetirar] = useState(null);
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false);

  useEffect(() => {
    let active = true;
    getCurso(id)
      .then((c) => {
        if (!active) return;
        setCurso(c);
        setUnidades(c.unidades ?? []);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const editable = curso?.editable !== false;
  const inactivo = curso?.estado === "INACTIVO";

  // Todas las operaciones de unidades devuelven { estado, unidades }: el estado
  // de la pantalla se actualiza solo con esa respuesta.
  const aplicar = (data) => {
    setUnidades(data.unidades ?? []);
    setCurso((c) => ({ ...c, estado: data.estado ?? c.estado }));
  };

  async function ejecutar(clave, operacion, mensaje) {
    setOcupado(clave);
    setError("");
    setNotice("");
    try {
      aplicar(await operacion());
      if (mensaje) setNotice(mensaje);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setOcupado(null);
    }
  }

  async function guardarUnidad(datos) {
    setOcupado("editor");
    setEditorError("");
    setError("");
    setNotice("");
    try {
      const data = editor._id
        ? await actualizarUnidad(id, editor._id, datos)
        : await crearUnidad(id, datos);
      aplicar(data);
      setNotice(editor._id ? "Unidad actualizada." : "Unidad agregada.");
      setEditor(null);
    } catch (e) {
      setEditorError(e.message);
    } finally {
      setOcupado(null);
    }
  }

  async function retirar() {
    const u = aRetirar;
    await ejecutar(u._id, () => retirarUnidad(id, u._id), `Se retiró la unidad "${u.titulo}".`);
    setARetirar(null);
  }

  async function cambiarEstado(accion) {
    setOcupado("curso");
    setError("");
    setNotice("");
    try {
      const actualizado = accion === "publicar" ? await publicarCurso(id) : await desactivarCurso(id);
      setCurso((c) => ({ ...c, ...actualizado }));
      setUnidades(actualizado.unidades ?? unidades);
      setNotice(accion === "publicar" ? "Curso publicado." : "Curso desactivado.");
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(null);
      setConfirmarDesactivar(false);
    }
  }

  const abrirEditor = (u) => {
    setEditorError("");
    setEditor(
      u
        ? { _id: u._id, titulo: u.titulo, tipo: u.tipo, contenido: u.contenido ?? "", recursoUrl: u.recursoUrl ?? "", obligatoria: u.obligatoria !== false }
        : unidadVacia()
    );
  };

  const obligatorias = unidades.filter((u) => u.obligatoria !== false).length;

  return (
    <div className="max-w-4xl">
      <Link
        to="/dashboard/cursos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-admin-ink hover:text-admin-blue"
      >
        <Icon name="arrowLeft" className="h-4 w-4 text-admin-blue" />
        Volver a Cursos
      </Link>

      {loading ? (
        <p className="mt-8 text-sm text-admin-muted">Cargando...</p>
      ) : !curso ? (
        <div className="mt-6">
          <ErrorBanner>{error || "No se encontró el curso."}</ErrorBanner>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-admin-blue">Unidades del curso</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="break-words text-3xl font-extrabold text-admin-ink sm:text-4xl">{curso.titulo}</h1>
                <EstadoCursoBadge estado={curso.estado} />
              </div>
              <p className="mt-1 text-sm text-admin-muted">
                {formatoHoras(curso.duracionHoras)} · {unidades.length}{" "}
                {unidades.length === 1 ? "unidad" : "unidades"} ({obligatorias}{" "}
                {obligatorias === 1 ? "obligatoria" : "obligatorias"})
              </p>
            </div>

            {editable && (
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  size="sm"
                  variant="edit"
                  to={`/dashboard/cursos/${id}/editar`}
                  aria-label="Editar curso"
                  title="Editar curso"
                >
                  <Icon name="pencil" className="h-4 w-4" />
                </ActionButton>
                {curso.estado !== "PUBLICADO" && (
                  <ActionButton
                    size="sm"
                    variant="primary"
                    disabled={ocupado === "curso"}
                    onClick={() => cambiarEstado("publicar")}
                    aria-label={ocupado === "curso" ? "Publicando curso" : "Publicar curso"}
                    title="Publicar curso"
                  >
                    <Icon name="send" className="h-4 w-4" />
                  </ActionButton>
                )}
                {!inactivo && (
                  <ActionButton
                    size="sm"
                    variant="danger"
                    disabled={ocupado === "curso"}
                    onClick={() => setConfirmarDesactivar(true)}
                    aria-label="Desactivar curso"
                    title="Desactivar curso"
                  >
                    <Icon name="ban" className="h-4 w-4" />
                  </ActionButton>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <ErrorBanner>{error}</ErrorBanner>
            <SuccessBanner>{notice}</SuccessBanner>
            {!editable && (
              <ErrorBanner>Este curso es global o de otra empresa: solo puedes consultar sus unidades.</ErrorBanner>
            )}
            {editable && curso.estado === "BORRADOR" && unidades.length === 0 && (
              <p className="rounded-2xl bg-admin-soft/60 px-5 py-3 text-sm text-admin-ink">
                Para publicar el curso necesitas al menos una unidad válida.
              </p>
            )}
          </div>

          <ol className="mt-5 space-y-3">
            {unidades.length === 0 && !editor && (
              <li className="rounded-2xl border-2 border-dashed border-admin-line bg-white px-4 py-8 text-center text-sm text-admin-muted">
                Este curso todavía no tiene unidades.
              </li>
            )}

            {unidades.map((u, i) =>
              editor?._id === u._id ? (
                <li key={u._id}>
                  <EditorUnidad
                    inicial={editor}
                    numero={i + 1}
                    guardando={ocupado === "editor"}
                    error={editorError}
                    onGuardar={guardarUnidad}
                    onCancelar={() => setEditor(null)}
                  />
                </li>
              ) : (
                <li
                  key={u._id}
                  className="flex flex-col gap-3 rounded-2xl border-2 border-admin-line/60 bg-white p-4 sm:flex-row sm:items-start"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-soft text-sm font-bold text-admin-ink">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold text-admin-ink">{u.titulo}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge>{TIPOS_UNIDAD_LABEL[u.tipo] ?? u.tipo}</Badge>
                      <span className={`text-xs font-semibold ${u.obligatoria !== false ? "text-admin-blue" : "text-admin-muted"}`}>
                        {u.obligatoria !== false ? "Obligatoria" : "Opcional"}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 break-all text-xs text-admin-muted sm:break-words">
                      {u.tipo === "TEXTO" ? u.contenido : u.recursoUrl}
                    </p>
                  </div>
                  {editable && (
                    <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                      <ActionButton
                        size="sm"
                        variant="edit"
                        disabled={!!editor || !!ocupado}
                        onClick={() => abrirEditor(u)}
                        aria-label={`Editar la unidad ${u.titulo}`}
                        title="Editar"
                      >
                        <Icon name="pencil" className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        disabled={i === 0 || !!ocupado}
                        onClick={() => ejecutar(u._id, () => moverUnidad(id, u._id, "subir"))}
                        aria-label={`Subir la unidad ${u.titulo}`}
                        title="Subir"
                      >
                        <Icon name="arrowUp" className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        disabled={i === unidades.length - 1 || !!ocupado}
                        onClick={() => ejecutar(u._id, () => moverUnidad(id, u._id, "bajar"))}
                        aria-label={`Bajar la unidad ${u.titulo}`}
                        title="Bajar"
                      >
                        <Icon name="arrowDown" className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        size="sm"
                        variant="danger"
                        disabled={!!ocupado}
                        onClick={() => setARetirar(u)}
                        aria-label={`Retirar la unidad ${u.titulo}`}
                        title="Retirar"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  )}
                </li>
              )
            )}

            {editor && !editor._id && (
              <li>
                <EditorUnidad
                  inicial={editor}
                  numero={unidades.length + 1}
                  guardando={ocupado === "editor"}
                  error={editorError}
                  onGuardar={guardarUnidad}
                  onCancelar={() => setEditor(null)}
                />
              </li>
            )}
          </ol>

          {editable && !editor && (
            <div className="mt-4">
              <ActionButton variant="primary" disabled={inactivo || !!ocupado} onClick={() => abrirEditor(null)}>
                <Icon name="plus" className="h-4 w-4" />
                Agregar unidad
              </ActionButton>
              {inactivo && (
                <p className="mt-2 text-xs text-admin-muted">
                  Un curso desactivado no admite unidades nuevas. Publícalo de nuevo para agregarlas.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!aRetirar}
        title="Retirar unidad"
        message={
          aRetirar
            ? `¿Retirar la unidad "${aRetirar.titulo}"? Dejará de mostrarse a los postulantes. Si alguien ya la revisó, ese avance se conserva.`
            : ""
        }
        confirmLabel="Retirar"
        loadingLabel="Retirando..."
        loading={!!aRetirar && ocupado === aRetirar._id}
        onConfirm={retirar}
        onCancel={() => setARetirar(null)}
      />

      <ConfirmModal
        open={confirmarDesactivar}
        title="Desactivar curso"
        message={`¿Desactivar el curso "${curso?.titulo ?? ""}"? Ya no se podrá agregar a rutas nuevas. Sus unidades, las rutas donde aparece y el avance de los postulantes se conservan.`}
        confirmLabel="Desactivar"
        loadingLabel="Desactivando..."
        loading={ocupado === "curso"}
        onConfirm={() => cambiarEstado("desactivar")}
        onCancel={() => setConfirmarDesactivar(false)}
      />
    </div>
  );
}
