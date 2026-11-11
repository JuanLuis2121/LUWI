import Empresa from "../models/Empresa.js";
import Puesto from "../models/Puesto.js";
import Curso from "../models/Curso.js";
import RutaAprendizaje from "../models/RutaAprendizaje.js";

const LIMITE_RECIENTES = 5;

// Cada módulo con el campo que se muestra como nombre en "Actividad reciente".
const MODULOS = [
  { clave: "empresas", tipo: "empresa", modelo: Empresa, campoNombre: "nombre" },
  { clave: "puestos", tipo: "puesto", modelo: Puesto, campoNombre: "titulo" },
  { clave: "cursos", tipo: "curso", modelo: Curso, campoNombre: "titulo" },
  { clave: "rutas", tipo: "ruta", modelo: RutaAprendizaje, campoNombre: "nombre" },
];

// GET /api/dashboard/resumen
// Respuesta: { empresas, puestos, cursos, rutas, recientes: [{ id, tipo, nombre, fecha }] }
export async function obtenerResumen(req, res) {
  try {
    const resultados = await Promise.all(
      MODULOS.map(async ({ modelo, campoNombre }) => {
        const [total, ultimos] = await Promise.all([
          modelo.countDocuments(),
          modelo
            .find()
            .sort({ createdAt: -1 })
            .limit(LIMITE_RECIENTES)
            .select(`${campoNombre} createdAt`)
            .lean(),
        ]);
        return { total, ultimos };
      })
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
  } catch {
    return res.status(500).json({
      message: "No se pudo obtener el resumen del dashboard.",
    });
  }
}
