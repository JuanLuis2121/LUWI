import {
  FormacionError,
  obtenerMiFormacion,
  obtenerCurso,
  marcarUnidadRevisada,
  guardarUltimaConsulta,
} from "../services/miFormacion.service.js";

// Convierte los errores del servicio en respuestas HTTP
const responderError = (res, error) => {
  if (error instanceof FormacionError) {
    return res
      .status(error.status)
      .json({ message: error.message, codigo: error.codigo });
  }

  console.error("Error en mi-formacion:", error);
  return res.status(500).json({
    message: "No pudimos cargar tu formación. Inténtalo nuevamente.",
  });
};

// GET /api/mi-formacion
export const getMiFormacion = async (req, res) => {
  try {
    const data = await obtenerMiFormacion(req.user);
    res.status(200).json({ data });
  } catch (error) {
    responderError(res, error);
  }
};

// GET /api/mi-formacion/:asignacionId/cursos/:cursoAsignadoId
export const getCursoAsignado = async (req, res) => {
  try {
    const { asignacionId, cursoAsignadoId } = req.params;
    const data = await obtenerCurso(req.user, asignacionId, cursoAsignadoId);
    res.status(200).json({ data });
  } catch (error) {
    responderError(res, error);
  }
};

// POST /api/mi-formacion/:asignacionId/cursos/:cursoAsignadoId/unidades/:unidadId/revision
export const postRevisionUnidad = async (req, res) => {
  try {
    const { asignacionId, cursoAsignadoId, unidadId } = req.params;
    const data = await marcarUnidadRevisada(
      req.user,
      asignacionId,
      cursoAsignadoId,
      unidadId
    );
    res.status(200).json({ data });
  } catch (error) {
    responderError(res, error);
  }
};

// PUT /api/mi-formacion/:asignacionId/ultima-consulta
export const putUltimaConsulta = async (req, res) => {
  try {
    const data = await guardarUltimaConsulta(
      req.user,
      req.params.asignacionId,
      req.body
    );
    res.status(200).json({ data });
  } catch (error) {
    responderError(res, error);
  }
};
