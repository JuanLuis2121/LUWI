// Reglas y textos del pipeline de postulantes.

export const ETAPAS = [
  {
    key: "NUEVO",
    titulo: "Nuevos",
    ayuda: "Sin proceso",
    punto: "bg-slate-400",
    barra: "from-slate-300 to-slate-400",
    vacio: "Los postulantes registrados aparecen aquí",
  },
  {
    key: "POR_ASIGNAR",
    titulo: "Por asignar ruta",
    ayuda: "Proceso iniciado",
    punto: "bg-amber-400",
    barra: "from-amber-300 to-amber-500",
    vacio: "Arrastra un postulante para iniciar su proceso",
  },
  {
    key: "EN_FORMACION",
    titulo: "En formación",
    ayuda: "Ruta asignada",
    punto: "bg-luwi-tecno",
    barra: "from-luwi-medio to-luwi-tecno",
    vacio: "Arrastra aquí para asignar una ruta",
  },
  {
    key: "LISTO",
    titulo: "Listos",
    ayuda: "Ruta completada",
    punto: "bg-emerald-500",
    barra: "from-emerald-400 to-emerald-500",
    vacio: "Arrastra aquí para finalizar el proceso",
  },
];

export const ETAPA_POR_KEY = Object.fromEntries(ETAPAS.map((e) => [e.key, e]));

export const ESTADO_PROCESO = {
  ACTIVO: { label: "Activo", cls: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  SUSPENDIDO: { label: "Suspendido", cls: "bg-amber-50 text-amber-700 ring-amber-100" },
  FINALIZADO: { label: "Finalizado", cls: "bg-luwi-cristal-fondo text-luwi-profundo ring-luwi-cristal" },
};

export const CUENTA = {
  PENDIENTE: { label: "Invitación pendiente", corto: "Invitado", cls: "bg-amber-50 text-amber-700 ring-amber-100" },
  ACTIVA: { label: "Cuenta activa", corto: "Activa", cls: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  DESACTIVADA: { label: "Cuenta desactivada", corto: "Desactivada", cls: "bg-red-50 text-red-600 ring-red-100" },
  SIN_CUENTA: { label: "Sin cuenta", corto: "Sin cuenta", cls: "bg-slate-50 text-slate-600 ring-slate-200" },
};

/**
 * Une procesos y postulantes sin proceso en una sola lista de tarjetas.
 * Cada tarjeta: { key, tipo: "proceso" | "candidato", etapa, nombre, correo, postulante, proceso }
 */
export function armarTarjetas({ procesos, candidatosSinProceso }) {
  const deProcesos = procesos.map((p) => ({
    key: `p-${p.id}`,
    tipo: "proceso",
    etapa: p.etapa,
    nombre: p.postulante?.nombre ?? "Postulante",
    correo: p.postulante?.correo ?? "",
    postulante: p.postulante,
    proceso: p,
    fecha: p.actualizadoEn ?? p.fechaInicio,
  }));
  const nuevos = candidatosSinProceso.map((c) => ({
    key: `c-${c.id}`,
    tipo: "candidato",
    etapa: "NUEVO",
    nombre: c.nombre,
    correo: c.correo,
    postulante: c,
    proceso: null,
    fecha: c.creadoEn,
  }));
  return [...nuevos, ...deProcesos];
}

/**
 * Qué hacer al soltar una tarjeta en otra columna.
 * Devuelve { accion, mensaje? }:
 *   "iniciar" | "iniciar-y-asignar" | "asignar" | "finalizar" | "reabrir" | "ninguna" | "bloqueado"
 */
export function accionAlSoltar(tarjeta, destino) {
  const origen = tarjeta.etapa;
  if (origen === destino) return { accion: "ninguna" };

  const p = tarjeta.proceso;
  if (p?.estado === "SUSPENDIDO") {
    return { accion: "bloqueado", mensaje: "Reactiva el proceso antes de moverlo de etapa." };
  }
  if (destino === "NUEVO") {
    return { accion: "bloqueado", mensaje: "Un proceso iniciado no puede volver a Nuevos. Puedes suspenderlo desde la ficha." };
  }

  if (origen === "NUEVO") {
    if (destino === "POR_ASIGNAR") return { accion: "iniciar" };
    if (destino === "EN_FORMACION") return { accion: "iniciar-y-asignar" };
    return { accion: "bloqueado", mensaje: "Primero inicia el proceso y asigna una ruta." };
  }

  if (destino === "LISTO") return { accion: "finalizar" };

  if (origen === "LISTO") {
    if (p?.estado === "FINALIZADO") return { accion: "reabrir" };
    return { accion: "bloqueado", mensaje: "Este postulante completó su ruta; ya está listo." };
  }

  if (origen === "POR_ASIGNAR" && destino === "EN_FORMACION") return { accion: "asignar" };
  if (origen === "EN_FORMACION" && destino === "POR_ASIGNAR") {
    return { accion: "bloqueado", mensaje: "La ruta ya está asignada. Puedes reemplazarla desde la ficha completa." };
  }
  return { accion: "ninguna" };
}

export const iniciales = (nombre = "") =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

// Colores de avatar estables según el nombre.
const AVATARES = [
  "from-luwi-profundo to-luwi-medio",
  "from-luwi-medio to-luwi-tecno",
  "from-[#0b5bd3] to-[#5b8def]",
  "from-[#063a7a] to-[#009cff]",
  "from-[#1d4fb8] to-[#7cc4ff]",
];
export function colorAvatar(nombre = "") {
  let h = 0;
  for (const ch of nombre) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATARES[h % AVATARES.length];
}

export function tiempoRelativo(fecha) {
  if (!fecha) return "";
  const ms = Date.now() - new Date(fecha).getTime();
  if (Number.isNaN(ms)) return "";
  const min = Math.round(ms / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  const m = Math.round(d / 30);
  if (m < 12) return `hace ${m} ${m === 1 ? "mes" : "meses"}`;
  const a = Math.round(m / 12);
  return `hace ${a} ${a === 1 ? "año" : "años"}`;
}

export function diasDesde(fecha) {
  if (!fecha) return null;
  const d = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  return Number.isNaN(d) ? null : Math.max(0, d);
}

export const formatoFecha = (fecha) =>
  fecha
    ? new Date(fecha).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })
    : "—";

// Columnas del CSV exportado.
export const COLUMNAS_EXPORTAR = [
  { label: "Postulante", value: (t) => t.nombre },
  { label: "Correo", value: (t) => t.correo },
  { label: "Teléfono", value: (t) => t.postulante?.telefono ?? "" },
  { label: "Etapa", value: (t) => ETAPA_POR_KEY[t.etapa]?.titulo ?? t.etapa },
  { label: "Estado del proceso", value: (t) => (t.proceso ? ESTADO_PROCESO[t.proceso.estado]?.label : "Sin proceso") },
  { label: "Puesto", value: (t) => t.proceso?.puesto?.titulo ?? "" },
  { label: "Empresa", value: (t) => t.proceso?.empresa?.nombre ?? "" },
  { label: "Ruta", value: (t) => t.proceso?.asignacion?.ruta?.nombre ?? "" },
  { label: "Avance (%)", value: (t) => t.proceso?.asignacion?.porcentaje ?? "" },
  { label: "Cuenta", value: (t) => CUENTA[t.postulante?.cuenta]?.label ?? "" },
  { label: "Inicio del proceso", value: (t) => (t.proceso ? formatoFecha(t.proceso.fechaInicio) : "") },
];
