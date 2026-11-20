// Lógica de seguimiento del aprendizaje.
// Regla principal: el "estado" de un curso NO se envía desde el frontend,
// se calcula a partir del porcentaje de avance para que nunca se contradigan.

export const ESTADOS = {
  NO_INICIADO: "no iniciado",
  EN_PROGRESO: "en progreso",
  COMPLETADO: "completado",
};

export function estadoSegunAvance(porcentaje) {
  if (porcentaje >= 100) return ESTADOS.COMPLETADO;
  if (porcentaje > 0) return ESTADOS.EN_PROGRESO;
  return ESTADOS.NO_INICIADO;
}

// Recibe el registro actual y el nuevo porcentaje; devuelve los campos a guardar.
// - Al pasar de 0 a más de 0 se guarda la fecha de inicio (solo la primera vez).
// - Al llegar a 100 se guarda la fecha de finalización.
// - Si baja de 100 (corrección), se borra la fecha de finalización.
export function calcularCambiosDeAvance(registro, porcentaje) {
  const estado = estadoSegunAvance(porcentaje);
  const cambios = { porcentajeAvance: porcentaje, estado };

  if (porcentaje > 0 && !registro?.fechaInicio) {
    cambios.fechaInicio = new Date();
  }

  if (estado === ESTADOS.COMPLETADO) {
    if (!registro?.fechaFinalizacion) cambios.fechaFinalizacion = new Date();
  } else {
    cambios.fechaFinalizacion = null;
  }

  return cambios;
}

// Resumen del aprendizaje a partir de los registros (con el curso ya cargado con populate).
export function resumirProgreso(registros) {
  const validos = registros.filter((r) => r.curso); // ignora cursos borrados
  const contar = (estado) => validos.filter((r) => r.estado === estado).length;
  const horasDe = (r) => r.curso.duracionHoras || 0;

  const horasTotales = validos.reduce((t, r) => t + horasDe(r), 0);
  const horasCompletadas = validos.reduce(
    (t, r) => t + horasDe(r) * (r.porcentajeAvance / 100),
    0
  );
  const notas = validos
    .map((r) => r.calificacionEvaluacion)
    .filter((n) => typeof n === "number");

  const redondear = (n) => Math.round(n * 10) / 10;

  return {
    asignados: validos.length,
    completados: contar(ESTADOS.COMPLETADO),
    enProgreso: contar(ESTADOS.EN_PROGRESO),
    noIniciados: contar(ESTADOS.NO_INICIADO),
    // Promedio simple del avance de todos los cursos asignados (0-100).
    porcentajeGeneral: validos.length
      ? Math.round(validos.reduce((t, r) => t + r.porcentajeAvance, 0) / validos.length)
      : 0,
    horasTotales: redondear(horasTotales),
    horasCompletadas: redondear(horasCompletadas),
    promedioEvaluaciones: notas.length
      ? redondear(notas.reduce((a, b) => a + b, 0) / notas.length)
      : null,
  };
}
