// Datos personales del espacio del postulante que se guardan SOLO en este navegador
// (no tocan la base de datos): días con actividad, meta semanal, ritmo de estudio,
// ánimo del día y color del avatar. Todo se guarda por usuario.

const PREFIJO = "luwi-esp";

const clave = (uid, nombre) => `${PREFIJO}-${uid || "anon"}-${nombre}`;

function leer(uid, nombre, inicial) {
  try {
    const v = localStorage.getItem(clave(uid, nombre));
    return v == null ? inicial : JSON.parse(v);
  } catch {
    return inicial;
  }
}

function guardar(uid, nombre, valor) {
  try {
    localStorage.setItem(clave(uid, nombre), JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

// ---------- fechas ----------

export const diaDe = (fecha = new Date()) => {
  const f = new Date(fecha);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
};

const sumarDias = (fecha, n) => {
  const f = new Date(fecha);
  f.setDate(f.getDate() + n);
  return f;
};

/** Lunes de la semana de la fecha. */
export function lunesDe(fecha = new Date()) {
  const f = new Date(fecha);
  const dia = (f.getDay() + 6) % 7; // lunes = 0
  f.setHours(0, 0, 0, 0);
  return sumarDias(f, -dia);
}

/** Los 7 días (lunes a domingo) de la semana actual. */
export function semanaActual() {
  const lunes = lunesDe();
  const nombres = ["L", "M", "M", "J", "V", "S", "D"];
  return nombres.map((letra, i) => {
    const fecha = sumarDias(lunes, i);
    return { letra, dia: diaDe(fecha), fecha };
  });
}

// ---------- actividad ----------

/** Registra el día de hoy como día con actividad. Devuelve la lista de días. */
export function registrarVisita(uid) {
  const dias = new Set(leer(uid, "dias", []));
  dias.add(diaDe());
  const lista = [...dias].sort().slice(-90);
  guardar(uid, "dias", lista);
  return lista;
}

export const leerDias = (uid) => leer(uid, "dias", []);

/** Días seguidos con actividad hasta hoy (o hasta ayer si hoy aún no hay). */
export function calcularRacha(dias) {
  const set = new Set(dias);
  let cursor = new Date();
  if (!set.has(diaDe(cursor))) cursor = sumarDias(cursor, -1);
  let racha = 0;
  while (set.has(diaDe(cursor))) {
    racha += 1;
    cursor = sumarDias(cursor, -1);
  }
  return racha;
}

// ---------- meta semanal (unidades) ----------

export const OPCIONES_META = [2, 3, 5, 8];
export const leerMeta = (uid) => leer(uid, "meta", 3);
export const guardarMeta = (uid, v) => guardar(uid, "meta", v);

/**
 * Unidades revisadas en esta semana. Guarda cuántas llevaba el postulante
 * la primera vez que entró en la semana y compara con las de ahora.
 */
export function avanceSemanal(uid, unidadesRevisadas) {
  const lunes = diaDe(lunesDe());
  let registro = leer(uid, "semana", null);
  if (!registro || registro.inicio !== lunes || unidadesRevisadas < registro.base) {
    registro = { inicio: lunes, base: unidadesRevisadas };
    guardar(uid, "semana", registro);
  }
  return Math.max(0, unidadesRevisadas - registro.base);
}

// ---------- ritmo de estudio (minutos al día) ----------

export const OPCIONES_RITMO = [
  { valor: 30, label: "30 min" },
  { valor: 60, label: "1 h" },
  { valor: 120, label: "2 h" },
];
export const leerRitmo = (uid) => leer(uid, "ritmo", 60);
export const guardarRitmo = (uid, v) => guardar(uid, "ritmo", v);

/** Fecha aproximada de fin según las horas restantes y el ritmo diario. */
export function finEstimado(horasRestantes, minutosDia) {
  if (horasRestantes <= 0) return "¡Completado!";
  const dias = Math.ceil((horasRestantes * 60) / (minutosDia || 60));
  const fecha = sumarDias(new Date(), dias);
  return fecha.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}

// ---------- ánimo del día ----------

export const ANIMOS = [
  { valor: 1, emoji: "😴", label: "Cansado", respuesta: "Hoy basta con una unidad corta. Lo importante es no perder el ritmo." },
  { valor: 2, emoji: "😐", label: "Normal", respuesta: "Un paso a la vez. Revisa una unidad y date un respiro." },
  { valor: 3, emoji: "🙂", label: "Bien", respuesta: "¡Buen día para avanzar! Intenta terminar la unidad en la que vas." },
  { valor: 4, emoji: "😄", label: "Motivado", respuesta: "¡Aprovecha esa energía! Hoy podrías cerrar un curso completo." },
  { valor: 5, emoji: "🚀", label: "A tope", respuesta: "¡Imparable! Ponte una meta ambiciosa y tómala con calma." },
];

export function leerAnimo(uid) {
  const a = leer(uid, "animo", null);
  return a?.fecha === diaDe() ? a.valor : null;
}
export const guardarAnimo = (uid, valor) => guardar(uid, "animo", { fecha: diaDe(), valor });

// ---------- avatar ----------

export const PALETAS_AVATAR = [
  "from-luwi-tecno to-luwi-medio",
  "from-luwi-profundo to-luwi-tecno",
  "from-[#5b8def] to-[#0b3a8c]",
  "from-[#7cc8ff] to-[#0b5bd3]",
  "from-[#00b4d8] to-[#0b5bd3]",
  "from-[#1d4fb8] to-[#061a45]",
];
export const leerAvatar = (uid) => leer(uid, "avatar", 0);
export const guardarAvatar = (uid, v) => guardar(uid, "avatar", v);

// ---------- notas personales (las escribe el reproductor de cursos) ----------

export function contarNotas(asignacionId) {
  if (!asignacionId) return 0;
  const prefijo = `luwi-nota-${asignacionId}-`;
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefijo) && (localStorage.getItem(k) ?? "").trim()) total += 1;
    }
  } catch {
    return 0;
  }
  return total;
}

