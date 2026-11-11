import { api } from "./api";

const BASE = "/rutas-aprendizaje";
const unwrap = (res) => res.data?.data ?? res.data;

const normalizeCurso = (c) => ({
  id: c._id,
  titulo: c.titulo,
  nivel: c.nivel ?? "",
  competencia: c.competencia ?? "",
  duracionHoras: c.duracionHoras ?? 0,
});

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
        empresaNombre: p.empresa?.nombre ?? "",
      })),
      cursos: (data.cursos ?? []).map(normalizeCurso),
    };
  },
  async get(id) {
    return normalizeRuta(unwrap(await api.get(`${BASE}/${id}`)));
  },
  create: (form) => api.post(BASE, toPayload(form)),
  update: (id, form) => api.put(`${BASE}/${id}`, toPayload(form)),
  remove: (id) => api.delete(`${BASE}/${id}`),
};