import { api, errMsg } from "./api";

const BASE = "/rutas-aprendizaje";
const unwrap = (res) => res.data?.data ?? res.data;

const normalizeCurso = (c) => ({
  id: c._id,
  titulo: c.titulo,
  nivel: c.nivel ?? "",
  competencia: c.competencia ?? "",
  duracionHoras: c.duracionHoras ?? 0,
  // Los cursos viejos sin estado se tratan como BORRADOR (igual que el backend)
  estado: c.estado ?? "BORRADOR",
  // null = curso global (compatible con cualquier puesto)
  empresaId: c.empresa ? String(c.empresa?._id ?? c.empresa) : null,
});

// Un curso se puede incluir en la ruta de un puesto si está PUBLICADO y es
// global o de la misma empresa del puesto (misma regla que valida el backend).
export const cursoCompatible = (curso, puesto) =>
  curso.estado === "PUBLICADO" &&
  (!curso.empresaId || (puesto && curso.empresaId === puesto.empresaId));

const normalizeRuta = (r) => ({
  id: r._id,
  nombre: r.nombre,
  descripcion: r.descripcion ?? "",
  puestoId: r.puesto?._id ?? "",
  puestoTitulo: r.puesto?.titulo ?? "",
  empresaNombre: r.puesto?.empresa?.nombre ?? "",
  cursos: (r.cursos ?? []).map(normalizeCurso),
  duracionTotalHoras: r.duracionTotalHoras ?? 0,
});

// Formato que espera el backend (el orden de cursos es el del arreglo).
const toPayload = ({ nombre, descripcion, puestoId, cursoIds }) => ({
  nombre,
  descripcion,
  puesto: puestoId,
  cursos: cursoIds,
});

// Usado por el dashboard: devuelve la lista cruda tal como llega del backend.
export async function getRutas() {
  try {
    const data = unwrap(await api.get(BASE));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(errMsg(e, "No se pudieron cargar las rutas"));
  }
}

export const rutasService = {
  async list() {
    const data = unwrap(await api.get(BASE));
    return (Array.isArray(data) ? data : []).map(normalizeRuta);
  },
  async options() {
    const data = unwrap(await api.get(`${BASE}/opciones`));
    return {
      puestos: (data.puestos ?? []).map((p) => ({
        id: p._id,
        titulo: p.titulo,
        empresaId: p.empresa ? String(p.empresa._id ?? p.empresa) : null,
        empresaNombre: p.empresa?.nombre ?? "",
      })),
      cursos: (data.cursos ?? []).map(normalizeCurso),
    };
  },
  // Rutas del puesto del postulante (las únicas compatibles para asignar).
  // El listado no trae estado ni empresa de los cursos: se completan con /opciones
  // para avisar antes de confirmar qué cursos rechazaría el backend.
  async compatiblesConPuesto(puestoId) {
    const [rutas, opciones] = await Promise.all([this.list(), this.options()]);
    const porId = new Map(opciones.cursos.map((c) => [c.id, c]));
    return rutas
      .filter((r) => r.puestoId === puestoId)
      .map((r) => ({ ...r, cursos: r.cursos.map((c) => ({ ...c, ...(porId.get(c.id) ?? {}) })) }));
  },
  async get(id) {
    return normalizeRuta(unwrap(await api.get(`${BASE}/${id}`)));
  },
  create: (form) => api.post(BASE, toPayload(form)),
  update: (id, form) => api.put(`${BASE}/${id}`, toPayload(form)),
  remove: (id) => api.delete(`${BASE}/${id}`),
};