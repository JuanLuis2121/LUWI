import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { ActionButton } from "../../components/AdminUI";
import { ErrorBanner, FieldError, Label, inputCls } from "../../components/FormControls";
import { EstadoCursoBadge } from "../../components/cursos/EstadoCurso";
import { NIVELES, crearCurso, actualizarCurso, getCurso } from "../../services/cursosService";
import { CATEGORIAS_COMPETENCIA, getCompetencias } from "../../services/competenciasService";

const VACIO = { titulo: "", descripcion: "", nivel: "", duracionHoras: "", competencias: [] };

// Mismas reglas que cursoValidator del backend, para avisar antes de enviar.
function validar(form) {
  const e = {};
  const titulo = form.titulo.trim();
  const descripcion = form.descripcion.trim();
  const horas = Number(form.duracionHoras);

  if (titulo.length < 3 || titulo.length > 120) e.titulo = "El título debe tener entre 3 y 120 caracteres.";
  if (descripcion.length < 10 || descripcion.length > 2000)
    e.descripcion = "La descripción debe tener entre 10 y 2000 caracteres.";
  if (!NIVELES.includes(form.nivel)) e.nivel = "Selecciona el nivel del curso.";
  if (form.duracionHoras === "" || !Number.isFinite(horas) || horas < 0.5 || horas > 500)
    e.duracionHoras = "La duración debe estar entre 0.5 y 500 horas.";
  if (form.competencias.length === 0) e.competencias = "Selecciona al menos una competencia.";
  return e;
}

