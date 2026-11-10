import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "../components/landingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import { Empresas, Puestos, Cursos } from "../pages/dashboard/Seccion";
import RutasAprendizaje from "../pages/dashboard/RutasAprendizaje";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="empresas" element={<Empresas />} />
        <Route path="puestos" element={<Puestos />} />
        <Route path="cursos" element={<Cursos />} />
        <Route path="rutas" element={<RutasAprendizaje />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
