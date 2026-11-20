import Candidato from "../models/Candidato.js";
import Curso from "../models/Curso.js";
import Empresa from "../models/Empresa.js";
import Evaluacion from "../models/Evaluacion.js";
import Progreso from "../models/Progreso.js";
import Actividad from "../models/Actividad.js";

const TZ = "America/Santo_Domingo";
const META_MINUTOS = 30;
const NIVEL_REQUERIDO = { básico: 2, intermedio: 3, avanzado: 4 }; // nivel (0-5) que exige un curso de ese nivel
const MINIMO_APROBAR = 70;

// ---------- fechas (siempre como "YYYY-MM-DD" en hora de RD) ----------
const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const sumarDias = (dia, n) => {
  const d = new Date(`${dia}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const indiceSemana = (dia) => (new Date(`${dia}T00:00:00Z`).getUTCDay() + 6) % 7; // lunes = 0

// ---------- identificar al candidato a partir del JWT ----------
// Tu login usa el modelo User (email) y el candidato tiene "correo": se busca por id y, si no, por correo.
async function buscarCandidato(user) {
  let cand = user.id ? await Candidato.findById(user.id).catch(() => null) : null;
  if (!cand && user.email) cand = await Candidato.findOne({ correo: user.email });
  return cand;
}

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const promedio = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const horas = (n) => Math.round(n * 100) / 100;

export async function registrarActividad(user, minutos) {
  const cand = await buscarCandidato(user);
  if (!cand) return false;
  await Actividad.updateOne({ candidato: cand._id, dia: hoy() }, { $inc: { minutos } }, { upsert: true });
  return true;
}

export async function construirDashboard(user) {
  const cand = await buscarCandidato(user);
  if (!cand) return null;

  const [progresosRaw, actividades] = await Promise.all([
    Progreso.find({ candidato: cand._id }).populate("curso").sort({ createdAt: 1 }),
    Actividad.find({ candidato: cand._id }).sort({ dia: -1 }).limit(60),
  ]);
  const progresos = progresosRaw.filter((p) => p.curso); // ignora progresos de cursos borrados

  // puesto y empresa (Puesto no se compartió: se leen campos comunes con tolerancia)
  await cand.populate("puestosAplicados");
  const puesto = cand.puestosAplicados?.[0];
  const empresa = puesto ? await Empresa.findOne({ puestos: puesto._id }).select("nombre") : null;

  // ---------- progreso ----------
  const completados = progresos.filter((p) => p.estado === "completado").length;
  const horasEstudiadas = progresos.reduce((a, p) => a + (p.curso.duracionHoras || 0) * (p.porcentajeAvance / 100), 0);
  const horasRestantes = progresos.reduce((a, p) => a + (p.curso.duracionHoras || 0) * (1 - p.porcentajeAvance / 100), 0);

  // ---------- actividad semanal + racha ----------
  const hoyStr = hoy();
  const lunes = sumarDias(hoyStr, -indiceSemana(hoyStr));
  const porDia = new Map(actividades.map((a) => [a.dia, a.minutos]));
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const date = sumarDias(lunes, i);
    return { date, minutes: porDia.get(date) || 0 };
  });
  let racha = 0;
  let d = porDia.get(hoyStr) ? hoyStr : sumarDias(hoyStr, -1); // si hoy aún no estudia, no rompe la racha
  while (porDia.get(d) > 0) {
    racha++;
    d = sumarDias(d, -1);
  }

  // ---------- competencias (agrupadas por Curso.competencia) ----------
  const grupos = new Map();
  for (const p of progresos) {
    const g = grupos.get(p.curso.competencia) || [];
    g.push(p);
    grupos.set(p.curso.competencia, g);
  }
  const competencies = [...grupos.entries()].map(([nombre, ps]) => {
    const notas = ps.filter((p) => typeof p.calificacionEvaluacion === "number").map((p) => p.calificacionEvaluacion);
    const base = notas.length ? promedio(notas) : promedio(ps.map((p) => p.porcentajeAvance)); // 0-100
    return {
      id: nombre.toLowerCase().replace(/\s+/g, "-"),
      name: nombre,
      level: clamp(Math.round(base / 20), 0, 5),
      required: Math.max(...ps.map((p) => NIVEL_REQUERIDO[p.curso.nivel] ?? 2)),
    };
  });

  // ---------- ruta (un paso por curso asignado) ----------
  const iActual = progresos.findIndex((p) => p.estado !== "completado");
  const route = progresos.map((p, i) => ({
    id: String(p.curso._id),
    order: i + 1,
    title: p.curso.titulo,
    type: "course",
    status: p.estado === "completado" ? "done" : i === iActual ? "current" : i === iActual + 1 ? "next" : "pending",
    meta:
      p.estado === "completado"
        ? "Completado"
        : p.estado === "en progreso"
        ? `En curso · ${p.porcentajeAvance} %`
        : p.curso.duracionHoras
        ? `Curso · ${p.curso.duracionHoras} h`
        : "Curso",
  }));
  const actual = iActual >= 0 ? progresos[iActual] : null;

  // ---------- logros ----------
  const evals = await Evaluacion.find({ curso: { $in: progresos.map((p) => p.curso._id) } }).select("curso puntajeMinimoAprobar");
  const minimo = new Map(evals.map((e) => [String(e.curso), e.puntajeMinimoAprobar ?? MINIMO_APROBAR]));
  const aprobo = progresos.some((p) => typeof p.calificacionEvaluacion === "number" && p.calificacionEvaluacion >= (minimo.get(String(p.curso._id)) ?? MINIMO_APROBAR));
  const achievements = [
    { id: "iniciar", title: "Primer curso iniciado", description: "Ya empezaste tu formación", icon: "book", unlocked: progresos.some((p) => p.estado !== "no iniciado") },
    { id: "completar", title: "Primer curso completado", description: "Terminaste un curso completo", icon: "check", unlocked: completados > 0 },
    { id: "evaluacion", title: "Evaluación aprobada", description: "Superaste el puntaje mínimo", icon: "award", unlocked: aprobo },
    { id: "ruta", title: "Ruta completa", description: "Terminaste todos tus cursos", icon: "spark", unlocked: progresos.length > 0 && completados === progresos.length },
  ];

  return {
    candidate: {
      id: String(cand._id),
      firstName: cand.nombre.split(" ")[0],
      name: cand.nombre,
      initials: cand.nombre.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase(),
      position: puesto?.nombre || puesto?.titulo || "Tu puesto",
      company: empresa?.nombre || "",
    },
    progress: {
      percent: progresos.length ? Math.round(promedio(progresos.map((p) => p.porcentajeAvance))) : 0,
      completedSteps: completados,
      totalSteps: progresos.length,
      hoursStudied: horas(horasEstudiadas),
      hoursRemaining: horas(horasRestantes),
      streakDays: racha,
    },
    goalMinutes: META_MINUTOS,
    todayIndex: indiceSemana(hoyStr),
    weeklyActivity,
    competencies,
    currentCourse: actual
      ? { id: String(actual.curso._id), title: actual.curso.titulo, competency: actual.curso.competencia, percent: actual.porcentajeAvance, hours: actual.curso.duracionHoras || 0 }
      : null,
    route,
    achievements,
    suggestion: null, // pendiente: conectar el módulo de IA
  };
}