// ---------- consejos ----------

export const CONSEJOS = [
  { titulo: "Bloques cortos", texto: "Estudia en bloques de 25 minutos con 5 de descanso. Tu memoria lo agradece." },
  { titulo: "Explícalo con tus palabras", texto: "Al terminar una unidad, resume en una nota lo que aprendiste. Si lo puedes explicar, lo dominas." },
  { titulo: "Mismo lugar, misma hora", texto: "Tener un horario fijo convierte el estudio en hábito y reduce la pereza de empezar." },
  { titulo: "Conecta con tu puesto", texto: "Piensa en una situación real de tu futuro puesto donde aplicarías lo que acabas de ver." },
  { titulo: "Repasa antes de seguir", texto: "Dedica 2 minutos a leer tus notas de ayer antes de abrir una unidad nueva." },
  { titulo: "Celebra los avances", texto: "Cada unidad cuenta. Mirar tu progreso te ayuda a mantener la motivación." },
  { titulo: "Sin distracciones", texto: "Silencia el celular mientras estudias: 20 minutos de foco valen más que una hora interrumpida." },
];

/** Consejo del día (cambia cada día) con desplazamiento opcional. */
export function consejoDelDia(desplazamiento = 0) {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), 0, 0);
  const diaDelAnio = Math.floor((hoy - inicio) / 864e5);
  const i = (((diaDelAnio + desplazamiento) % CONSEJOS.length) + CONSEJOS.length) % CONSEJOS.length;
  return CONSEJOS[i];
}

// ---------- logros ----------

/**
 * Logros del postulante con su progreso.
 * Los de formación salen de los datos reales; los de hábito, de este navegador.
 */
export function calcularLogros({ resumen, porcentaje = 0, racha = 0, diasSemana = 0, notas = 0, metaCumplida = false }) {
  const cursos = resumen?.cursos ?? [];
  const lista = [
    { id: "inicio", titulo: "Primer paso", detalle: "Revisa tu primera unidad", actual: Math.min(resumen?.unidadesRevisadas ?? 0, 1), meta: 1, tipo: "formacion" },
    { id: "curso", titulo: "Curso completado", detalle: "Termina un curso completo", actual: Math.min(resumen?.completados ?? 0, 1), meta: 1, tipo: "formacion" },
    { id: "mitad", titulo: "Mitad del camino", detalle: "Llega al 50% de tu ruta", actual: Math.min(porcentaje, 50), meta: 50, unidad: "%", tipo: "formacion" },
    { id: "ruta", titulo: "Ruta completa", detalle: "Termina todos tus cursos", actual: resumen?.completados ?? 0, meta: Math.max(cursos.length, 1), tipo: "formacion" },
    { id: "racha", titulo: "Constancia", detalle: "Estudia 3 días seguidos", actual: Math.min(racha, 3), meta: 3, tipo: "habito" },
    { id: "semana", titulo: "Semana activa", detalle: "Entra 5 días en una semana", actual: Math.min(diasSemana, 5), meta: 5, tipo: "habito" },
    { id: "notas", titulo: "Buen apuntador", detalle: "Escribe 3 notas personales", actual: Math.min(notas, 3), meta: 3, tipo: "habito" },
    { id: "meta", titulo: "Meta cumplida", detalle: "Cumple tu meta semanal", actual: metaCumplida ? 1 : 0, meta: 1, tipo: "habito" },
  ];
  return lista.map((l) => ({ ...l, logrado: l.actual >= l.meta, progreso: Math.round((Math.min(l.actual, l.meta) / l.meta) * 100) }));
}
