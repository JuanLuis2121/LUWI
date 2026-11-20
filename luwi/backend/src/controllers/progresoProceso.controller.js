import ProcesoFormacion from "../models/ProcesoFormacion.js";
import AsignacionRuta from "../models/AsignacionRuta.js";
import Candidato from "../models/Candidato.js";
import {
  esId,
  ErrorFormacion,
  responderError,
  perfilDeSesion,
  avanceDeAsignacion,
} from "../services/formacion.service.js";

const mismo = (a, b) => a != null && b != null && String(a) === String(b);

// ¿Puede este usuario ver el proceso?
//   ADMIN: cualquiera.
//   RRHH: solo procesos de su empresa (una cuenta RRHH antigua sin empresa ve todos, por compatibilidad).
//   POSTULANTE: solo el suyo.
async function puedeVer(perfil, proceso) {
  if (perfil.role === "ADMIN") return true;
  if (perfil.role === "RRHH")
    return (
      !perfil.empresa ||
      mismo(perfil.empresa, proceso.empresa?._id ?? proceso.empresa)
    );
  if (perfil.role === "POSTULANTE") {
    const candidatoId =
      perfil.candidato ??
      (await Candidato.findOne({ usuario: perfil._id }).select("_id").lean())
        ?._id;
    return mismo(candidatoId, proceso.candidato?._id ?? proceso.candidato);
  }
  return false;
}

// GET /api/procesos-formacion/:procesoId/progreso
// Avance real del proceso para la ficha del postulante (RR. HH.).
export async function obtenerProgresoProceso(req, res) {
  try {
    const { procesoId } = req.params;
    if (!esId(procesoId))
      throw new ErrorFormacion(404, "El proceso no existe.", "NO_ENCONTRADO");

    const perfil = await perfilDeSesion(req);
    const proceso = await ProcesoFormacion.findById(procesoId)
      .populate("candidato", "nombre correo")
      .populate("empresa", "nombre")
      .populate("puesto", "titulo")
      .lean();

    // Si no existe o no tiene permiso se responde igual (404), para no revelar procesos de otras empresas.
    if (!proceso || !(await puedeVer(perfil, proceso))) {
      throw new ErrorFormacion(404, "El proceso no existe.", "NO_ENCONTRADO");
    }

    const data = {
      proceso: {
        id: String(proceso._id),
        estado: proceso.estado,
        fechaInicio: proceso.fechaInicio,
        postulante: proceso.candidato
          ? {
              id: String(proceso.candidato._id),
              nombre: proceso.candidato.nombre,
              correo: proceso.candidato.correo,
            }
          : null,
        empresa: proceso.empresa
          ? { id: String(proceso.empresa._id), nombre: proceso.empresa.nombre }
          : null,
        puesto: proceso.puesto
          ? { id: String(proceso.puesto._id), titulo: proceso.puesto.titulo }
          : null,
      },
      asignacion: null,
    };

    const asignacion = await AsignacionRuta.findOne({
      proceso: proceso._id,
      estado: "ACTIVA",
    }).lean();
    if (!asignacion) return res.json({ data });

    const { avance } = await avanceDeAsignacion(asignacion);
    const porId = new Map(asignacion.cursos.map((c) => [String(c._id), c]));

    data.asignacion = {
      id: String(asignacion._id),
      ruta: {
        id: String(asignacion.ruta),
        nombre: asignacion.estructura?.nombre,
      },
      fechaAsignacion: asignacion.fechaAsignacion,
      porcentaje: avance.porcentajeGeneral,
      totalObligatorias: avance.totalObligatorias,
      revisadasObligatorias: avance.revisadasObligatorias,
      cursosHabilitados: avance.cursosHabilitados,
      totalCursos: avance.totalCursos,
      cursos: avance.cursos.map((c) => {
        const ca = porId.get(c.cursoAsignadoId);
        return {
          cursoAsignadoId: c.cursoAsignadoId,
          titulo: ca.titulo,
          orden: ca.orden,
          duracionHoras: ca.duracionHoras,
          acceso: c.acceso,
          estado: c.estado,
          porcentaje: c.porcentaje,
          totalObligatorias: c.totalObligatorias,
          revisadasObligatorias: c.revisadasObligatorias,
        };
      }),
    };
    return res.json({ data });
  } catch (error) {
    return responderError(
      res,
      error,
      "No se pudo obtener el progreso del proceso.",
    );
  }
}
