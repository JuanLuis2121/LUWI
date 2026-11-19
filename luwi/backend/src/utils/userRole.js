const VALID_ROLES = new Set(["admin", "empresa", "rrhh", "postulante"]);

// Compatibilidad con cuentas antiguas que guardan el rol en `rol` con mayúsculas.
export function normalizeUserRole(user) {
  for (const value of [user?.role, user?.rol]) {
    if (typeof value !== "string") continue;
    const role = value.trim().toLowerCase();
    if (VALID_ROLES.has(role)) return role;
  }

  return null;
}
