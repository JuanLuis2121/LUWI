import { useState } from "react";
import { useParams } from "react-router-dom";
import FormacionAsignada from "../../components/formacion/FormacionAsignada";

// Ficha provisional del postulante: solo monta el componente "Formación asignada".
// María la reemplaza por la ficha única; ella solo necesita:
//   <FormacionAsignada procesoId={procesoId} />
export default function FichaPostulantePage() {
  const { procesoId } = useParams();
  const [proceso, setProceso] = useState(null);
  const postulante = proceso?.postulante;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-admin-blue">Ficha del postulante</p>
        <h1 className="mt-1 break-words text-3xl font-extrabold text-admin-ink sm:text-4xl">
          {postulante?.nombre ?? "Postulante"}
        </h1>
        {proceso && (
          <p className="mt-1 break-words text-sm text-admin-muted">
            {[postulante?.correo, proceso.puesto?.titulo, proceso.empresa?.nombre].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <FormacionAsignada procesoId={procesoId} onProceso={setProceso} />
    </div>
  );
}
