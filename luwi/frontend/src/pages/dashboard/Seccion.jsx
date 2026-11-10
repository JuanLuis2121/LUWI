import PageHeader from "../../components/dashboard/PageHeader";
import EmptyState from "../../components/dashboard/EmptyState";
import { BuildingIcon, BriefcaseIcon, BookIcon } from "../../components/dashboard/icons";

// Pantallas base para el resto del equipo: reemplazar <EmptyState> por el contenido real.
const make = (title, description, icon) => () => (
  <>
    <PageHeader title={title} description={description} />
    <EmptyState icon={icon} title={`${title}: próximamente`} text="Esta sección se está construyendo." />
  </>
);

export const Empresas = make("Empresas", "Gestiona las empresas registradas.", BuildingIcon);
export const Puestos = make("Puestos", "Gestiona los puestos de trabajo.", BriefcaseIcon);
export const Cursos = make("Cursos", "Catálogo de cursos disponibles.", BookIcon);