export default function CursoFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = mode === "edit";

  const [form, setForm] = useState(VACIO);
  const [curso, setCurso] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  // Competencias guardadas que ya no están activas en el catálogo (no se reenvían)
  const [inactivas, setInactivas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getCompetencias(), editando ? getCurso(id) : Promise.resolve(null)])
      .then(([comps, c]) => {
        if (!active) return;
        setCatalogo(comps);
        if (c) {
          const guardadas = (c.competencias ?? []).map(String);
          const activas = guardadas.filter((cid) => comps.some((x) => x._id === cid));
          setInactivas(guardadas.length - activas.length);
          setCurso(c);
          setForm({
            titulo: c.titulo ?? "",
            descripcion: c.descripcion ?? "",
            nivel: c.nivel ?? "",
            duracionHoras: String(c.duracionHoras ?? ""),
            competencias: activas,
          });
        }
      })
      .catch((e) => active && setLoadError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [editando, id]);

  const soloLectura = editando && curso?.editable === false;
  const errors = submitted ? validar(form) : {};
  const errorCount = Object.keys(errors).length;

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const alternarCompetencia = (cid) =>
    setForm((f) => ({
      ...f,
      competencias: f.competencias.includes(cid)
        ? f.competencias.filter((x) => x !== cid)
        : [...f.competencias, cid],
    }));

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSubmitted(true);
    setSaveError("");
    if (Object.keys(validar(form)).length) return;

    // El backend todavía exige el texto "competencia" (se mantiene mientras se migra
    // al catálogo): se envía el nombre de la primera competencia seleccionada.
    const primera = catalogo.find((c) => c._id === form.competencias[0]);
    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      nivel: form.nivel,
      duracionHoras: Number(form.duracionHoras),
      competencias: form.competencias,
      competencia: (primera?.nombre ?? curso?.competencia ?? "").slice(0, 60),
    };

    setSaving(true);
    try {
      if (editando) {
        await actualizarCurso(id, payload);
        navigate("/dashboard/cursos", { state: { message: "Curso actualizado correctamente." } });
      } else {
        const nuevo = await crearCurso(payload);
        navigate(`/dashboard/cursos/${nuevo._id}/unidades`, {
          state: { message: "Curso creado como borrador. Agrega al menos una unidad para poder publicarlo." },
        });
      }
    } catch (e) {
      setSaveError(e.message);
      setSaving(false);
    }
  }

  // Catálogo agrupado por categoría
  const grupos = Object.entries(CATEGORIAS_COMPETENCIA)
    .map(([cat, label]) => ({ label, items: catalogo.filter((c) => (c.categoria ?? "OTRA") === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="max-w-3xl">
      <Link
        to="/dashboard/cursos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-admin-ink hover:text-admin-blue"
      >
        <Icon name="arrowLeft" className="h-4 w-4 text-admin-blue" />
        Volver a Cursos
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-extrabold text-admin-ink">{editando ? "Editar curso" : "Nuevo curso"}</h1>
        {curso && <EstadoCursoBadge estado={curso.estado} />}
      </div>
      {!soloLectura && (
        <p className="mt-1 text-sm text-admin-muted">
          Los campos marcados con <span className="font-bold text-admin-danger">*</span> son obligatorios.
          {!editando && " El curso se crea como borrador."}
        </p>
      )}

      <div className="mt-5 space-y-3">
        <ErrorBanner>
          {loadError ||
            saveError ||
            (errorCount > 0
              ? `Hay ${errorCount} ${errorCount === 1 ? "campo" : "campos"} por completar o corregir antes de guardar.`
              : "")}
        </ErrorBanner>
        {soloLectura && (
          <ErrorBanner>Este curso es global o de otra empresa: solo puedes consultarlo.</ErrorBanner>
        )}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-admin-muted">Cargando...</p>
      ) : loadError && editando && !curso ? null : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 space-y-5 rounded-3xl bg-white p-5 shadow-xl shadow-admin-blue/10 sm:p-7"
        >
          <fieldset disabled={soloLectura || saving} className="space-y-5">
            <div>
              <Label htmlFor="titulo" required>Título</Label>
              <input
                id="titulo"
                value={form.titulo}
                maxLength={120}
                onChange={cambiar("titulo")}
                placeholder="Ej. Atención al cliente"
                className={inputCls(errors.titulo)}
              />
              <FieldError>{errors.titulo}</FieldError>
            </div>

            <div>
              <Label htmlFor="descripcion" required>Descripción</Label>
              <textarea
                id="descripcion"
                rows={4}
                value={form.descripcion}
                maxLength={2000}
                onChange={cambiar("descripcion")}
                placeholder="Explica de qué trata el curso y qué aprenderá la persona."
                className={`${inputCls(errors.descripcion)} resize-y`}
              />
              <FieldError>{errors.descripcion}</FieldError>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="nivel" required>Nivel</Label>
                <select id="nivel" value={form.nivel} onChange={cambiar("nivel")} className={inputCls(errors.nivel)}>
                  <option value="">Selecciona un nivel</option>
                  {NIVELES.map((n) => (
                    <option key={n} value={n}>
                      {n.charAt(0).toUpperCase() + n.slice(1)}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.nivel}</FieldError>
              </div>
              <div>
                <Label htmlFor="duracionHoras" required>Duración en horas</Label>
                <input
                  id="duracionHoras"
                  type="number"
                  min="0.5"
                  max="500"
                  step="0.5"
                  inputMode="decimal"
                  value={form.duracionHoras}
                  onChange={cambiar("duracionHoras")}
                  placeholder="Ej. 8"
                  className={inputCls(errors.duracionHoras)}
                />
                <FieldError>{errors.duracionHoras}</FieldError>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold text-admin-ink">
                Competencias <span className="text-admin-danger">*</span>
              </p>
              {catalogo.length === 0 ? (
                <p className="rounded-2xl border-2 border-dashed border-admin-line px-4 py-4 text-sm text-admin-muted">
                  El catálogo de competencias está vacío.
                </p>
              ) : (
                <div
                  className={`space-y-4 rounded-2xl border-2 bg-admin-bg p-4 ${
                    errors.competencias ? "border-admin-danger" : "border-admin-line"
                  }`}
                >
                  {grupos.map((g) => (
                    <div key={g.label}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">{g.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.items.map((c) => {
                          const marcada = form.competencias.includes(c._id);
                          return (
                            <label
                              key={c._id}
                              className={`flex cursor-pointer items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-admin-blue/20 ${
                                marcada
                                  ? "border-admin-blue bg-admin-soft font-semibold text-admin-ink"
                                  : "border-admin-line bg-white text-admin-ink hover:border-admin-blue/50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={marcada}
                                onChange={() => alternarCompetencia(c._id)}
                                className="h-4 w-4 accent-admin-blue"
                              />
                              {c.nombre}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {inactivas > 0 && (
                    <p className="text-xs text-admin-muted">
                      {inactivas === 1
                        ? "Se quitó 1 competencia que ya no está activa en el catálogo."
                        : `Se quitaron ${inactivas} competencias que ya no están activas en el catálogo.`}
                    </p>
                  )}
                </div>
              )}
              <FieldError>{errors.competencias}</FieldError>
            </div>
          </fieldset>

          <div className="flex flex-wrap justify-end gap-3 pt-3">
            <ActionButton to="/dashboard/cursos">Cancelar</ActionButton>
            {!soloLectura && (
              <ActionButton variant="primary" type="submit" disabled={saving}>
                <Icon name="check" className="h-4 w-4" />
                {saving ? "Guardando..." : editando ? "Guardar cambios" : "Guardar curso"}
              </ActionButton>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
