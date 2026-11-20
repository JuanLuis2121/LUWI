// Lógica común de la formación del postulante (entrega 4).
// La usan mi-formacion (postulante) y el progreso del proceso (RR. HH.).
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Candidato from "../models/Candidato.js";
import ProcesoFormacion from "../models/ProcesoFormacion.js";
import AsignacionRuta from "../models/AsignacionRuta.js";
import ProgresoUnidad from "../models/ProgresoUnidad.js";
import UltimaConsulta from "../models/UltimaConsulta.js";
import Curso from "../models/Curso.js";
import "../models/Empresa.js";
import "../models/Puesto.js";
import { calcularAvance } from "./avance.service.js";

export const esId = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);
const mismo = (a, b) => a != null && b != null && String(a) === String(b);

// Error con código HTTP y un "codigo" que el frontend puede usar para decidir qué mostrar.
export class ErrorFormacion extends Error {
  constructor(status, message, codigo, extra) {
    super(message);
    this.status = status;
    this.codigo = codigo;
    this.extra = extra;
  }
}

// Responde un ErrorFormacion o un 500 genérico.
export function responderError(res, error, mensaje500) {
  if (error instanceof ErrorFormacion) {
    return res.status(error.status).json({ message: error.message, codigo: error.codigo, ...error.extra });
  }
  return res.status(500).json({ message: mensaje500 });
}

// ---------- quién es el usuario de la sesión ----------
// requireAuth (Wallan) solo carga _id, username y email; aquí se leen rol, empresa y candidato.
// Cuando Wallan entregue sus controles reutilizables, esto puede sustituirse por ellos.
export async function perfilDeSesion(req) {
  const user = await User.findById(req.user._id).select("rol empresa candidato estadoCuenta").lean();
  if (!user) throw new ErrorFormacion(401, "El usuario de esta sesión ya no existe.");
  if (user.estadoCuenta === "DESACTIVADA") {
    throw new ErrorFormacion(403, "Tu cuenta está desactivada. Contacta a Recursos Humanos.", "CUENTA_DESACTIVADA");
  }
  return { ...user, rol: user.rol ?? "RRHH" };
}

// Perfil de postulante (Candidato) asociado al usuario.
async function candidatoDe(perfil) {
  if (perfil.candidato) return perfil.candidato;
  const c = await Candidato.findOne({ usuario: perfil._id }).select("_id").lean();
  return c?._id ?? null;
}

// ---------- unidades y avance ----------

// Mapa cursoOriginalId -> unidades del curso (incluye retiradas: el cálculo las descarta).
async function unidadesDeCursos(idsCursos) {
  const cursos = await Curso.find({ _id: { $in: idsCursos } }).select("unidades").lean();
  return new Map(cursos.map((c) => [String(c._id), c.unidades ?? []]));
}

// Ids (string) de las unidades revisadas en una asignación.
async function revisadasDe(asignacionId) {
  const regs = await ProgresoUnidad.find({ asignacion: asignacionId }).select("unidad").lean();
  return new Set(regs.map((r) => String(r.unidad)));
}

// Calcula el avance completo de una asignación.
export async function avanceDeAsignacion(asignacion) {
  const [unidadesPorCurso, revisadas] = await Promise.all([
    unidadesDeCursos(asignacion.cursos.map((c) => c.curso)),
    revisadasDe(asignacion._id),
  ]);
  return { avance: calcularAvance(asignacion.cursos, unidadesPorCurso, revisadas), unidadesPorCurso, revisadas };
}

// ---------- contexto del postulante ----------

// Proceso vigente del postulante de la sesión y su asignación ACTIVA (si existe).
// Si tiene varios procesos vigentes, se toma el más reciente.
export async function contextoPostulante(req) {
  const perfil = await perfilDeSesion(req);
  if (perfil.rol !== "POSTULANTE") {
    throw new ErrorFormacion(403, "Esta sección es solo para postulantes.", "SOLO_POSTULANTES");
  }

  const candidatoId = await candidatoDe(perfil);
  if (!candidatoId) throw new ErrorFormacion(404, "No encontramos tu perfil de postulante.", "SIN_PERFIL");

  const proceso = await ProcesoFormacion.findOne({ candidato: candidatoId, estado: { $in: ["ACTIVO", "SUSPENDIDO"] } })
    .sort({ createdAt: -1 })
    .populate("empresa", "nombre")
    .populate("puesto", "titulo")
    .lean();

  const asignacion = proceso
    ? await AsignacionRuta.findOne({ proceso: proceso._id, estado: "ACTIVA" }).lean()
    : null;

  return { perfil, candidatoId, proceso, asignacion };
}

// Comprueba que la asignación de la URL sea la del postulante, que el proceso esté activo
// y que el curso esté en la asignación. Con { habilitado: true } exige además acceso HABILITADO.
export async function verificarCursoDelPostulante(req, { habilitado = true } = {}) {
  const { asignacionId, cursoAsignadoId } = req.params;
  if (!esId(asignacionId) || !esId(cursoAsignadoId)) {
    throw new ErrorFormacion(404, "No encontramos ese curso en tu formación.", "NO_ENCONTRADO");
  }

  const ctx = await contextoPostulante(req);
  if (!ctx.proceso) throw new ErrorFormacion(404, "No tienes un proceso de formación vigente.", "SIN_PROCESO");
  if (!ctx.asignacion || !mismo(ctx.asignacion._id, asignacionId)) {
    throw new ErrorFormacion(404, "No encontramos ese curso en tu formación.", "NO_ENCONTRADO");
  }
  if (ctx.proceso.estado === "SUSPENDIDO") {
    throw new ErrorFormacion(403, "Tu proceso de formación está suspendido. Contacta a Recursos Humanos.", "PROCESO_SUSPENDIDO");
  }

  const cursoAsignado = ctx.asignacion.cursos.find((c) => mismo(c._id, cursoAsignadoId));
  if (!cursoAsignado) throw new ErrorFormacion(404, "No encontramos ese curso en tu formación.", "NO_ENCONTRADO");

  // Curso bloqueado: se puede mostrar el título, pero nunca textos ni URLs.
  if (habilitado && cursoAsignado.acceso !== "HABILITADO") {
    throw new ErrorFormacion(403, "Pendiente de habilitación por Recursos Humanos.", "CURSO_BLOQUEADO", {
      curso: { cursoAsignadoId: String(cursoAsignado._id), titulo: cursoAsignado.titulo, acceso: cursoAsignado.acceso },
    });
  }
  return { ...ctx, cursoAsignado };
}

// Última unidad consultada, solo si sigue siendo válida (curso habilitado y unidad vigente).
export async function ultimaConsultaValida(asignacion, unidadesPorCurso) {
  const ultima = await UltimaConsulta.findOne({ asignacion: asignacion._id }).lean();
  if (!ultima) return null;
  const ca = asignacion.cursos.find((c) => mismo(c._id, ultima.cursoAsignadoId));
  if (!ca || ca.acceso !== "HABILITADO") return null;
  const unidades = unidadesPorCurso.get(String(ca.curso)) ?? [];
  if (!unidades.some((u) => mismo(u._id, ultima.unidad) && !u.retirada)) return null;
  return { cursoAsignadoId: String(ultima.cursoAsignadoId), unidadId: String(ultima.unidad), fecha: ultima.fecha };
}
