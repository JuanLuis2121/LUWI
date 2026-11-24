import mongoose from "mongoose";
import RutaAprendizaje from "../models/RutaAprendizaje.js";
import Puesto from "../models/Puesto.js";
import Curso from "../models/Curso.js";
import "../models/Empresa.js";

const esIdValido = (id) =>
  typeof id === "string" && mongoose.isObjectIdOrHexString(id);

function filtroPuestos(user) {
  if (user?.role === "ADMIN") {
    return {};
  }

  const empresaId = user?.empresa?._id ?? user?.empresa;
  const rolesEmpresa = ["ADMIN-EMPRESA", "RRHH"];

  if (
    !rolesEmpresa.includes(user?.role) ||
    !mongoose.isObjectIdOrHexString(empresaId)
  ) {
    const error = new Error("No tienes acceso a las rutas de esta empresa.");
    error.status = 403;
    throw error;
  }

  return { empresa: empresaId };
}

async function filtroRutas(user) {
  if (user?.role === "ADMIN") {
    return {};
  }

  const puestosIds = await Puesto.distinct("_id", filtroPuestos(user));
  return { puesto: { $in: puestosIds } };
}

function cursosCompatibles(empresaId) {
  return {
    $or: [{ empresa: null }, { empresa: empresaId }],
  };
}

async function validarDatos(body, user) {
  const { nombre, descripcion, puesto, cursos } = body ?? {};

  if (
    typeof nombre !== "string" ||
    nombre.trim().length < 3 ||
    nombre.trim().length > 120
  ) {
    return { error: "El nombre debe tener entre 3 y 120 caracteres." };
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
    return { error: "Selecciona un puesto válido." };
  }

  if (!Array.isArray(cursos) || cursos.length === 0) {
    return { error: "Debes agregar al menos un curso." };
  }

  if (!cursos.every(esIdValido)) {
    return { error: "Uno o más identificadores de cursos no son válidos." };
  }

  const cursosNormalizados = cursos.map((id) => id.toLowerCase());

  if (new Set(cursosNormalizados).size !== cursosNormalizados.length) {
    return { error: "No puedes repetir cursos en la ruta." };
  }

  const puestoDoc = await Puesto.findOne({
    _id: puesto,
    ...filtroPuestos(user),
  })
    .select("empresa")
    .lean();

  if (!puestoDoc?.empresa) {
    return { error: "El puesto seleccionado no está disponible." };
  }

  const cursosDocs = await Curso.find({
    _id: { $in: cursosNormalizados },
    ...cursosCompatibles(puestoDoc.empresa),
  })
    .select("titulo estado")
    .lean();

  if (cursosDocs.length !== cursosNormalizados.length) {
    return { error: "Uno o más cursos no están disponibles para este puesto." };
  }

  const noPublicados = cursosDocs.filter(
    (curso) => curso.estado !== "PUBLICADO",
  );

  if (noPublicados.length > 0) {
    const titulos = noPublicados.map((curso) => `"${curso.titulo}"`).join(", ");
    return {
      error: `Solo se pueden agregar cursos publicados. Revisa: ${titulos}.`,
    };
  }

  return {
    datos: {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      puesto: puestoDoc._id,
      cursos: cursosNormalizados,
    },
  };
}

function conRelaciones(consulta, user) {
  const alcance = filtroPuestos(user);

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
      ...(alcance.empresa && { match: cursosCompatibles(alcance.empresa) }),
    });
}

function prepararRespuesta(ruta) {
  const datos = ruta.toObject();

  const duracionTotalHoras = datos.cursos.reduce((total, curso) => {
    const horas = curso?.duracionHoras;
    return total + (Number.isFinite(horas) && horas > 0 ? horas : 0);
  }, 0);

  return {
    ...datos,
    duracionTotalHoras: Math.round(duracionTotalHoras * 10) / 10,
  };
}

function responderError(res, error) {
  if (error.status === 403) {
    return res.status(403).json({ message: error.message });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors)[0]?.message ?? error.message,
    });
  }

  console.error("Error en rutas de aprendizaje:", error);
  return res.status(500).json({
    message: "No se pudo completar la operación. Inténtalo de nuevo.",
  });
}

export const listarRutas = async (req, res) => {
  try {
    const filtro = await filtroRutas(req.user);
    const rutas = await conRelaciones(
      RutaAprendizaje.find(filtro).sort({ createdAt: -1, _id: -1 }),
      req.user,
    );

    return res.json({ data: rutas.map(prepararRespuesta) });
  } catch (error) {
    return responderError(res, error);
  }
};

export const obtenerRuta = async (req, res) => {
  const { id } = req.params;

  if (!esIdValido(id)) {
    return res.status(400).json({
      message: "El identificador de la ruta no es válido.",
    });
  }

  try {
    const filtro = await filtroRutas(req.user);
    const ruta = await conRelaciones(
      RutaAprendizaje.findOne({ _id: id, ...filtro }),
      req.user,
    );

    if (!ruta) {
      return res.status(404).json({
        message: "No encontramos esta ruta de aprendizaje.",
      });
    }

    return res.json({ data: prepararRespuesta(ruta) });
  } catch (error) {
    return responderError(res, error);
  }
};

export const crearRuta = async (req, res) => {
  try {
    const resultado = await validarDatos(req.body, req.user);

    if (resultado.error) {
      return res.status(400).json({ message: resultado.error });
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

export const actualizarRuta = async (req, res) => {
  const { id } = req.params;

  if (!esIdValido(id)) {
    return res.status(400).json({
      message: "El identificador de la ruta no es válido.",
    });
  }

  try {
    const filtro = await filtroRutas(req.user);
    const resultado = await validarDatos(req.body, req.user);

    if (resultado.error) {
      return res.status(400).json({ message: resultado.error });
    }

    const ruta = await RutaAprendizaje.findOneAndUpdate(
      { _id: id, ...filtro },
      { $set: resultado.datos },
      { new: true, runValidators: true },
    );

    if (!ruta) {
      return res.status(404).json({
        message: "No encontramos esta ruta de aprendizaje.",
      });
    }

    return res.json({
      message: "Ruta de aprendizaje actualizada correctamente.",
      data: ruta,
    });
  } catch (error) {
    return responderError(res, error);
  }
};

export const eliminarRuta = async (req, res) => {
  const { id } = req.params;

  if (!esIdValido(id)) {
    return res.status(400).json({
      message: "El identificador de la ruta no es válido.",
    });
  }

  try {
    const filtro = await filtroRutas(req.user);
    const ruta = await RutaAprendizaje.findOneAndDelete({
      _id: id,
      ...filtro,
    });

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

export const obtenerOpciones = async (req, res) => {
  try {
    const alcance = filtroPuestos(req.user);
    const filtroCursos = { estado: "PUBLICADO" };

    if (alcance.empresa) {
      Object.assign(filtroCursos, cursosCompatibles(alcance.empresa));
    }

    const [puestos, cursos] = await Promise.all([
      Puesto.find(alcance)
        .select("titulo empresa")
        .populate("empresa", "nombre")
        .sort({ titulo: 1 })
        .lean(),

      Curso.find(filtroCursos)
        .select("titulo competencia nivel duracionHoras estado empresa")
        .sort({ titulo: 1 })
        .lean(),
    ]);

    return res.json({ data: { puestos, cursos } });
  } catch (error) {
    return responderError(res, error);
  }
};
