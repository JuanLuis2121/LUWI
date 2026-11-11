import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "../components/landingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AdminLayout from "../components/AdminLayout";
import ModuleListPage from "../components/ModuleListPage";
import ModuleFormPage from "../components/ModuleFormPage";
import { empresasConfig } from "../pages/empresas/empresasConfig";
import { puestosConfig } from "../pages/puestos/puestosConfig";
import { cursosConfig } from "../pages/cursos/cursosConfig";
import RutasListPage from "../pages/rutas/RutasListPage";
import RutaFormPage from "../pages/rutas/RutaFormPage";

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

      <Route element={<AdminLayout />}>
        {crudRoutes(empresasConfig)}
        {crudRoutes(puestosConfig)}
        {crudRoutes(cursosConfig)}
        <Route path="/rutas" element={<RutasListPage />} />
        <Route path="/rutas/nuevo" element={<RutaFormPage mode="create" />} />
        <Route path="/rutas/:id" element={<RutaFormPage mode="view" />} />
        <Route path="/rutas/:id/editar" element={<RutaFormPage mode="edit" />} />
        {/* La persona del dashboard agrega aquí: <Route path="/dashboard" element={<Dashboard />} /> */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 