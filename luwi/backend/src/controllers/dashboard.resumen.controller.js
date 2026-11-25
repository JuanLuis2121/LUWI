import mongoose from "mongoose";
import Empresa from "../models/Empresa.js";
import Puesto from "../models/Puesto.js";
import Curso from "../models/Curso.js";
import RutaAprendizaje from "../models/RutaAprendizaje.js";
import Candidato from "../models/Candidato.js";
import ProcesoFormacion, { ESTADOS_PROCESO } from "../models/ProcesoFormacion.js";
import AsignacionRuta from "../models/AsignacionRuta.js";
import Evaluacion from "../models/Evaluacion.js";
import IntentoEvaluacion from "../models/IntentoEvaluacion.js";
import {
  perfilDeSesion,
  responderError,
  avanceDeAsignacion,
  ErrorFormacion,
} from "../services/formacion.service.js";

const LIMITE_RECIENTES = 5;
const esId = (id) => typeof id === "string" && mongoose.isObjectIdOrHexString(id);

// Empresa sobre la que se calcula el resumen.
//   ADMIN: todas, o la que pida con ?empresa=.
//   RRHH / ADMIN-EMPRESA: siempre la suya (se ignora ?empresa= para que no vea otras).
function empresaDelResumen(perfil, empresaPedida) {
  if (perfil.role !== "ADMIN") return perfil.empresa?._id ?? perfil.empresa ?? null;
  return empresaPedida ?? null;
}

// Filtro de los módulos básicos según la empresa.
// Cursos: globales + los de esa empresa (regla de alcance de Cursos).
async function filtrosModulos(empresa) {
  if (!empresa) return { empresas: {}, puestos: {}, cursos: {}, rutas: {} };
  const idsPuestos = await Puesto.find({ empresa }).distinct("_id");
  return {
    empresas: { _id: empresa },
    puestos: { empresa },
    cursos: { empresa: { $in: [null, empresa] } },
    rutas: { puesto: { $in: idsPuestos } },
  };
}

// Cada módulo con el campo que se muestra como nombre en "Actividad reciente".
const MODULOS = [
  { clave: "empresas", tipo: "empresa", modelo: Empresa, campoNombre: "nombre" },
  { clave: "puestos", tipo: "puesto", modelo: Puesto, campoNombre: "titulo" },
  { clave: "cursos", tipo: "curso", modelo: Curso, campoNombre: "titulo" },
  { clave: "rutas", tipo: "ruta", modelo: RutaAprendizaje, campoNombre: "nombre" },
];

// ---------- Formación (entrega 5): procesos, cursos asignados, progreso y evaluaciones ----------

async function resumenFormacion({ empresa, puesto, estado, filtroCursos }) {
  const filtroProcesos = {
    ...(empresa && { empresa: new mongoose.Types.ObjectId(String(empresa)) }),
    ...(puesto && { puesto: new mongoose.Types.ObjectId(String(puesto)) }),
    ...(estado && { estado }),
  };

  const procesos = await ProcesoFormacion.find(filtroProcesos).select("_id estado candidato").lean();
  const idsProcesos = procesos.map((p) => p._id);
  const porEstado = (e) => procesos.filter((p) => p.estado === e).length;

  // Postulantes: sin filtros (ADMIN) se cuentan todos los registrados; con filtros, los de esos procesos.
  const sinFiltros = !empresa && !puesto && !estado;
  const postulantes = sinFiltros
    ? await Candidato.countDocuments()
    : new Set(procesos.map((p) => String(p.candidato))).size;

  // Cursos asignados (habilitados / pendientes) y progreso, sobre las asignaciones ACTIVAS
  const asignaciones = await AsignacionRuta.find({ proceso: { $in: idsProcesos }, estado: "ACTIVA" }).lean();
  let habilitados = 0;
  let pendientes = 0;
  const porcentajes = [];
  for (const a of asignaciones) {
    for (const c of a.cursos) c.acceso === "HABILITADO" ? habilitados++ : pendientes++;
    const { avance } = await avanceDeAsignacion(a);
    porcentajes.push(avance.porcentajeGeneral);
  }

  // Resultados de evaluaciones: nota oficial (la más alta) por asignación + evaluación
  const intentos = await IntentoEvaluacion.find({ proceso: { $in: idsProcesos } })
    .select("asignacion evaluacion estado calificacion resultado")
    .lean();
  const grupos = new Map();
  for (const i of intentos) {
    const k = `${i.asignacion}|${i.evaluacion}`;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(i);
  }
  const oficiales = [...grupos.values()].map((lista) => {
    const fin = lista.filter((i) => i.estado === "FINALIZADO");
    return fin.reduce((m, i) => (!m || i.calificacion > m.calificacion ? i : m), null);
  });
  const calificados = oficiales.filter(Boolean);

  const idsCursosVisibles = await Curso.find(filtroCursos).distinct("_id");
  const publicadas = await Evaluacion.countDocuments({ curso: { $in: idsCursosVisibles }, estado: "PUBLICADA" });

  const redondear = (n) => Math.round(n * 100) / 100;
  return {
    postulantes,
    procesos: {
      total: procesos.length,
      activos: porEstado("ACTIVO"),
      suspendidos: porEstado("SUSPENDIDO"),
      finalizados: porEstado("FINALIZADO"),
    },
    cursosAsignados: { total: habilitados + pendientes, habilitados, pendientes },
    progreso: {
      asignaciones: asignaciones.length,
      promedio: porcentajes.length ? Math.round(porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length) : 0,
      completos: porcentajes.filter((p) => p === 100).length,
      sinIniciar: porcentajes.filter((p) => p === 0).length,
    },
    evaluaciones: {
      publicadas,
      resultados: {
        total: grupos.size,
        aprobados: calificados.filter((i) => i.resultado === "APROBADO").length,
        reprobados: calificados.filter((i) => i.resultado === "REPROBADO").length,
        enCurso: grupos.size - calificados.length,
        promedio: calificados.length
          ? redondear(calificados.reduce((t, i) => t + i.calificacion, 0) / calificados.length)
          : null,
      },
    },
  };
}

