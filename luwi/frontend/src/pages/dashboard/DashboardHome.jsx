import { useEffect, useState } from "react";
import PageHeader from "../../components/dashboard/PageHeader";
import StatCard from "../../components/dashboard/StatCard";
import { BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon } from "../../components/dashboard/icons";
import useAuth from "../../hooks/useAuth";
import { getResumen } from "../../services/dashboardService";

const CARDS = [
  { key: "empresas", label: "Empresas registradas", icon: BuildingIcon, tone: "blue" },
  { key: "puestos", label: "Puestos registrados", icon: BriefcaseIcon, tone: "teal" },
  { key: "cursos", label: "Cursos disponibles", icon: BookIcon, tone: "navy" },
  { key: "rutas", label: "Rutas de aprendizaje", icon: RouteIcon, tone: "purple" },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    let activo = true;
    getResumen().then((r) => activo && setResumen(r)).catch(() => activo && setResumen({}));
    return () => { activo = false; };
  }, []);

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.username ?? "bienvenido"}`}
        description="Este es el resumen de tu plataforma LUWI."
      />
      <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {CARDS.map(({ key, ...card }) => (
          <StatCard key={key} {...card} value={resumen?.[key] ?? 0} loading={resumen === null} />
        ))}
      </section>
    </>
  );
}
