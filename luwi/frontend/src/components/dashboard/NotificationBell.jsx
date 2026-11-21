import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useNotificaciones from "../../hooks/useNotificaciones";

function tiempoRelativo(iso) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? "día" : "días"}`;
}

const ICONO = {
  alerta: { cls: "bg-amber-50 text-amber-600", path: "M12 9v4M12 16.5v.01M12 3l9.5 17H2.5L12 3z" },
  novedad: { cls: "bg-luwi-cristal-fondo text-luwi-medio", path: "M12 5v14M5 12h14" },
};

/** Campana de notificaciones de la barra superior, con contador y panel desplegable. */
export default function NotificationBell() {
  const navigate = useNavigate();
  const { avisos, sinLeer, esLeida, cargando, refrescar, marcarLeida, marcarTodas } = useNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState("todas");
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    refrescar();
    const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
    const esc = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const lista = filtro === "sin-leer" ? sinLeer : avisos;
  const contador = sinLeer.length;

  const abrir = (a) => {
    marcarLeida(a.id);
    setAbierto(false);
    navigate(a.to);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={contador ? `Notificaciones: ${contador} sin leer` : "Notificaciones"}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-luwi-linea bg-white text-luwi-profundo transition hover:border-luwi-tecno/40 hover:bg-luwi-cristal-fondo focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/20"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 1112 0c0 5 2 6.5 2 6.5H4S6 14 6 9zM10 19a2 2 0 004 0" />
        </svg>
        {contador > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-luwi-tecno to-luwi-medio px-1 text-[10.5px] font-bold text-white ring-2 ring-white">
            {contador > 99 ? "99+" : contador}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 top-12 z-30 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-luwi-linea bg-white font-poppins shadow-[0_24px_60px_-16px_rgba(11,58,140,0.4)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-luwi-linea/70 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-luwi-profundo">Notificaciones</p>
              <p className="text-[11px] text-luwi-texto/70">{contador ? `${contador} sin leer` : "Estás al día"}</p>
            </div>
            {contador > 0 && (
              <button type="button" onClick={marcarTodas} className="rounded-lg px-2 py-1 text-xs font-semibold text-luwi-medio transition hover:bg-luwi-cristal-fondo">
                Marcar todo como leído
              </button>
            )}
          </header>

          <div role="tablist" className="flex gap-1 border-b border-luwi-linea/70 px-3 py-2">
            {[
              ["todas", `Todas (${avisos.length})`],
              ["sin-leer", `Sin leer (${contador})`],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={filtro === k}
                onClick={() => setFiltro(k)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filtro === k ? "bg-luwi-profundo text-white" : "text-luwi-texto hover:bg-luwi-panel"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="max-h-[420px] overflow-y-auto">
            {cargando && <li className="px-4 py-8 text-center text-xs text-luwi-texto/70">Cargando…</li>}
            {!cargando && lista.length === 0 && (
              <li className="flex flex-col items-center px-4 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                <p className="mt-3 text-sm font-semibold text-luwi-profundo">Nada pendiente</p>
                <p className="mt-0.5 text-xs text-luwi-texto/70">Te avisaremos cuando algo necesite tu atención.</p>
              </li>
            )}
            {lista.map((a) => {
              const leida = esLeida(a.id);
              const icono = ICONO[a.tipo] ?? ICONO.novedad;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => abrir(a)}
                    className={`flex w-full items-start gap-3 border-b border-luwi-linea/50 px-4 py-3 text-left transition last:border-0 hover:bg-luwi-panel/70 ${
                      leida ? "" : "bg-luwi-cristal-fondo/40"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${icono.cls}`}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d={icono.path} />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] leading-snug ${leida ? "text-luwi-texto" : "font-semibold text-luwi-profundo"}`}>{a.titulo}</span>
                      <span className="mt-0.5 block text-xs text-luwi-texto/70">{a.detalle}</span>
                      <span className="mt-1 block text-[11px] text-luwi-texto/55">{tiempoRelativo(a.fecha)}</span>
                    </span>
                    {!leida && <span aria-label="Sin leer" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-luwi-tecno" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