// GET /api/dashboard/resumen?empresa=&puesto=&estado=
// Respuesta: { empresas, puestos, cursos, rutas, recientes,
//              postulantes, procesos, cursosAsignados, progreso, evaluaciones, filtros }
// Todos los números salen de la base de datos (nada escrito a mano).
export async function obtenerResumen(req, res) {
  try {
    const perfil = await perfilDeSesion(req);
    if (perfil.role === "POSTULANTE") {
      return res.status(403).json({ message: "No tienes permiso para acceder a esta sección." });
    }

    // ---- filtros opcionales ----
    const { empresa: empresaQ, puesto: puestoQ, estado: estadoQ } = req.query;
    if (empresaQ !== undefined && !esId(empresaQ)) throw new ErrorFormacion(400, "Empresa no válida.");
    if (puestoQ !== undefined && !esId(puestoQ)) throw new ErrorFormacion(400, "Puesto no válido.");
    if (estadoQ !== undefined && !ESTADOS_PROCESO.includes(estadoQ)) {
      throw new ErrorFormacion(400, `Estado no válido. Usa ${ESTADOS_PROCESO.join(", ")}.`);
    }

    const empresa = empresaDelResumen(perfil, empresaQ);
    if (puestoQ && empresa && !(await Puesto.exists({ _id: puestoQ, empresa }))) {
      throw new ErrorFormacion(404, "El puesto no existe en esta empresa.");
    }
    const filtros = await filtrosModulos(empresa);

    // ---- módulos básicos (lo que ya usa el dashboard) ----
    const resultados = await Promise.all(
      MODULOS.map(async ({ clave, modelo, campoNombre }) => {
        const filtro = filtros[clave];
        const [total, ultimos] = await Promise.all([
          modelo.countDocuments(filtro),
          modelo.find(filtro).sort({ createdAt: -1 }).limit(LIMITE_RECIENTES).select(`${campoNombre} createdAt`).lean(),
        ]);
        return { total, ultimos };
      })
    );

    const resumen = {};
    const recientes = [];
    MODULOS.forEach(({ clave, tipo, campoNombre }, i) => {
      resumen[clave] = resultados[i].total;
      for (const doc of resultados[i].ultimos) {
        recientes.push({ id: String(doc._id), tipo, nombre: doc[campoNombre], fecha: doc.createdAt });
      }
    });
    recientes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    resumen.recientes = recientes.slice(0, LIMITE_RECIENTES);

    // ---- formación (entrega 5) ----
    Object.assign(
      resumen,
      await resumenFormacion({ empresa, puesto: puestoQ, estado: estadoQ, filtroCursos: filtros.cursos })
    );
    resumen.filtros = { empresa: empresa ? String(empresa) : null, puesto: puestoQ ?? null, estado: estadoQ ?? null };

    return res.json(resumen);
  } catch (error) {
    return responderError(res, error, "No se pudo obtener el resumen del dashboard.");
  }
}
