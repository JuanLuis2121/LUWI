import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import FormMessage from "../../components/FormMessage";
import ConfirmModal from "../../components/ConfirmModal";
import { ActionButton, Badge, Bubble } from "../../components/AdminUI";
import {
  actualizarUnidad,
  crearUnidad,
  desactivarCurso,
  getCursos,
  getUnidades,
  moverUnidad,
  publicarCurso,
  retirarUnidad,
  TIPOS_UNIDAD,
} from "../../services/cursosService";
import { errMsg } from "../../services/api";

const ESTADOS = ["TODOS", "BORRADOR", "PUBLICADO", "INACTIVO"];
const ETIQUETAS = { BORRADOR: "Borrador", PUBLICADO: "Publicado", INACTIVO: "Inactivo" };
const TONOS = {
  BORRADOR: "border-amber-200 bg-amber-50 text-amber-800",
  PUBLICADO: "border-emerald-200 bg-emerald-50 text-emerald-800",
  INACTIVO: "border-admin-line bg-admin-bg text-admin-muted",
};
const UNIDAD_VACIA = { titulo: "", tipo: "TEXTO", contenido: "", recursoUrl: "", obligatoria: true };

function Estado({ estado }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${TONOS[estado] ?? TONOS.BORRADOR}`}>{ETIQUETAS[estado] ?? "Borrador"}</span>;
}

function Dialog({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="unidad-dialog-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <header className="mb-5 flex items-center justify-between gap-4"><h2 id="unidad-dialog-title" className="text-xl font-bold text-admin-ink">{title}</h2><button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg px-2 text-2xl text-admin-muted hover:bg-admin-bg">×</button></header>
        {children}
      </section>
    </div>
  );
}

export default function CursosListPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [unitForm, setUnitForm] = useState(UNIDAD_VACIA);
  const [unitError, setUnitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [unitToRetire, setUnitToRetire] = useState(null);
  const [retiring, setRetiring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await getCursos());
    } catch (err) {
      setError(errMsg(err, "No se pudieron cargar los cursos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("es");
    return items.filter((item) => {
      const matchesText = !text || `${item.titulo} ${item.competencia} ${item.descripcion}`.toLocaleLowerCase("es").includes(text);
      return matchesText && (estado === "TODOS" || item.estado === estado);
    });
  }, [items, query, estado]);

  const closeDialog = useCallback(() => setDialog(null), []);

  async function changeState(item) {
    setError("");
    setNotice("");
    try {
      if (item.estado === "PUBLICADO") await desactivarCurso(item._id);
      else await publicarCurso(item._id);
      setNotice(item.estado === "PUBLICADO" ? "Curso desactivado; su contenido y avance se conservaron." : "Curso publicado correctamente.");
      await load();
    } catch (err) {
      setError(errMsg(err, "No se pudo actualizar el estado del curso."));
    }
  }

  async function openUnits(item) {
    setError("");
    setUnitError("");
    setDialog({ item, unit: null, loading: true });
    try {
      const result = await getUnidades(item._id);
      setUnidades(result?.unidades ?? []);
      setDialog({ item, unit: null, loading: false });
    } catch (err) {
      setUnidades([]);
      setDialog(null);
      setError(errMsg(err, "No se pudieron cargar las unidades."));
    }
  }

  function editUnit(unit) {
    setUnitForm({
      titulo: unit.titulo ?? "",
      tipo: unit.tipo ?? "TEXTO",
      contenido: unit.contenido ?? "",
      recursoUrl: unit.recursoUrl ?? "",
      obligatoria: unit.obligatoria !== false,
    });
    setUnitError("");
    setDialog((current) => ({ ...current, unit }));
  }

  async function saveUnit(event) {
    event.preventDefault();
    if (!dialog?.item) return;
    setSaving(true);
    setUnitError("");
    const payload = {
      titulo: unitForm.titulo.trim(),
      tipo: unitForm.tipo,
      obligatoria: unitForm.obligatoria,
      ...(unitForm.tipo === "TEXTO"
        ? { contenido: unitForm.contenido.trim() }
        : { recursoUrl: unitForm.recursoUrl.trim() }),
    };
    try {
      if (dialog.unit?._id) await actualizarUnidad(dialog.item._id, dialog.unit._id, payload);
      else await crearUnidad(dialog.item._id, payload);
      const result = await getUnidades(dialog.item._id);
      setUnidades(result?.unidades ?? []);
      setDialog((current) => ({ ...current, unit: null }));
      setUnitForm(UNIDAD_VACIA);
      setNotice(dialog.unit ? "Unidad actualizada." : "Unidad agregada al curso.");
      setItems(await getCursos());
    } catch (err) {
      setUnitError(errMsg(err, "No se pudo guardar la unidad."));
    } finally {
      setSaving(false);
    }
  }

  async function unitAction(unit, direction) {
    setUnitError("");
    try {
      if (action === "move") await moverUnidad(dialog.item._id, unit._id, direction);
      const result = await getUnidades(dialog.item._id);
      setUnidades(result?.unidades ?? []);
    } catch (err) {
      setUnitError(errMsg(err, "No se pudo actualizar la unidad."));
    }
  }

  async function confirmRetireUnit() {
    if (!dialog?.item || !unitToRetire) return;
    setRetiring(true);
    setUnitError("");
    try {
      await retirarUnidad(dialog.item._id, unitToRetire._id);
      const result = await getUnidades(dialog.item._id);
      setUnidades(result?.unidades ?? []);
      setItems(await getCursos());
      setNotice("Unidad retirada; se conserva el historial de avance.");
      setUnitToRetire(null);
    } catch (err) {
      setUnitError(errMsg(err, "No se pudo retirar la unidad."));
    } finally {
      setRetiring(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-4xl font-extrabold text-admin-ink">Cursos</h1><p className="mt-1 text-sm text-admin-muted">Administra cursos, unidades y publicación.</p></div>
        <ActionButton variant="primary" to="/dashboard/cursos/nuevo"><Icon name="plus" className="h-4 w-4" />Nuevo curso</ActionButton>
      </div>

      <div className="mb-4 space-y-2"><FormMessage type="error">{error}</FormMessage><FormMessage type="success">{notice}</FormMessage></div>

      <section className="mb-4 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-lg shadow-admin-blue/5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-admin-line bg-admin-bg px-4 py-2.5 focus-within:border-admin-blue focus-within:ring-4 focus-within:ring-admin-blue/10">
          <Icon name="search" className="h-[18px] w-[18px] text-admin-blue"/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, competencia…" aria-label="Buscar cursos" className="w-full bg-transparent text-sm outline-none"/>
        </label>
        <div className="flex flex-wrap items-center gap-2">{ESTADOS.map((value) => <button key={value} type="button" onClick={() => setEstado(value)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${estado === value ? "bg-admin-ink text-white" : "bg-admin-bg text-admin-muted hover:bg-admin-soft"}`}>{value === "TODOS" ? "Todos" : ETIQUETAS[value]}</button>)}</div>
      </section>

      <div className="mb-3 flex items-center justify-between px-1 text-xs font-semibold text-admin-muted"><span>{filtered.length} {filtered.length === 1 ? "curso" : "cursos"}</span><button type="button" onClick={load} className="hover:text-admin-blue">Actualizar</button></div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-admin-blue/10">
        {loading ? <p className="px-6 py-12 text-center text-sm text-admin-muted">Cargando cursos…</p> : filtered.length === 0 ? <div className="px-6 py-14 text-center"><Bubble><Icon name="book" className="h-4 w-4"/></Bubble><h2 className="mt-4 font-bold text-admin-ink">{query || estado !== "TODOS" ? "No encontramos cursos" : "Aún no hay cursos"}</h2><p className="mt-1 text-sm text-admin-muted">{query || estado !== "TODOS" ? "Prueba con otra búsqueda o filtro." : "Crea un curso borrador y agrega sus unidades para publicarlo."}</p></div> : <div className="divide-y divide-admin-border/70">{filtered.map((item) => {
          const editable = item.editable !== false;
          return <article key={item._id} className="flex flex-col gap-4 p-5 transition hover:bg-admin-bg/30 lg:flex-row lg:items-center">
            <Bubble><Icon name="book" className="h-4 w-4"/></Bubble>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-admin-ink">{item.titulo}</h2><Estado estado={item.estado}/><Badge>{item.alcance === "GLOBAL" ? "Global" : "Empresa"}</Badge></div><p className="mt-1 line-clamp-2 text-sm text-admin-muted">{item.descripcion}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-admin-muted"><span>{item.competencia}</span><span className="capitalize">{item.nivel}</span><span>{item.duracionHoras} h</span><span>{item.totalUnidades ?? 0} unidades · {item.unidadesObligatorias ?? 0} obligatorias</span></div></div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {editable ? <><ActionButton size="sm" to={`/dashboard/cursos/${item._id}/editar`} variant="edit">Editar</ActionButton><ActionButton size="sm" onClick={() => openUnits(item)}>Unidades</ActionButton><ActionButton size="sm" onClick={() => changeState(item)} variant={item.estado === "PUBLICADO" ? "secondary" : "primary"}>{item.estado === "PUBLICADO" ? "Desactivar" : "Publicar"}</ActionButton></> : <><Badge>Solo lectura</Badge><ActionButton size="sm" onClick={() => openUnits(item)}>Ver unidades</ActionButton></>}
            </div>
          </article>;
        })}</div>}
      </section>

      {dialog && <Dialog title={dialog.unit ? (dialog.unit._id ? "Editar unidad" : "Nueva unidad") : `Unidades · ${dialog.item.titulo}`} onClose={closeDialog}>
        {dialog.loading ? <p className="py-8 text-center text-sm text-admin-muted">Cargando unidades…</p> : dialog.unit ? <form onSubmit={saveUnit} className="space-y-4">
          <label className="block text-sm font-semibold text-admin-ink">Título<input value={unitForm.titulo} onChange={(e) => setUnitForm({ ...unitForm, titulo: e.target.value })} required minLength={3} maxLength={150} className="mt-1 w-full rounded-xl border border-admin-line px-3 py-2.5 font-normal outline-none focus:border-admin-blue"/></label>
          <label className="block text-sm font-semibold text-admin-ink">Tipo<select value={unitForm.tipo} onChange={(e) => setUnitForm({ ...unitForm, tipo: e.target.value, contenido: "", recursoUrl: "" })} className="mt-1 w-full rounded-xl border border-admin-line bg-white px-3 py-2.5 font-normal">{TIPOS_UNIDAD.map((tipo) => <option key={tipo} value={tipo}>{tipo === "TEXTO" ? "Texto" : tipo === "VIDEO" ? "Video" : "Enlace"}</option>)}</select></label>
          {unitForm.tipo === "TEXTO" ? <label className="block text-sm font-semibold text-admin-ink">Contenido<textarea value={unitForm.contenido} onChange={(e) => setUnitForm({ ...unitForm, contenido: e.target.value })} required minLength={10} rows={5} className="mt-1 w-full rounded-xl border border-admin-line px-3 py-2.5 font-normal outline-none focus:border-admin-blue"/></label> : <label className="block text-sm font-semibold text-admin-ink">URL del {unitForm.tipo === "VIDEO" ? "video" : "recurso"}<input type="url" value={unitForm.recursoUrl} onChange={(e) => setUnitForm({ ...unitForm, recursoUrl: e.target.value })} required placeholder="https://…" className="mt-1 w-full rounded-xl border border-admin-line px-3 py-2.5 font-normal outline-none focus:border-admin-blue"/></label>}
          <label className="flex items-center gap-2 text-sm text-admin-ink"><input type="checkbox" checked={unitForm.obligatoria} onChange={(e) => setUnitForm({ ...unitForm, obligatoria: e.target.checked })} className="accent-admin-blue"/>Cuenta para el avance obligatorio</label>
          <FormMessage type="error">{unitError}</FormMessage><div className="flex justify-end gap-2 border-t border-admin-border pt-4"><ActionButton onClick={() => setDialog((current) => ({ ...current, unit: null }))}>Cancelar</ActionButton><button type="submit" disabled={saving} className="rounded-full bg-[linear-gradient(135deg,#1D4ED8,#7C3AED)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Guardando…" : "Guardar unidad"}</button></div>
        </form> : <>
          <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm text-admin-muted">{unidades.length} {unidades.length === 1 ? "unidad" : "unidades"} vigentes</p><p className="mt-1 text-xs text-admin-muted">Las unidades retiradas conservan el historial de avance.</p></div>{dialog.item.editable !== false && <button type="button" onClick={() => { setUnitForm(UNIDAD_VACIA); setUnitError(""); setDialog((current) => ({ ...current, unit: { _id: "" } })); }} className="rounded-full bg-admin-ink px-4 py-2 text-sm font-semibold text-white">+ Agregar</button>}</div>
          <FormMessage type="error">{unitError}</FormMessage>
          {unidades.length === 0 ? <div className="rounded-2xl border border-dashed border-admin-line px-4 py-8 text-center text-sm text-admin-muted">Este curso aún no tiene unidades.</div> : <ol className="space-y-2">{unidades.map((unit, index) => <li key={unit._id} className="flex items-center gap-2 rounded-2xl border border-admin-border bg-admin-bg/50 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-admin-blue">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-admin-ink">{unit.titulo}</p><p className="text-xs text-admin-muted">{unit.tipo} · {unit.obligatoria ? "Obligatoria" : "Complementaria"}</p></div>{dialog.item.editable !== false && <><button type="button" title="Subir" aria-label="Subir unidad" disabled={index === 0} onClick={() => unitAction(unit, "subir")} className="rounded-lg px-2 py-1 text-admin-ink hover:bg-white disabled:opacity-30">↑</button><button type="button" title="Bajar" aria-label="Bajar unidad" disabled={index === unidades.length - 1} onClick={() => unitAction(unit, "bajar")} className="rounded-lg px-2 py-1 text-admin-ink hover:bg-white disabled:opacity-30">↓</button><button type="button" onClick={() => editUnit(unit)} className="rounded-lg px-2 py-1 text-xs font-semibold text-admin-blue hover:bg-white">Editar</button><button type="button" onClick={() => setUnitToRetire(unit)} className="rounded-lg px-2 py-1 text-xs font-semibold text-admin-danger hover:bg-white">Retirar</button></>}</li>)}</ol>}
          <div className="mt-5 flex justify-end border-t border-admin-border pt-4"><ActionButton onClick={closeDialog}>Cerrar</ActionButton></div>
        </>}
      </Dialog>}
      <ConfirmModal open={!!unitToRetire} title="Retirar unidad" confirmLabel="Retirar unidad" loading={retiring} message={unitToRetire ? `¿Quieres retirar “${unitToRetire.titulo}”? No se borrará el historial de avance de quienes ya la revisaron.` : ""} onConfirm={confirmRetireUnit} onCancel={() => { if (!retiring) setUnitToRetire(null); }} />
    </div>
  );
}
