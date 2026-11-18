// Roles de usuario: los mismos valores que devuelve la API de autenticación (Wala), en minúsculas.
export const ROLES = {
  ADMIN: "admin",
  EMPRESA: "empresa",
  RRHH: "rrhh",
  POSTULANTE: "postulante",
};

export const ROLES_ADMINISTRATIVOS = [ROLES.ADMIN, ROLES.EMPRESA, ROLES.RRHH];

export const esRolValido = (rol) => Object.values(ROLES).includes(rol);

// Pantalla de inicio de cada rol después de iniciar sesión
export const inicioSegunRol = (rol) =>
  rol === ROLES.POSTULANTE ? "/inicio" : "/dashboard";
