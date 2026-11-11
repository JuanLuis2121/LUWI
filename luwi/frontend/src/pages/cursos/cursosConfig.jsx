import { cursosService } from "../../services/cursosService";
import Icon from "../../components/Icon";
import { Badge, Bubble } from "../../components/AdminUI";

export const cursosConfig = {
  basePath: "/cursos",
  title: "Cursos",
  subtitle: "Administra los cursos disponibles para capacitación.",
  newLabel: "Nuevo curso",
  backLabel: "Volver a Cursos",
  searchPlaceholder: "Buscar por título, descripción o nivel",
  countWords: ["curso", "cursos"],
  formTitles: {
    create: "Nuevo curso",
    edit: "Editar curso",
    view: "Detalle del curso",
  },
  service: cursosService,
  searchText: (i) => `${i.titulo} ${i.descripcion} ${i.nivel}`,
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
    { key: "nivel", label: "Nivel", render: (i) => <Badge>{i.nivel}</Badge> },
    { key: "duracion", label: "Duración", render: (i) => <span className="font-medium">{i.duracion}</span> },
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
      name: "nivel",
      label: "Nivel",
      type: "select",
      placeholder: "Selecciona un nivel",
      options: ["Básico", "Intermedio", "Avanzado"],
      required: true,
      requiredMsg: "Selecciona el nivel del curso.",
      half: true,
    },
    {
      name: "duracion",
      label: "Duración",
      type: "text",
      placeholder: "Ej. 8 horas",
      required: true,
      requiredMsg: "Indica la duración del curso.",
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