import Checkbox from "../ui/Checkbox";
import { thCls } from "../AdminUI";
import { Avatar, BarraAvance, EtiquetaCuenta, EtiquetaEstado } from "./Piezas";
import { ETAPA_POR_KEY, tiempoRelativo } from "../../utils/pipeline";

/** Vista de tabla del pipeline, con selección para acciones masivas. */
export default function TablaPipeline({ tarjetas, seleccion, onSeleccionar, onSeleccionarTodos, onAbrir, ocupadas }) {
  const marcados = tarjetas.filter((t) => seleccion.has(t.key)).length;
  const todos = tarjetas.length > 0 && marcados === tarjetas.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-luwi-profundo">
        <thead className="bg-luwi-panel/70">
          <tr>
            <th className="w-12 py-3 pl-6 pr-0">
              <Checkbox
                checked={todos}
                indeterminate={marcados > 0 && !todos}
                onChange={(si) => onSeleccionarTodos(si)}
                label="Seleccionar todos"
              />
            </th>
            <th className={thCls}>Postulante</th>
            <th className={`${thCls} px-4`}>Puesto</th>
            <th className={`${thCls} px-4`}>Etapa</th>
            <th className={`${thCls} min-w-[180px] px-4`}>Avance</th>
            <th className={`${thCls} px-4`}>Cuenta</th>
            <th className={`${thCls} px-4 text-right`}>Actividad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-luwi-linea/60">
          {tarjetas.map((t) => {
            const marcado = seleccion.has(t.key);
            const etapa = ETAPA_POR_KEY[t.etapa];
            const asignacion = t.proceso?.asignacion;
            return (
              <tr
                key={t.key}
                onClick={() => onAbrir(t)}
                className={`cursor-pointer transition ${marcado ? "bg-luwi-cristal-fondo/70" : "hover:bg-luwi-panel/60"} ${
                  ocupadas.has(t.key) ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <td className="w-12 py-4 pl-6 pr-0">
                  <Checkbox checked={marcado} onChange={() => onSeleccionar(t.key)} label={`Seleccionar ${t.nombre}`} />
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex min-w-[220px] items-center gap-3">
                    <Avatar nombre={t.nombre} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.nombre}</p>
                      <p className="truncate text-xs text-luwi-texto/75">{t.correo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="max-w-[200px] truncate text-[13px]">{t.proceso?.puesto?.titulo ?? "—"}</p>
                  {t.proceso?.empresa?.nombre && <p className="max-w-[200px] truncate text-[11.5px] text-luwi-texto/70">{t.proceso.empresa.nombre}</p>}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium">
                      <span className={`h-2 w-2 rounded-full ${etapa?.punto}`} />
                      {etapa?.titulo}
                    </span>
                    {t.proceso && t.proceso.estado !== "ACTIVO" && <EtiquetaEstado estado={t.proceso.estado} />}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {asignacion ? (
                    <div>
                      <BarraAvance porcentaje={asignacion.porcentaje} />
                      <p className="mt-1 max-w-[220px] truncate text-[11px] text-luwi-texto/70">{asignacion.ruta?.nombre}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-luwi-texto/60">Sin ruta</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <EtiquetaCuenta cuenta={t.postulante?.cuenta} corta />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 pr-6 text-right text-xs text-luwi-texto/70">{tiempoRelativo(t.fecha)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
