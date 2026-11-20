// Cálculo del avance de formación (entrega 4).
// Funciones puras: reciben datos ya consultados y no tocan la base de datos.
//
// Reglas del documento:
//   avance = unidades obligatorias revisadas / total obligatorio asignado × 100
//   - Las unidades opcionales no cuentan.
//   - Los cursos BLOQUEADOS siguen contando en el total.
//   - Si no hay unidades obligatorias, el avance es 0 (sin dividir entre cero).
// Decisión propia: las unidades retiradas no cuentan (ni en el total ni como revisadas).

export const ESTADOS_CURSO_FORMACION = {
  BLOQUEADO: "BLOQUEADO",
  SIN_INICIAR: "SIN_INICIAR",
  EN_CURSO: "EN_CURSO",
  CONTENIDOS_REVISADOS: "CONTENIDOS_REVISADOS", // nunca "Aprobado": eso es de evaluaciones
};

const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);

// Unidades que cuentan para el avance: vigentes y obligatorias.
export const unidadesObligatorias = (unidades = []) =>
  unidades.filter((u) => !u.retirada && u.obligatoria !== false);

/**
 * @param {Array}  cursosAsignados   AsignacionRuta.cursos: [{ _id, curso, acceso, orden, ... }]
 * @param {Map}    unidadesPorCurso  cursoOriginalId (string) -> unidades del curso
 * @param {Set}    revisadas         ids (string) de unidades revisadas en esta asignación
 */
export function calcularAvance(cursosAsignados = [], unidadesPorCurso = new Map(), revisadas = new Set()) {
  let totalGeneral = 0;
  let revisadasGeneral = 0;

  const cursos = [...cursosAsignados]
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((ca) => {
      const unidades = unidadesPorCurso.get(String(ca.curso)) ?? [];
      const obligatorias = unidadesObligatorias(unidades);
      const hechas = obligatorias.filter((u) => revisadas.has(String(u._id))).length;
      const algunaRevisada = unidades.some((u) => !u.retirada && revisadas.has(String(u._id)));

      totalGeneral += obligatorias.length;
      revisadasGeneral += hechas;

      let estado;
      if (ca.acceso !== "HABILITADO") estado = ESTADOS_CURSO_FORMACION.BLOQUEADO;
      else if (obligatorias.length > 0 && hechas === obligatorias.length)
        estado = ESTADOS_CURSO_FORMACION.CONTENIDOS_REVISADOS;
      else if (algunaRevisada) estado = ESTADOS_CURSO_FORMACION.EN_CURSO;
      else estado = ESTADOS_CURSO_FORMACION.SIN_INICIAR;

      return {
        cursoAsignadoId: String(ca._id),
        cursoId: String(ca.curso),
        orden: ca.orden,
        acceso: ca.acceso,
        estado,
        totalObligatorias: obligatorias.length,
        revisadasObligatorias: hechas,
        porcentaje: porcentaje(hechas, obligatorias.length),
      };
    });

  return {
    porcentajeGeneral: porcentaje(revisadasGeneral, totalGeneral),
    totalObligatorias: totalGeneral,
    revisadasObligatorias: revisadasGeneral,
    cursosHabilitados: cursos.filter((c) => c.acceso === "HABILITADO").length,
    totalCursos: cursos.length,
    cursos,
  };
}
