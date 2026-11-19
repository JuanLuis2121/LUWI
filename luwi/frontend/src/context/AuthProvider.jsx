import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import {
  getSessionUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true mientras se recupera la sesión guardada en la cookie
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    getSessionUser()
      .then((data) => {
        if (activo) setUser(data);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    setUser(data);
    return data;
  }, []);

  const register = useCallback((payload) => registerUser(payload), []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Aunque falle la petición, se cierra la sesión en la interfaz
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, cargando, login, register, logout }),
    [user, cargando, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
