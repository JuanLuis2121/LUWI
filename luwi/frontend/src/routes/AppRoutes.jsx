import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "../components/landingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardLayout from "../layouts/DashboardLayout";
import DashboardHome from "../pages/dashboard/DashboardHome";
import ModuleListPage from "../components/ModuleListPage";
import ModuleFormPage from "../components/ModuleFormPage";
import { empresasConfig } from "../pages/empresas/empresasConfig";
import { puestosConfig } from "../pages/puestos/puestosConfig";
import CursosListPage from "../pages/cursos/CursosListPage";
import CursoFormPage from "../pages/cursos/CursoFormPage";
import CursoUnidadesPage from "../pages/cursos/CursoUnidadesPage";
import FichaPostulantePage from "../pages/postulantes/FichaPostulantePage";
import RutasListPage from "../pages/rutas/RutasListPage";
import RutaFormPage from "../pages/rutas/RutaFormPage";

// Rutas absolutas (/dashboard/empresas, /dashboard/empresas/nuevo, ...)
function crudRoutes(c) {
  const p = c.basePath;
  return [
    <Route key={p} path={p} element={<ModuleListPage config={c} />} />,
    <Route key={`${p}-nuevo`} path={`${p}/nuevo`} element={<ModuleFormPage config={c} mode="create" />} />,
    <Route key={`${p}-ver`} path={`${p}/:id`} element={<ModuleFormPage config={c} mode="view" />} />,
    <Route key={`${p}-editar`} path={`${p}/:id/editar`} element={<ModuleFormPage config={c} mode="edit" />} />,
  ];
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        {crudRoutes(empresasConfig)}
        {crudRoutes(puestosConfig)}
        <Route path="/dashboard/cursos" element={<CursosListPage />} />
        <Route path="/dashboard/cursos/nuevo" element={<CursoFormPage mode="create" />} />
        <Route path="/dashboard/cursos/:id/editar" element={<CursoFormPage mode="edit" />} />
        <Route path="/dashboard/cursos/:id/unidades" element={<CursoUnidadesPage />} />
        <Route path="/dashboard/cursos/:id" element={<CursoUnidadesPage />} />
        <Route path="/dashboard/postulantes/:procesoId" element={<FichaPostulantePage />} />
        <Route path="/dashboard/rutas" element={<RutasListPage />} />
        <Route path="/dashboard/rutas/nuevo" element={<RutaFormPage mode="create" />} />
        <Route path="/dashboard/rutas/:id" element={<RutaFormPage mode="view" />} />
        <Route path="/dashboard/rutas/:id/editar" element={<RutaFormPage mode="edit" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 