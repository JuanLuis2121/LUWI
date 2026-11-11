
import { empresasService } from "../../services/empresasService";
import { Badge, Bubble } from "../../components/AdminUI";

export const empresasConfig = {
  basePath: "/dashboard/empresas",
  title: "Empresas",
  subtitle: "Administra las empresas registradas en la plataforma.",
  newLabel: "Nueva empresa",
  backLabel: "Volver a Empresas",
  searchPlaceholder: "Buscar por nombre, sector o correo",
  countWords: ["empresa", "empresas"],

  formTitles: {
    create: "Nueva empresa",
    edit: "Editar empresa",
    view: "Detalle de la empresa",
  },

  service: empresasService,

  searchText: (i) => `${i.nombre} ${i.sector} ${i.correo}`,

  deleteText: (i) =>
    `¿Seguro que quieres eliminar la empresa "${i.nombre}"? Esta acción no se puede deshacer.`,

  columns: [
    {
      key: "nombre",
      label: "Nombre",
      render: (i) => (
        <div className="flex items-center gap-3">
          <Bubble>{i.nombre.charAt(0).toUpperCase()}</Bubble>
          <span className="font-semibold">{i.nombre}</span>
        </div>
      ),
    },
    {
      key: "sector",
      label: "Sector",
      render: (i) => <Badge>{i.sector}</Badge>,
    },
    {
      key: "correo",
      label: "Correo",
      render: (i) => i.correo,
    },
  ],

  fields: [
    {
      name: "nombre",
      label: "Nombre de la empresa",
      type: "text",
      placeholder: "Ej. Tecnoval S.A.",
      required: true,
      requiredMsg: "Escribe el nombre de la empresa.",
    },
    {
      name: "sector",
      label: "Sector",
      type: "select",
      placeholder: "Selecciona un sector",
      options: [
        "Tecnología",
        "Salud",
        "Educación",
        "Finanzas",
        "Comercio",
        "Otro",
      ],
      required: true,
      requiredMsg: "Selecciona un sector.",
      half: true,
    },
    {
      name: "correo",
      label: "Correo electrónico",
      type: "email",
      placeholder: "contacto@empresa.com",
      required: true,
      requiredMsg: "Escribe un correo electrónico.",
      half: true,
    },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      placeholder: "Mínimo 8 caracteres",
      required: true,
      requiredMsg: "La contraseña debe tener al menos 8 caracteres.",
    },
  ],
};
