import { requireRol } from "./auth.middleware.js";

export const soloAdmin = requireRol("ADMIN");
export const soloAdminEmpresa = requireRol("ADMIN-EMPRESA");
export const soloRRHH = requireRol("RRHH");
export const soloPostulante = requireRol("POSTULANTE");

export const adminORRHH = requireRol("ADMIN", "RRHH");

export const adminAdminEmpresaORRHH = requireRol(
  "ADMIN",
  "ADMIN-EMPRESA",
  "RRHH",
);
