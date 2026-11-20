import Empresa from "../models/Empresa.js";
import Puesto from "../models/Puesto.js";
import Curso from "../models/Curso.js";
import RutaAprendizaje from "../models/RutaAprendizaje.js";
import {
  perfilDeSesion,
  responderError,
} from "../services/formacion.service.js";

const LIMITE_RECIENTES = 5;

// Filtro de cada módulo según quién consulta.
//   ADMIN (o RRHH antiguo sin empresa): todo.
//   RRHH con empresa: solo su empresa, sus puestos y las rutas de esos puestos.
//   Los cursos todavía no tienen empresa ("alcance" pendiente con Wallan/Naomi): se muestran todos.
async function filtrosSegunRol(perfil) {
  if (perfil.role === "ADMIN" || !perfil.empresa) {
    return { empresas: {}, puestos: {}, cursos: {}, rutas: {} };
  }
  const idsPuestos = await Puesto.find({ empresa: perfil.empresa }).distinct(
    "_id",
  );
  return {
    empresas: { _id: perfil.empresa },
    puestos: { empresa: perfil.empresa },
    cursos: {},
    rutas: { puesto: { $in: idsPuestos } },
  };
}

// Cada módulo con el campo que se muestra como nombre en "Actividad reciente".
const MODULOS = [
  {
    clave: "empresas",
    tipo: "empresa",
    modelo: Empresa,
    campoNombre: "nombre",
  },
  { clave: "puestos", tipo: "puesto", modelo: Puesto, campoNombre: "titulo" },
  { clave: "cursos", tipo: "curso", modelo: Curso, campoNombre: "titulo" },
  {
    clave: "rutas",
    tipo: "ruta",
    modelo: RutaAprendizaje,
    campoNombre: "nombre",
  },
];

// GET /api/dashboard/resumen
// Respuesta: { empresas, puestos, cursos, rutas, recientes: [{ id, tipo, nombre, fecha }] }
export async function obtenerResumen(req, res) {
  try {
    const perfil = await perfilDeSesion(req);
    if (perfil.role === "POSTULANTE") {
      return res
        .status(403)
        .json({ message: "No tienes permiso para acceder a esta sección." });
    }
    const filtros = await filtrosSegunRol(perfil);

    const resultados = await Promise.all(
      MODULOS.map(async ({ clave, modelo, campoNombre }) => {
        const filtro = filtros[clave];
        const [total, ultimos] = await Promise.all([
          modelo.countDocuments(filtro),
          modelo
            .find(filtro)
            .sort({ createdAt: -1 })
            .limit(LIMITE_RECIENTES)
            .select(`${campoNombre} createdAt`)
            .lean(),
        ]);
        return { total, ultimos };
      }),
    );

    const resumen = {};
    const recientes = [];

    MODULOS.forEach(({ clave, tipo, campoNombre }, i) => {
      resumen[clave] = resultados[i].total;
      for (const doc of resultados[i].ultimos) {
        recientes.push({
          id: String(doc._id),
          tipo,
          nombre: doc[campoNombre],
          fecha: doc.createdAt,
        });
      }
    });

    // Se mezclan los cuatro módulos y se dejan solo los más nuevos.
    recientes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    resumen.recientes = recientes.slice(0, LIMITE_RECIENTES);

    return res.json(resumen);
  } catch (error) {
    return responderError(
      res,
      error,
      "No se pudo obtener el resumen del dashboard.",
    );
  }
}
