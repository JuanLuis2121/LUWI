import { useState } from "react";
import ModalLuwi from "./ModalLuwi";
import { ActionButton } from "../AdminUI";
import { FieldError, Label, inputCls } from "../FormControls";
import { UsersIcon } from "./Piezas";
import { crearPostulante } from "../../services/procesosService";

const VACIO = { nombre: "", correo: "", telefono: "", habilidades: "", puestos: [] };
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registrar un postulante. El backend crea su cuenta pendiente y le envía la invitación por correo.
 * - puestos: [{ id, titulo }]
 * - onCreado(respuesta): la página recarga el pipeline y muestra el aviso.
 */
export default function NuevoPostulanteModal({ open, puestos, onClose, onCreado }) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!open) return null;

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErrores((x) => ({ ...x, [campo]: undefined }));
  };

  const alternarPuesto = (id) =>
    setForm((f) => ({ ...f, puestos: f.puestos.includes(id) ? f.puestos.filter((x) => x !== id) : [...f.puestos, id] }));

  const cerrar = () => {
    if (guardando) return;
    setForm(VACIO);
    setErrores({});
    setError("");
    onClose();
  };

  const guardar = async (e) => {
    e?.preventDefault();
    const nuevos = {};
    if (!form.nombre.trim()) nuevos.nombre = "Escribe el nombre completo.";
    if (!CORREO_VALIDO.test(form.correo.trim())) nuevos.correo = "Escribe un correo válido.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setGuardando(true);
    setError("");
    try {
      const respuesta = await crearPostulante({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || undefined,
        habilidades: form.habilidades
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
        puestosAplicados: form.puestos,
      });
      setForm(VACIO);
      setGuardando(false);
      await onCreado(respuesta);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <ModalLuwi
      open
      onClose={cerrar}
      bloqueado={guardando}
      icon={UsersIcon}
      title="Nuevo postulante"
      subtitle="Le enviaremos una invitación por correo para que active su cuenta."
      footer={
        <>
          <ActionButton onClick={cerrar} disabled={guardando}>
            Cancelar
          </ActionButton>
          <ActionButton variant="primary" onClick={guardar} disabled={guardando}>
            {guardando ? "Registrando..." : "Registrar e invitar"}
          </ActionButton>
        </>
      }
    >
      <form onSubmit={guardar} noValidate className="space-y-4">
        <div>
          <Label htmlFor="np-nombre" required>
            Nombre completo
          </Label>
          <input id="np-nombre" value={form.nombre} onChange={cambiar("nombre")} className={inputCls(errores.nombre)} placeholder="Ej. Ana Martínez" autoFocus />
          <FieldError>{errores.nombre}</FieldError>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="np-correo" required>
              Correo
            </Label>
            <input id="np-correo" type="email" value={form.correo} onChange={cambiar("correo")} className={inputCls(errores.correo)} placeholder="ana@correo.com" />
            <FieldError>{errores.correo}</FieldError>
          </div>
          <div>
            <Label htmlFor="np-telefono">Teléfono</Label>
            <input id="np-telefono" value={form.telefono} onChange={cambiar("telefono")} className={inputCls(false)} placeholder="809-000-0000" />
          </div>
        </div>
        <div>
          <Label htmlFor="np-habilidades">Habilidades</Label>
          <input id="np-habilidades" value={form.habilidades} onChange={cambiar("habilidades")} className={inputCls(false)} placeholder="Excel, atención al cliente, inglés" />
          <p className="mt-1.5 text-[11px] text-luwi-texto/70">Sepáralas con comas.</p>
        </div>
        {puestos.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold text-admin-ink">Puestos de interés</p>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {puestos.map((p) => {
                const activo = form.puestos.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => alternarPuesto(p.id)}
                    aria-pressed={activo}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      activo ? "border-luwi-tecno bg-luwi-cristal-fondo text-luwi-profundo" : "border-luwi-linea bg-white text-luwi-texto hover:border-luwi-tecno/40"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-4 w-4 items-center justify-center rounded-[5px] border-2 ${activo ? "border-luwi-medio bg-luwi-medio" : "border-luwi-linea bg-white"}`}
                    >
                      {activo && (
                        <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      )}
                    </span>
                    {p.titulo}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">{error}</p>}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </ModalLuwi>
  );
}
