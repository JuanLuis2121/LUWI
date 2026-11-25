import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormField from "./FormField";
import { ActionButton } from "./AdminUI";
import { ChevronLeftIcon } from "./dashboard/icons";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields, values) {
  const errors = {};

  for (const field of fields) {
    const value = String(values[field.name] ?? "").trim();

    if (field.required && !value) {
      errors[field.name] =
        field.requiredMsg || "Este campo es obligatorio.";
      continue;
    }

    if (value && field.type === "email" && !EMAIL.test(value)) {
      errors[field.name] = "Escribe un correo electrónico válido.";
    }

    if (value && field.type === "url") {
      try {
        const url = new URL(value);

        if (!/^https?:$/.test(url.protocol)) {
          throw new Error("Protocolo inválido");
        }
      } catch {
        errors[field.name] =
          "Escribe un enlace válido que empiece con http:// o https://";
      }
    }
  }

  return errors;
}

function getOptions(field, lookups) {
  if (field.optionsFrom) {
    return (lookups[field.optionsFrom] || []).map((item) => ({
      value: item.id,
      label: item[field.optionLabel],
    }));
  }

  return (field.options || []).map((option) =>
    typeof option === "object"
      ? option
      : {
          value: option,
          label: option,
        }
  );
}

export default function ModuleFormPage({ config, mode }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const { fields, service, basePath } = config;
  const readOnly = mode === "view";

  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.name, ""]))
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
          mode === "create"
            ? Promise.resolve(null)
            : service.get(id),

          ...lookupEntries.map(([, fn]) => fn()),
        ]);

        if (!active) return;

        setLookups(
          Object.fromEntries(
            lookupEntries.map(([key], index) => [
              key,
              extra[index],
            ])
          )
        );

        if (mode !== "create") {
          if (!item) {
            setNotFound(true);
          } else {
            setValues(
              Object.fromEntries(
                fields.map((field) => [
                  field.name,
                  item[field.name] ?? "",
                ])
              )
            );
          }
        }
      } catch (error) {
        if (active) {
          console.error("Error al cargar el formulario:", error);

          setSaveError(
            error?.message || "No se pudieron cargar los datos."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [config, mode, id, service, fields]);

  const errors = submitted
    ? validate(fields, values)
    : {};

  const errorCount = Object.keys(errors).length;

  function handleChange(name, value) {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitted(true);
    setSaveError("");

    const validationErrors = validate(fields, values);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = Object.fromEntries(
      fields.map((field) => [
        field.name,
        String(values[field.name] ?? "").trim(),
      ])
    );

    console.log("Datos enviados al backend:", payload);

    setSaving(true);

    try {
      if (mode === "edit") {
        await service.update(id, payload);
      } else {
        await service.create(payload);
      }

      navigate(basePath);
    } catch (error) {
      console.error("Error al guardar:", error);
      console.error("Respuesta del servidor:", error?.data);

      setSaveError(
        error?.message || "No se pudo guardar. Intenta de nuevo."
      );

      setSaving(false);
    }
  }

  const IconoModulo = config.icon;

  return (
    <div className="max-w-3xl">
      <Link
        to={basePath}
        className="mb-5 inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-semibold text-luwi-texto transition hover:text-luwi-profundo focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        {config.backLabel}
      </Link>

      <div className="mb-6 flex items-center gap-4">
        {IconoModulo && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_10px_20px_-8px_rgba(34,43,184,0.7)]">
            <IconoModulo className="h-[22px] w-[22px]" />
          </span>
        )}
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo">
            {config.formTitles[mode]}
          </h1>
          <p className="mt-0.5 text-sm text-luwi-texto">
            {mode === "create" && "Completa los datos para crear un nuevo registro."}
            {mode === "edit" && "Modifica los datos del registro."}
            {mode === "view" && "Consulta los detalles del registro."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 rounded-[28px] border border-white bg-white/90 p-7 shadow-[0_14px_40px_-28px_rgba(17,22,82,0.6)]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-luwi-cristal-fondo" />
          ))}
        </div>
      ) : notFound ? (
        <div className="rounded-[28px] border border-white bg-white/90 p-8 text-center shadow-[0_14px_40px_-28px_rgba(17,22,82,0.6)]">
          <p className="font-semibold text-admin-ink">
            No se encontró el registro.
          </p>

          <Link
            to={basePath}
            className="mt-4 inline-block text-sm font-semibold text-admin-blue hover:underline"
          >
            Volver
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-[28px] border border-white bg-white/90 p-6 shadow-[0_14px_40px_-28px_rgba(17,22,82,0.6)] sm:p-8"
        >
          {saveError && (
            <div className="mb-6 rounded-xl border border-admin-danger/30 bg-admin-danger/5 px-4 py-3 text-sm text-admin-danger">
              {saveError}
            </div>
          )}

          {submitted && errorCount > 0 && (
            <div className="mb-6 rounded-xl border border-admin-danger/30 bg-admin-danger/5 px-4 py-3">
              <p className="text-sm font-semibold text-admin-danger">
                Revisa los campos marcados.
              </p>

              <p className="mt-1 text-xs text-admin-danger/80">
                Hay {errorCount}{" "}
                {errorCount === 1
                  ? "campo con error."
                  : "campos con errores."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {fields.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                options={
                  field.type === "select"
                    ? getOptions(field, lookups)
                    : []
                }
                disabled={readOnly}
                onChange={handleChange}
              />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-admin-line pt-5">
            <Link
              to={basePath}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-luwi-texto transition hover:bg-luwi-cristal-fondo hover:text-luwi-profundo"
            >
              {readOnly ? "Volver" : "Cancelar"}
            </Link>

            {!readOnly && (
              <ActionButton
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : mode === "edit"
                    ? "Guardar cambios"
                    : `Crear ${config.countWords?.[0] ?? "registro"}`}
              </ActionButton>
            )}
          </div>
        </form>
      )}
    </div>
  );
}