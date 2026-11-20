// Cálculos compartidos de la formación del postulante (Inicio y Mi formación).
// Todo sale de la respuesta de /api/mi-formacion; no se inventa ningún dato.

export const ESTADO_CURSO = {
  SIN_INICIAR: "SIN_INICIAR",
  EN_CURSO: "EN_CURSO",
  REVISADO: "CONTENIDOS_REVISADOS",
};

export const formatoHoras = (h) => {
  const n = Math.round((Number(h) || 0) * 10) / 10;
  return `${n.toLocaleString("es-DO")} ${n === 1 ? "hora" : "horas"}`;
};

/** Situación de un curso para pintarlo: "hecho", "actual", "disponible" o "bloqueado". */
export function situacionCurso(curso, actualId) {
  if (curso.estado === ESTADO_CURSO.REVISADO) return "hecho";
  if (curso.acceso !== "HABILITADO") return "bloqueado";
  if (curso.cursoAsignadoId === actualId) return "actual";
  return "disponible";
}

/** Resumen de la ruta asignada. Devuelve null si no hay asignación. */
export function resumenFormacion(asignacion) {
  if (!asignacion) return null;
  const cursos = asignacion.cursos ?? [];

  const completados = cursos.filter((c) => c.estado === ESTADO_CURSO.REVISADO).length;
  const unidadesRevisadas = cursos.reduce((a, c) => a + (c.revisadasObligatorias ?? 0), 0);
  const unidadesTotales = cursos.reduce((a, c) => a + (c.totalObligatorias ?? 0), 0);
  const horasTotales = cursos.reduce((a, c) => a + (Number(c.duracionHoras) || 0), 0);
  const horasRestantes = cursos.reduce(
    (a, c) => a + (Number(c.duracionHoras) || 0) * (1 - (Number(c.porcentaje) || 0) / 100),
    0
  );

  // Curso para "Continúa donde lo dejaste": el de la última consulta o,
  // si no hay, el primero habilitado que aún no se ha revisado.
  const actual =
    cursos.find((c) => c.cursoAsignadoId === asignacion.ultimaConsulta?.cursoAsignadoId && c.acceso === "HABILITADO") ??
    cursos.find((c) => c.acceso === "HABILITADO" && c.estado !== ESTADO_CURSO.REVISADO) ??
    null;

  // Logros calculados con el avance real
  const logros = [
    { id: "inicio", titulo: "Primer paso", detalle: "Revisaste tu primera unidad", logrado: unidadesRevisadas > 0 },
    { id: "curso", titulo: "Curso completado", detalle: "Terminaste un curso completo", logrado: completados > 0 },
    { id: "mitad", titulo: "Mitad del camino", detalle: "Llegaste al 50% de tu ruta", logrado: (asignacion.porcentaje ?? 0) >= 50 },
    { id: "ruta", titulo: "Ruta completa", detalle: "Terminaste todos tus cursos", logrado: cursos.length > 0 && completados === cursos.length },
  ];

  return {
    cursos,
    completados,
    unidadesRevisadas,
    unidadesTotales,
    horasTotales: Math.round(horasTotales * 10) / 10,
    horasRestantes: Math.round(horasRestantes * 10) / 10,
    actual,
    logros,
  };
}
