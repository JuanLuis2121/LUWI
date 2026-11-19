import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { ActionButton } from "../../components/AdminUI";
import { FieldError, Label, inputCls } from "../../components/FormControls";
import { rutasService, cursoCompatible } from "../../services/rutasService";
import { errMsg } from "../../services/api";

export default function RutaFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const readOnly = mode === "view";

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puestoId, setPuestoId] = useState("");
  const [cursos, setCursos] = useState([]); // objetos curso, en orden
  const [toAdd, setToAdd] = useState("");
  const [duracionTotal, setDuracionTotal] = useState(null);
  const [options, setOptions] = useState({ puestos: [], cursos: [] });

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [opts, ruta] = await Promise.all([
          rutasService.options(),
          mode === "create" ? Promise.resolve(null) : rutasService.get(id),
        ]);
        if (!active) return;
        setOptions(opts);
        if (ruta) {
          setNombre(ruta.nombre);
          setDescripcion(ruta.descripcion);
          setPuestoId(ruta.puestoId);
          setCursos(ruta.cursos);
          setDuracionTotal(ruta.duracionTotalHoras);
        }
      } catch (e) {
        if (!active) return;
        if (e?.response?.status === 404) setNotFound(true);
        else setSaveError(errMsg(e, "No se pudieron cargar los datos."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [mode, id]);

  const puesto = options.puestos.find((p) => p.id === puestoId);
  // Solo cursos publicados, globales o de la empresa del puesto, y que no estén ya en la ruta
  const available = puesto
    ? options.cursos.filter((c) => cursoCompatible(c, puesto) && !cursos.some((x) => x.id === c.id))
    : [];
  // Estado actual de cada curso de la ruta (puede haber cambiado desde que se agregó)
  const actual = (c) => options.cursos.find((x) => x.id === c.id) ?? c;
  const incompatibles = puesto ? cursos.filter((c) => !cursoCompatible(actual(c), puesto)) : [];

  const errors = {};
  if (submitted) {
    if (nombre.trim().length < 3) errors.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (!descripcion.trim()) errors.descripcion = "Escribe la descripción de la ruta.";
    if (!puestoId) errors.puesto = "Selecciona el puesto de la ruta.";
    if (cursos.length === 0) errors.cursos = "Agrega al menos un curso a la ruta.";
    else if (incompatibles.length > 0)
      errors.cursos = "Quita los cursos que no son compatibles con el puesto antes de guardar.";
  }
  const errorCount = Object.keys(errors).length;

  function addCurso() {
    const curso = available.find((c) => c.id === toAdd);
    // Impide duplicados aunque el selector quede desactualizado
    if (!curso || cursos.some((c) => c.id === curso.id)) return;
    setCursos((prev) => [...prev, curso]);
    setToAdd("");
  }
  const removeCurso = (cid) => setCursos((prev) => prev.filter((c) => c.id !== cid));
  function move(index, delta) {
    setCursos((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setSaveError("");
    if (
      nombre.trim().length < 3 ||
      !descripcion.trim() ||
      !puestoId ||
      cursos.length === 0 ||
      incompatibles.length > 0
    )
      return;

    setSaving(true);
    try {
      const form = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        puestoId,
        cursoIds: cursos.map((c) => c.id),
      };
      if (mode === "edit") await rutasService.update(id, form);
      else await rutasService.create(form);
      navigate("/dashboard/rutas", {
        state: {
          message:
            mode === "edit"
              ? "Ruta actualizada correctamente."
              : "Ruta creada correctamente.",
        },
      });
    } catch (err) {
      setSaveError(errMsg(err, "No se pudo guardar la ruta."));
      setSaving(false);
    }
  }

  const titles = { create: "Nueva ruta", edit: "Editar ruta", view: "Detalle de la ruta" };

  return (
    <div className="max-w-3xl">
      <Link
        to="/dashboard/rutas"
        className="inline-flex items-center gap-2 text-sm font-semibold text-admin-ink hover:text-admin-blue"
      >
        <Icon name="arrowLeft" className="h-4 w-4 text-admin-blue" />
        Volver a Rutas
      </Link>

      <h1 className="mt-6 text-4xl font-extrabold text-admin-ink">{titles[mode]}</h1>
      {!readOnly && (
        <p className="mt-1 text-sm text-admin-muted">
          Los campos marcados con <span className="font-bold text-admin-danger">*</span> son obligatorios.
        </p>
      )}

      {(errorCount > 0 || saveError) && (
        <div
          role="alert"
          className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-admin-danger bg-red-50 px-5 py-3.5 text-sm font-semibold text-admin-danger"
        >
          <Icon name="alert" className="h-[18px] w-[18px] shrink-0" />
          {errorCount > 0
            ? `Hay ${errorCount} ${errorCount === 1 ? "campo" : "campos"} por completar o corregir antes de guardar.`
            : saveError}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-admin-muted">Cargando...</p>
      ) : notFound ? (
        <p className="mt-8 text-sm text-admin-muted">No se encontró la ruta solicitada.</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 space-y-5 rounded-3xl bg-white p-5 shadow-xl shadow-admin-blue/10 sm:p-7"
        >
          <div>
            <Label htmlFor="nombre" required={!readOnly}>Nombre de la ruta</Label>
            <input
              id="nombre"
              value={nombre}
              maxLength={120}
              disabled={readOnly}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Ruta de Desarrollo Frontend"
              className={inputCls(errors.nombre)}
            />
            <FieldError>{errors.nombre}</FieldError>
          </div>

          <div>
            <Label htmlFor="descripcion" required={!readOnly}>Descripción</Label>
            <textarea
              id="descripcion"
              rows={4}
              value={descripcion}
              maxLength={2000}
              disabled={readOnly}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explica el objetivo de la ruta y a quién va dirigida."
              className={`${inputCls(errors.descripcion)} resize-y`}
            />
            <FieldError>{errors.descripcion}</FieldError>
          </div>

          <div>
            <Label htmlFor="puesto" required={!readOnly}>Puesto</Label>
            <select
              id="puesto"
              value={puestoId}
              disabled={readOnly}
              onChange={(e) => setPuestoId(e.target.value)}
              className={inputCls(errors.puesto)}
            >
              <option value="">Selecciona un puesto</option>
              {options.puestos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                  {p.empresaNombre ? ` (${p.empresaNombre})` : ""}
                </option>
              ))}
            </select>
            <FieldError>{errors.puesto}</FieldError>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold text-admin-ink">
              Cursos de la ruta {!readOnly && <span className="text-admin-danger">*</span>}
            </p>

            {!readOnly && (
              <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <select
                  value={toAdd}
                  onChange={(e) => setToAdd(e.target.value)}
                  aria-label="Curso a agregar"
                  disabled={!puesto}
                  className={inputCls(false)}
                >
                  <option value="">
                    {!puesto
                      ? "Selecciona primero el puesto"
                      : available.length === 0
                        ? "No hay más cursos publicados compatibles"
                        : "Selecciona un curso para agregar"}
                  </option>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo}
                    </option>
                  ))}
                </select>
                <ActionButton variant="edit" onClick={addCurso} disabled={!toAdd} className="shrink-0">
                  <Icon name="plus" className="h-4 w-4" />
                  Agregar curso
                </ActionButton>
              </div>
            )}
            {!readOnly && (
              <p className="mb-3 text-xs text-admin-muted">
                Solo aparecen cursos publicados que sean globales o de la empresa del puesto.
              </p>
            )}

            {cursos.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-admin-line px-4 py-6 text-center text-sm text-admin-muted">
                Aún no hay cursos en esta ruta.
              </p>
            ) : (
              <ol className="space-y-2">
                {cursos.map((c, i) => (
                  <li
                    key={c.id}
                    className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 bg-admin-bg px-4 py-2.5 ${
                      incompatibles.includes(c) ? "border-admin-danger" : "border-admin-line/60"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-admin-soft text-xs font-bold text-admin-ink">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 basis-40">
                      <span className="block break-words text-sm font-semibold text-admin-ink">
                        {c.titulo}
                      </span>
                      {incompatibles.includes(c) && (
                        <span className="block text-xs font-semibold text-admin-danger">
                          No es compatible con el puesto (no está publicado o es de otra empresa).
                        </span>
                      )}
                      <span className="text-xs text-admin-muted">
                        {[c.nivel ? c.nivel.charAt(0).toUpperCase() + c.nivel.slice(1) : "", c.duracionHoras ? `${c.duracionHoras} h` : ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {!readOnly && (
                      <div className="flex gap-1.5">
                        <ActionButton
                          size="sm"
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          aria-label="Subir curso"
                        >
                          ↑
                        </ActionButton>
                        <ActionButton
                          size="sm"
                          onClick={() => move(i, 1)}
                          disabled={i === cursos.length - 1}
                          aria-label="Bajar curso"
                        >
                          ↓
                        </ActionButton>
                        <ActionButton
                          size="sm"
                          variant="danger"
                          onClick={() => removeCurso(c.id)}
                          aria-label="Quitar curso"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </ActionButton>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <FieldError>{errors.cursos}</FieldError>
          </div>

          <div className="rounded-2xl bg-admin-soft/50 px-4 py-3 text-sm text-admin-ink">
            <span className="font-bold">Duración total: </span>
            {duracionTotal != null
              ? `${duracionTotal} horas`
              : "se calcula al guardar"}
            {mode === "edit" && (
              <span className="text-admin-muted"> (se actualiza al guardar los cambios)</span>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-3">
            {readOnly ? (
              <>
                <ActionButton to="/dashboard/rutas">Volver</ActionButton>
                <ActionButton variant="edit" to={`/dashboard/rutas/${id}/editar`}>
                  <Icon name="pencil" className="h-4 w-4" />
                  Editar
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton to="/dashboard/rutas">Cancelar</ActionButton>
                <ActionButton variant="primary" type="submit" disabled={saving}>
                  <Icon name="check" className="h-4 w-4" />
                  {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Guardar ruta"}
                </ActionButton>
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
}