import { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { loginUser, registerUser } from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    setUser(data);
    return data;
  }, []);

  const register = useCallback((payload) => registerUser(payload), []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}