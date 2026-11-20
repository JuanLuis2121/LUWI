import { puestosService } from "../../services/puestosService";
import { empresasService } from "../../services/empresasService";
import Icon from "../../components/Icon";
import { Badge, Bubble } from "../../components/AdminUI";
import { BriefcaseIcon } from "../../components/dashboard/icons";

const empresaNombre = (i, lookups) =>
  lookups.empresas?.find((e) => e.id === i.empresaId)?.nombre ?? "—";

export const puestosConfig = {
  basePath: "/dashboard/puestos",
  title: "Puestos",
  seccion: "Organización",
  icon: BriefcaseIcon,
  subtitle: "Administra los puestos de trabajo publicados por cada empresa.",
  newLabel: "Nuevo puesto",
  backLabel: "Volver a Puestos",
  searchPlaceholder: "Buscar por título, empresa o descripción",
  countWords: ["puesto", "puestos"],
  formTitles: {
    create: "Nuevo puesto",
    edit: "Editar puesto",
    view: "Detalle del puesto",
  },
  service: puestosService,
  lookups: { empresas: () => empresasService.list() },
  searchText: (i, lookups) =>
    `${i.titulo} ${empresaNombre(i, lookups)} ${i.descripcion}`,
  stats: (items) => {
    const empresas = new Set(items.map((i) => i.empresaId).filter(Boolean)).size;
    return [
      { label: "Puestos registrados", value: items.length },
      { label: "Empresas con puestos", value: empresas },
      { label: "Promedio por empresa", value: empresas ? Math.round((items.length / empresas) * 10) / 10 : 0 },
    ];
  },
  deleteText: (i) =>
    `¿Seguro que quieres eliminar el puesto "${i.titulo}"? Esta acción no se puede deshacer.`,
  columns: [
    {
      key: "titulo",
      label: "Título",
      render: (i) => (
        <div className="flex items-center gap-3">
          <Bubble>
            <Icon name="briefcase" className="h-4 w-4" />
          </Bubble>
          <span className="block max-w-[220px] truncate font-semibold text-luwi-profundo" title={i.titulo}>
            {i.titulo}
          </span>
        </div>
      ),
    },
    {
      key: "empresa",
      label: "Empresa",
      render: (i, lookups) => <Badge>{empresaNombre(i, lookups)}</Badge>,
    },
    {
      key: "descripcion",
      label: "Descripción",
      render: (i) => (
        <span className="block max-w-[260px] truncate text-luwi-texto" title={i.descripcion}>
          {i.descripcion}
        </span>
      ),
    },
  ],
  fields: [
    {
      name: "titulo",
      label: "Título del puesto",
      type: "text",
      placeholder: "Ej. Analista de Crédito",
      required: true,
      requiredMsg: "Escribe el título del puesto.",
    },
    {
      name: "empresaId",
      label: "Empresa",
      type: "select",
      placeholder: "Selecciona una empresa",
      optionsFrom: "empresas",
      optionLabel: "nombre",
      required: true,
      requiredMsg: "Selecciona la empresa que ofrece el puesto.",
    },
    {
      name: "descripcion",
      label: "Descripción",
      type: "textarea",
      placeholder: "Resume las funciones y responsabilidades del puesto.",
      required: true,
      requiredMsg: "Escribe una descripción del puesto.",
    },
    {
      name: "requisitos",
      label: "Requisitos",
      type: "textarea",
      placeholder: "Indica la formación, experiencia y habilidades necesarias.",
      required: true,
      requiredMsg: "Indica los requisitos del puesto.",
    },
  ],
};