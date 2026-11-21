import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCursos } from "../services/cursosService";
import { getRutas } from "../services/rutasService";
import { puestosService } from "../services/puestosService";
import { empresasService } from "../services/empresasService";

const CLAVE_LEIDAS = "luwi-notificaciones-leidas";
const DIA_MS = 864e5;
const DIAS_BORRADOR = 7; // un curso en borrador más de estos días genera aviso
const DIAS_NUEVOS = 7; // registros creados en estos días aparecen como novedad
const REFRESCO_MS = 60_000;

const idDe = (x) => String(x?._id ?? x?.id ?? x ?? "");
const diasDesde = (fecha) => Math.floor((Date.now() - new Date(fecha).getTime()) / DIA_MS);

function leerLeidas() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_LEIDAS) ?? "[]"));
  } catch {
    return new Set();
  }
}

function guardarLeidas(set) {
  try {
    // Se guardan como máximo 300 para no crecer sin límite
    localStorage.setItem(CLAVE_LEIDAS, JSON.stringify([...set].slice(-300)));
  } catch {
    // Sin almacenamiento: se pierden al recargar
  }
}

/** Construye los avisos a partir de los datos reales de la plataforma. */
function construir({ cursos, rutas, puestos, empresas }) {
  const avisos = [];
  const ahora = Date.now();

  // 1. Cursos que llevan mucho tiempo en borrador
  for (const c of cursos) {
    if ((c.estado ?? "BORRADOR") !== "BORRADOR" || !c.createdAt) continue;
    const dias = diasDesde(c.createdAt);
    if (dias < DIAS_BORRADOR) continue;
    avisos.push({
      id: `borrador-${idDe(c)}`,
      tipo: "alerta",
      titulo: `“${c.titulo}” sigue en borrador`,
      detalle: `Lleva ${dias} días sin publicarse.`,
      fecha: c.updatedAt ?? c.createdAt,
      to: `/dashboard/cursos/${idDe(c)}/unidades`,
    });
  }

  // 2. Puestos sin ruta de aprendizaje
  const conRuta = new Set(rutas.map((r) => idDe(r.puesto)));
  for (const p of puestos) {
    if (conRuta.has(idDe(p))) continue;
    avisos.push({
      id: `sin-ruta-${idDe(p)}`,
      tipo: "alerta",
      titulo: `El puesto “${p.titulo}” no tiene ruta`,
      detalle: "Sus candidatos aún no tienen formación asignada.",
      fecha: p.createdAt ?? new Date(ahora).toISOString(),
      to: "/dashboard/rutas/nuevo",
    });
  }

  // 3. Rutas sin cursos
  for (const r of rutas) {
    if ((r.cursos ?? []).length) continue;
    avisos.push({
      id: `ruta-vacia-${idDe(r)}`,
      tipo: "alerta",
      titulo: `La ruta “${r.nombre}” está vacía`,
      detalle: "Agrégale cursos publicados para que sea útil.",
      fecha: r.updatedAt ?? r.createdAt ?? new Date(ahora).toISOString(),
      to: `/dashboard/rutas/${idDe(r)}/editar`,
    });
  }

  // 4. Novedades recientes
  const nuevos = [
    ...empresas.map((e) => ({ x: e, texto: `Nueva empresa: ${e.nombre}`, to: `/dashboard/empresas/${idDe(e)}` })),
    ...puestos.map((p) => ({ x: p, texto: `Nuevo puesto: ${p.titulo}`, to: `/dashboard/puestos/${idDe(p)}` })),
    ...cursos.map((c) => ({ x: c, texto: `Nuevo curso: ${c.titulo}`, to: `/dashboard/cursos/${idDe(c)}/unidades` })),
    ...rutas.map((r) => ({ x: r, texto: `Nueva ruta: ${r.nombre}`, to: `/dashboard/rutas/${idDe(r)}` })),
  ];
  for (const n of nuevos) {
    if (!n.x.createdAt || diasDesde(n.x.createdAt) > DIAS_NUEVOS) continue;
    avisos.push({
      id: `nuevo-${idDe(n.x)}`,
      tipo: "novedad",
      titulo: n.texto,
      detalle: "Registro creado recientemente.",
      fecha: n.x.createdAt,
      to: n.to,
    });
  }

  return avisos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

/**
 * Centro de notificaciones del panel administrativo.
 * Devuelve los avisos, cuáles están sin leer y funciones para marcarlos.
 */
export default function useNotificaciones() {
  const [avisos, setAvisos] = useState([]);
  const [leidas, setLeidas] = useState(leerLeidas);
  const [cargando, setCargando] = useState(true);
  const ultimaCarga = useRef(0);

  const cargar = useCallback(async (forzar = false) => {
    if (!forzar && Date.now() - ultimaCarga.current < REFRESCO_MS) return;
    ultimaCarga.current = Date.now();
    const [cursos, rutas, puestos, empresas] = await Promise.allSettled([
      getCursos(),
      getRutas(),
      puestosService.list(),
      empresasService.list(),
    ]);
    const ok = (r) => (r.status === "fulfilled" ? r.value : []);
    setAvisos(construir({ cursos: ok(cursos), rutas: ok(rutas), puestos: ok(puestos), empresas: ok(empresas) }));
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar(true);
    const t = setInterval(() => cargar(true), REFRESCO_MS * 5);
    return () => clearInterval(t);
  }, [cargar]);

  const marcar = useCallback((ids) => {
    setLeidas((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => n.add(id));
      guardarLeidas(n);
      return n;
    });
  }, []);

  const sinLeer = useMemo(() => avisos.filter((a) => !leidas.has(a.id)), [avisos, leidas]);

  return {
    avisos,
    sinLeer,
    esLeida: (id) => leidas.has(id),
    cargando,
    refrescar: () => cargar(false),
    marcarLeida: (id) => marcar([id]),
    marcarTodas: () => marcar(avisos.map((a) => a.id)),
  };
}
