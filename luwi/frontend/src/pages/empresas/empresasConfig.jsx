
import { Link } from "react-router-dom";
import { empresasService } from "../../services/empresasService";
import { puestosService } from "../../services/puestosService";
import { Badge, Bubble } from "../../components/AdminUI";
import { BuildingIcon, BriefcaseIcon } from "../../components/dashboard/icons";
import { DrawerField } from "../../components/ui/Drawer";

const puestosDe = (empresa, lookups) => (lookups.puestos ?? []).filter((p) => p.empresaId === empresa.id);

// Sector con más empresas (para las cifras del encabezado).
const sectorPrincipal = (items) => {
  const conteo = {};
  for (const i of items) if (i.sector) conteo[i.sector] = (conteo[i.sector] ?? 0) + 1;
  return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
};

export const empresasConfig = {
  basePath: "/dashboard/empresas",
  title: "Empresas",
  seccion: "Organización",
  icon: BuildingIcon,
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
  lookups: { puestos: () => puestosService.list() },

  searchText: (i) => `${i.nombre} ${i.sector} ${i.correo}`,

  // Filtros de la barra de herramientas
  filters: [
    {
      key: "sector",
      label: "Sector",
      value: (i) => i.sector ?? "",
      options: (items) =>
        [...new Set(items.map((i) => i.sector).filter(Boolean))].sort().map((s) => ({ value: s, label: s })),
    },
  ],

  // Exportación a CSV
  exportName: "empresas-luwi",
  exportColumns: [
    { label: "Nombre", value: (i) => i.nombre },
    { label: "Sector", value: (i) => i.sector },
    { label: "Correo", value: (i) => i.correo },
    { label: "Puestos", value: (i, lookups) => puestosDe(i, lookups).length },
  ],

  // Vista rápida (panel lateral)
  titleOf: (i) => i.nombre,
  subtitleOf: (i) => i.sector,
  quickView: (i, lookups) => {
    const puestos = puestosDe(i, lookups);
    return (
      <>
        <dl>
          <DrawerField label="Nombre">{i.nombre}</DrawerField>
          <DrawerField label="Sector">{i.sector && <Badge>{i.sector}</Badge>}</DrawerField>
          <DrawerField label="Correo">
            {i.correo && (
              <a href={`mailto:${i.correo}`} className="font-medium text-luwi-medio hover:underline">
                {i.correo}
              </a>
            )}
          </DrawerField>
        </dl>

        <div className="mt-5">
          <p className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-luwi-texto/60">
            Puestos de la empresa
            <span className="rounded-md bg-luwi-cristal-fondo px-1.5 py-0.5 text-luwi-medio">{puestos.length}</span>
          </p>
          {puestos.length === 0 ? (
            <p className="rounded-xl bg-luwi-panel px-4 py-5 text-center text-xs text-luwi-texto/80">Esta empresa aún no tiene puestos.</p>
          ) : (
            <ul className="space-y-2">
              {puestos.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/dashboard/puestos/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-luwi-linea/80 px-3 py-2.5 text-sm font-medium text-luwi-profundo transition hover:border-luwi-tecno/40 hover:bg-luwi-cristal-fondo/60"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-luwi-cristal-fondo text-luwi-medio">
                      <BriefcaseIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{p.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    );
  },

  stats: (items) => [
    { label: "Empresas registradas", value: items.length },
    { label: "Sectores distintos", value: new Set(items.map((i) => i.sector).filter(Boolean)).size },
    { label: "Sector principal", value: sectorPrincipal(items) },
  ],

  deleteText: (i) =>
    `¿Seguro que quieres eliminar la empresa "${i.nombre}"? Tendrás unos segundos para deshacerlo.`,

  columns: [
    {
      key: "nombre",
      label: "Nombre",
      render: (i) => (
        <div className="flex items-center gap-3">
          <Bubble>{i.nombre.charAt(0).toUpperCase()}</Bubble>
          <span className="font-semibold text-luwi-profundo">{i.nombre}</span>
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
      render: (i) => <span className="text-luwi-texto">{i.correo}</span>,
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
