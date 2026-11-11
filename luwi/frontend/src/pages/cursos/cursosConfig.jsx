import {
  NIVELES,
  getCursos,
  getCurso,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
} from "../../services/cursosService";
import Icon from "../../components/Icon";
import { Badge, Bubble } from "../../components/AdminUI";

// Adaptador: el servicio de Marlon usa _id; las pantallas usan id.
const withId = (c) => ({ ...c, id: c._id });
const toPayload = (d) => ({ ...d, duracionHoras: Number(d.duracionHoras) });

const cursosService = {
  async list() {
    return (await getCursos()).map(withId);
  },
  async get(id) {
    const c = await getCurso(id);
    return c ? withId(c) : null;
  },
  create: (d) => crearCurso(toPayload(d)),
  update: (id, d) => actualizarCurso(id, toPayload(d)),
  remove: (id) => eliminarCurso(id),
};

export const cursosConfig = {
  basePath: "/dashboard/cursos",
  title: "Cursos",
  subtitle: "Administra los cursos disponibles para capacitación.",
  newLabel: "Nuevo curso",
  backLabel: "Volver a Cursos",
  searchPlaceholder: "Buscar por título, competencia o nivel",
  countWords: ["curso", "cursos"],
  formTitles: {
    create: "Nuevo curso",
    edit: "Editar curso",
    view: "Detalle del curso",
  },
  service: cursosService,
  searchText: (i) => `${i.titulo} ${i.descripcion} ${i.competencia} ${i.nivel}`,
  deleteText: (i) =>
    `¿Seguro que quieres eliminar el curso "${i.titulo}"? Esta acción no se puede deshacer.`,
  columns: [
    {
      key: "curso",
      label: "Curso",
      render: (i) => (
        <div className="flex items-center gap-3">
          <Bubble>
            <Icon name="book" className="h-4 w-4" />
          </Bubble>
          <div className="min-w-0">
            <p className="font-semibold">{i.titulo}</p>
            <p className="max-w-[260px] truncate text-xs text-admin-muted">{i.descripcion}</p>
          </div>
        </div>
      ),
    },
    { key: "competencia", label: "Competencia", render: (i) => i.competencia },
    {
      key: "nivel",
      label: "Nivel",
      render: (i) => (
        <span className="capitalize">
          <Badge>{i.nivel}</Badge>
        </span>
      ),
    },
    {
      key: "duracion",
      label: "Duración",
      render: (i) => <span className="font-medium">{i.duracionHoras} h</span>,
    },
  ],
  fields: [
    {
      name: "titulo",
      label: "Título del curso",
      type: "text",
      placeholder: "Ej. Introducción a React",
      required: true,
      requiredMsg: "Escribe el título del curso.",
    },
    {
      name: "descripcion",
      label: "Descripción",
      type: "textarea",
      placeholder: "Explica de qué trata el curso y qué aprenderá la persona.",
      required: true,
      requiredMsg: "Escribe una descripción del curso.",
    },
    {
      name: "competencia",
      label: "Competencia",
      type: "text",
      placeholder: "Ej. React",
      required: true,
      requiredMsg: "Indica la competencia que desarrolla el curso.",
    },
    {
      name: "nivel",
      label: "Nivel",
      type: "select",
      placeholder: "Selecciona un nivel",
      options: NIVELES.map((n) => ({ value: n, label: n.charAt(0).toUpperCase() + n.slice(1) })),
      required: true,
      requiredMsg: "Selecciona el nivel del curso.",
      half: true,
    },
    {
      name: "duracionHoras",
      label: "Duración (horas)",
      type: "number",
      placeholder: "Ej. 8",
      required: true,
      requiredMsg: "Indica la duración en horas.",
      half: true,
    },
    {
      name: "enlace",
      label: "Enlace",
      type: "url",
      placeholder: "https://",
      required: true,
      requiredMsg: "Escribe el enlace del curso.",
    },
  ],
};