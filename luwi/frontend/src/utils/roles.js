// Roles de usuario (deben coincidir con user.model.js del backend)
export const ROLES = {
  ADMIN: "ADMIN",
  RRHH: "RRHH",
  POSTULANTE: "POSTULANTE",
};

export const ROLES_ADMINISTRATIVOS = [ROLES.ADMIN, ROLES.RRHH];

// Pantalla de inicio de cada rol después de iniciar sesión
export const inicioSegunRol = (rol) =>
  rol === ROLES.POSTULANTE ? "/inicio" : "/dashboard";
