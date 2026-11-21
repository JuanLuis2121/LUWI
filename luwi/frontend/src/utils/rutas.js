// Utilidades del constructor de rutas de aprendizaje.

// Nivel de los cursos: orden recomendado y colores del roadmap.
export const NIVELES = {
  "básico": { orden: 1, label: "Básico", nodo: "from-[#5fb8ff] to-luwi-tecno", punto: "bg-luwi-tecno", chip: "bg-luwi-tecno/10 text-luwi-medio ring-luwi-tecno/25" },
  intermedio: { orden: 2, label: "Intermedio", nodo: "from-luwi-medio to-[#3d7ff0]", punto: "bg-luwi-medio", chip: "bg-luwi-medio/10 text-luwi-medio ring-luwi-medio/25" },
  avanzado: { orden: 3, label: "Avanzado", nodo: "from-luwi-profundo to-[#1a4fb0]", punto: "bg-luwi-profundo", chip: "bg-luwi-profundo/10 text-luwi-profundo ring-luwi-profundo/25" },
};

export const nivelDe = (curso) => NIVELES[curso?.nivel] ?? NIVELES["básico"];

export const idDe = (x) => String(x?._id ?? x?.id ?? x ?? "");

/**
 * Avisos de orden: un curso de nivel más bajo después de uno más alto
 * (ej. "básico" después de "avanzado"). Devuelve un Set con los ids afectados.
 */
export function avisosDeOrden(cursos) {
  const ids = new Set();
  let maximo = 0;
  for (const c of cursos) {
    const orden = nivelDe(c).orden;
    if (orden < maximo) ids.add(c.id);
    maximo = Math.max(maximo, orden);
  }
  return ids;
}

/**
 * Cobertura de competencias del puesto con los cursos de la ruta.
 * - requeridas: ids de competencias del puesto.
 * - cursos: cada uno con `competencias` (ids) y `competencia` (texto antiguo).
 * - catalogo: [{ _id, nombre }] para mostrar nombres.
 */
export function coberturaCompetencias({ requeridas = [], cursos = [], catalogo = [] }) {
  const nombre = new Map(catalogo.map((c) => [idDe(c), c.nombre]));
  const enRuta = new Set(cursos.flatMap((c) => (c.competencias ?? []).map(idDe)));

  const req = [...new Set(requeridas.map(idDe))];
  const cubiertas = req.filter((id) => enRuta.has(id));
  const faltantes = req.filter((id) => !enRuta.has(id));
  const extra = [...enRuta].filter((id) => !req.includes(id));

  // Si los cursos todavía usan el texto "competencia", se muestran como apoyo.
  const textos = [...new Set(cursos.map((c) => c.competencia).filter(Boolean))];

  const aNombres = (ids) => ids.map((id) => ({ id, nombre: nombre.get(id) ?? "Competencia" }));

  return {
    total: req.length,
    porcentaje: req.length ? Math.round((cubiertas.length / req.length) * 100) : null,
    cubiertas: aNombres(cubiertas),
    faltantes: aNombres(faltantes),
    extra: aNombres(extra),
    textos,
  };
}

export const formatoHoras = (h) => {
  const n = Math.round((Number(h) || 0) * 10) / 10;
  return `${n.toLocaleString("es-DO")} h`;
};
