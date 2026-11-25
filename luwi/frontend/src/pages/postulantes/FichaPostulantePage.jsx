import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { PageHeader } from "../../components/AdminUI";
import { UsersIcon } from "../../components/pipeline/Piezas";
import FormacionAsignada from "../../components/formacion/FormacionAsignada";
import ResultadosPostulante from "../../components/formacion/ResultadosPostulante";
import RecomendacionesIAPanel from "../../components/ia/RecomendacionesIAPanel";

/**
 * Ficha integral del postulante para Recursos Humanos:
 * - Formación asignada (habilitación y bloqueo de cursos)
 * - Resultados de evaluaciones con detalle por intento (María C)
 * - Recomendaciones de formación con IA sin asignación automática (María D)
 */
export default function FichaPostulantePage() {
  const { procesoId } = useParams();
  const [proceso, setProceso] = useState(null);
  const postulante = proceso?.postulante;

  const subtitulo = proceso
    ? [postulante?.correo, proceso.puesto?.titulo, proceso.empresa?.nombre].filter(Boolean).join(" · ")
    : "Consulta la ruta asignada, los resultados de evaluaciones y las recomendaciones de IA.";

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <Link
          to="/dashboard/postulantes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-luwi-medio transition hover:text-luwi-profundo"
        >
          <Icon name="arrowLeft" className="h-3.5 w-3.5" />
          Volver a postulantes
        </Link>
      </div>

      <PageHeader
        icon={UsersIcon}
        seccion="Talento · Ficha del postulante"
        title={postulante?.nombre ?? "Ficha del postulante"}
        subtitle={subtitulo}
        stats={
          proceso
            ? [
                { label: "Estado del proceso", value: proceso.estado ?? "ACTIVO" },
                { label: "Puesto", value: proceso.puesto?.titulo ?? "—" },
                { label: "Empresa", value: proceso.empresa?.nombre ?? "—" },
              ]
            : []
        }
      />

      <FormacionAsignada procesoId={procesoId} onProceso={setProceso} />

      <ResultadosPostulante procesoId={procesoId} postulanteId={postulante?.id} />

      <RecomendacionesIAPanel
        puestoId={proceso?.puesto?.id}
        procesoId={procesoId}
        candidatoId={postulante?.id}
        contextoTexto={
          proceso?.puesto?.titulo
            ? `Solicita sugerencias de cursos para ${postulante?.nombre ?? "este postulante"} en el puesto "${proceso.puesto.titulo}".`
            : undefined
        }
      />
    </div>
  );
}
