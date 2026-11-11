
import { request } from "./api";

const fromApi = (e) => ({ ...e, id: e._id ?? e.id });
const unwrap = (res) => res?.data ?? res;

export const empresasService = {
  // CONSULTAR TODAS LAS EMPRESAS
  list: async () => {
    const res = await request("/empresas", {
      fallback: "No se pudieron cargar las empresas",
    });

    return unwrap(res).map(fromApi);
  },

  // CONSULTAR UNA EMPRESA
  get: async (id) => {
    const res = await request(`/empresas/${id}`, {
      fallback: "No se pudo cargar la empresa",
    });

    return fromApi(unwrap(res));
  },

  // CREAR EMPRESA
  create: async (data) => {
    const res = await request("/empresas", {
      method: "POST",
      body: data,
      fallback: "No se pudo crear la empresa",
    });

    const response = unwrap(res);

    return fromApi(response.empresa ?? response);
  },

  // ACTUALIZAR EMPRESA
  update: async (id, data) => {
    const res = await request(`/empresas/${id}`, {
      method: "PUT",
      body: data,
      fallback: "No se pudo actualizar la empresa",
    });

    const response = unwrap(res);

    return fromApi(response.empresa ?? response);
  },

  // ELIMINAR EMPRESA
  remove: async (id) => {
    await request(`/empresas/${id}`, {
      method: "DELETE",
      fallback: "No se pudo eliminar la empresa",
    });
  },
};
