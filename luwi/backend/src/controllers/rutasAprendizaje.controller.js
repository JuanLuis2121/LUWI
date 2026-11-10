import mongoose from "mongoose";
import RutaAprendizaje from "../models/RutaAprendizaje.js";
import Puesto from "../models/Puesto.js";
import Curso from "../models/Curso.js";
import "../models/Empresa.js";

const esIdValido = (id) =>
  typeof id === "string" &&
  mongoose.isObjectIdOrHexString(id);

// Comprueba los campos y las relaciones antes de guardar.
async function validarDatos(body) {
  const { nombre, descripcion, puesto, cursos } = body ?? {};

  if (
    typeof nombre !== "string" ||
    nombre.trim().length < 3 ||
    nombre.trim().length > 120
  ) {
    return {
      error: "El nombre debe tener entre 3 y 120 caracteres.",
    };
  }

  if (
    typeof descripcion !== "string" ||
    !descripcion.trim() ||
    descripcion.trim().length > 2000
  ) {
    return {
      error: "La descripción es obligatoria y admite hasta 2000 caracteres.",
    };
  }

  if (!esIdValido(puesto)) {
    return {
      error: "Selecciona un puesto válido.",
    };
  }

  if (!Array.isArray(cursos) || cursos.length === 0) {
    return {
      error: "Debes agregar al menos un curso.",
    };
  }

  if (!cursos.every(esIdValido)) {
    return {
      error: "Uno o más identificadores de cursos no son válidos.",
    };
  }

  // Normalizar evita aceptar el mismo ID con distintas mayúsculas.
  const cursosNormalizados = cursos.map((id) => id.toLowerCase());

  if (new Set(cursosNormalizados).size !== cursosNormalizados.length) {
    return {
      error: "No puedes repetir cursos en la ruta.",
    };
  }

  const [puestoExiste, cantidadCursos] = await Promise.all([
    Puesto.exists({ _id: puesto }),
    Curso.countDocuments({
      _id: { $in: cursosNormalizados },
    }),
  ]);

  if (!puestoExiste) {
    return {
      error: "El puesto seleccionado ya no existe.",
    };
  }

  if (cantidadCursos !== cursosNormalizados.length) {
    return {
      error: "Uno o más cursos seleccionados ya no existen.",
    };
  }

  return {
    datos: {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      puesto: puesto.toLowerCase(),
      cursos: cursosNormalizados,
    },
  };
}

// Incluye los datos necesarios para mostrarlos en el frontend.
function conRelaciones(consulta) {
  return consulta
    .populate({
      path: "puesto",
      select: "titulo empresa",
      populate: {
        path: "empresa",
        select: "nombre",
      },
    })
    .populate({
      path: "cursos",
      select: "titulo descripcion competencia nivel duracionHoras",
    });
}

function prepararRespuesta(ruta) {
  const datos = ruta.toObject();

  const duracionTotalHoras = datos.cursos.reduce((total, curso) => {
    const horas = curso?.duracionHoras;

    return total + (
      typeof horas === "number" &&
      Number.isFinite(horas) &&
      horas > 0
        ? horas
        : 0
    );
  }, 0);

  return {
    ...datos,
    duracionTotalHoras: Math.round(duracionTotalHoras * 10) / 10,
  };
}

function responderError(res, error) {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors)[0].message,
    });
  }

  return res.status(500).json({
    message: "No se pudo completar la operación. Inténtalo de nuevo.",
  });
}

// GET /api/rutas-aprendizaje
export const listarRutas = async (req, res) => {
  try {
    const rutas = await conRelaciones(
      RutaAprendizaje.find().sort({ createdAt: -1, _id: -1 })
    );

    return res.json({
      data: rutas.map(prepararRespuesta),
    });
  } catch (error) {
    return responderError(res, error);
  }
};

// GET /api/rutas-aprendizaje/:id
export const obtenerRuta = async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({
      message: "El identificador de la ruta no es válido.",
    });
  }

  try {
    const ruta = await conRelaciones(
      RutaAprendizaje.findById(req.params.id)
    );

    if (!ruta) {
      return res.status(404).json({
        message: "No encontramos esta ruta de aprendizaje.",
      });
    }

    return res.json({
      data: prepararRespuesta(ruta),
    });
  } catch (error) {
    return responderError(res, error);
  }
};

// POST /api/rutas-aprendizaje
export const crearRuta = async (req, res) => {
  try {
    const resultado = await validarDatos(req.body);

    if (resultado.error) {
      return res.status(400).json({
        message: resultado.error,
      });
    }

    const ruta = await RutaAprendizaje.create(resultado.datos);

    return res.status(201).json({
      message: "Ruta de aprendizaje creada correctamente.",
      data: ruta,
    });
  } catch (error) {
    return responderError(res, error);
  }
};

// PUT /api/rutas-aprendizaje/:id
// Recibe todos los campos del formulario.
export const actualizarRuta = async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({
      message: "El identificador de la ruta no es válido.",
    });
  }

  try {
    const ruta = await RutaAprendizaje.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        message: "No encontramos esta ruta de aprendizaje.",
      });
    }

    const resultado = await validarDatos(req.body);

    if (resultado.error) {
      return res.status(400).json({
        message: resultado.error,
      });
    }

    ruta.set(resultado.datos);
    await ruta.save();

    return res.json({
      message: "Ruta de aprendizaje actualizada correctamente.",
      data: ruta,
    });
  } catch (error) {
    return responderError(res, error);
  }
};

// DELETE /api/rutas-aprendizaje/:id
export const eliminarRuta = async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({
      message: "El identificador de la ruta no es válido.",
    });
  }

  try {
    const ruta = await RutaAprendizaje.findByIdAndDelete(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        message: "No encontramos esta ruta de aprendizaje.",
      });
    }

    return res.json({
      message: "Ruta de aprendizaje eliminada correctamente.",
    });
  } catch (error) {
    return responderError(res, error);
  }
};

// GET /api/rutas-aprendizaje/opciones
export const obtenerOpciones = async (req, res) => {
  try {
    const [puestos, cursos] = await Promise.all([
      Puesto.find()
        .select("titulo empresa")
        .populate("empresa", "nombre")
        .sort({ titulo: 1 })
        .lean(),

      Curso.find()
        .select("titulo competencia nivel duracionHoras")
        .sort({ titulo: 1 })
        .lean(),
    ]);

    return res.json({
      data: {
        puestos,
        cursos,
      },
    });
  } catch {
    return res.status(500).json({
      message: "No se pudieron cargar los puestos y cursos.",
    });
  }
};