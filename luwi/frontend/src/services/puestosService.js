import { request } from "./api";

// Del back al front: _id -> id, empresa -> empresaId
const fromApi = (p) => ({
  ...p,
  id: p._id ?? p.id,
  empresaId: typeof p.empresa === "object" ? p.empresa?._id ?? p.empresa?.id : p.empresa,
});

// Del front al back: empresaId -> empresa
const toApi = ({ empresaId, id, ...rest }) => ({ ...rest, empresa: empresaId });

// Por si el back responde { data: [...] } en vez de un arreglo directo
const unwrap = (res) => res?.data ?? res;

export const puestosService = {
  list: async () => {
    const res = await request("/puestos", { fallback: "No se pudieron cargar los puestos" });
    return unwrap(res).map(fromApi);
  },
  get: async (id) =>
    fromApi(unwrap(await request(`/puestos/${id}`, { fallback: "No se pudo cargar el puesto" }))),
  create: async (data) =>
    fromApi(
      unwrap(
        await request("/puestos", {
          method: "POST",
          body: toApi(data),
          fallback: "No se pudo crear el puesto",
        })
      )
    ),
  update: async (id, data) =>
    fromApi(
      unwrap(
        await request(`/puestos/${id}`, {
          method: "PUT",
          body: toApi(data),
          fallback: "No se pudo actualizar el puesto",
        })
      )
    ),
  remove: async (id) => {
    await request(`/puestos/${id}`, { method: "DELETE", fallback: "No se pudo eliminar el puesto" });
  },
};