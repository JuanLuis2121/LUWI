import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "./Icon";
import FormField from "./FormField";
import { ActionButton } from "./AdminUI";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields, values) {
  const errors = {};
  for (const f of fields) {
    const v = String(values[f.name] ?? "").trim();
    if (f.required && !v) {
      errors[f.name] = f.requiredMsg || "Este campo es obligatorio.";
      continue;
    }
    if (v && f.type === "email" && !EMAIL.test(v)) {
      errors[f.name] = "Escribe un correo electrónico válido.";
    }
    if (v && f.type === "url") {
      try {
        const u = new URL(v);
        if (!/^https?:$/.test(u.protocol)) throw new Error("protocolo");
      } catch {
        errors[f.name] = "Escribe un enlace válido que empiece con http:// o https://";
      }
    }
  }
  return errors;
}

function getOptions(field, lookups) {
  if (field.optionsFrom) {
    return (lookups[field.optionsFrom] || []).map((i) => ({
      value: i.id,
      label: i[field.optionLabel],
    }));
  }
  return (field.options || []).map((o) => ({ value: o, label: o }));
}

export default function ModuleFormPage({ config, mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fields, service, basePath } = config;
  const readOnly = mode === "view";

  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.name, ""]))
  );
  const [lookups, setLookups] = useState({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    const lookupEntries = Object.entries(config.lookups || {});

    async function load() {
      try {
        const [item, ...extra] = await Promise.all([
          mode === "create" ? Promise.resolve(null) : service.get(id),
          ...lookupEntries.map(([, fn]) => fn()),
        ]);
        if (!active) return;
        setLookups(Object.fromEntries(lookupEntries.map(([k], i) => [k, extra[i]])));
        if (mode !== "create") {
          if (!item) setNotFound(true);
          else setValues(Object.fromEntries(fields.map((f) => [f.name, item[f.name] ?? ""])));
        }
      } catch {
        if (active) setSaveError("No se pudieron cargar los datos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [config, mode, id]);

  const errors = submitted ? validate(fields, values) : {};
  const errorCount = Object.keys(errors).length;

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setSaveError("");
    if (Object.keys(validate(fields, values)).length > 0) return;

    const payload = Object.fromEntries(
      fields.map((f) => [f.name, String(values[f.name]).trim()])
    );

    setSaving(true);
    try {
      if (mode === "edit") await service.update(id, payload);
      else await service.create(payload);
      navigate(basePath);
    } catch {
      setSaveError("No se pudo guardar. Intenta de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Link
        to={basePath}
        className="inline-flex items-center gap-2 text-sm font-semibold text-admin-ink hover:text-admin-blue"
      >
        <Icon name="arrowLeft" className="h-4 w-4 text-admin-blue" />
        {config.backLabel}
      </Link>

      <h1 className="mt-6 text-4xl font-extrabold text-admin-ink">{config.formTitles[mode]}</h1>
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
        <p className="mt-8 text-sm text-admin-muted">No se encontró el registro solicitado.</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 rounded-3xl bg-white p-7 shadow-xl shadow-admin-blue/10"
        >
          <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
            {fields.map((f) => (
              <FormField
                key={f.name}
                field={f}
                value={values[f.name]}
                error={errors[f.name]}
                options={f.type === "select" ? getOptions(f, lookups) : []}
                disabled={readOnly}
                onChange={handleChange}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            {readOnly ? (
              <>
                <ActionButton to={basePath}>Volver</ActionButton>
                <ActionButton variant="edit" to={`${basePath}/${id}/editar`}>
                  <Icon name="pencil" className="h-4 w-4" />
                  Editar
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton to={basePath}>Cancelar</ActionButton>
                <ActionButton variant="primary" type="submit" disabled={saving}>
                  <Icon name="check" className="h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </ActionButton>
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
}