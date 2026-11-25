import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PALETAS_AVATAR } from "../../utils/espacioPostulante";

/**
 * Avatar grande con la inicial del postulante y selector de color.
 * El color elegido se guarda en este navegador.
 */
export default function AvatarPostulante({ nombre, paleta = 0, onPaleta }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
    const esc = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <div ref={ref} className="relative -mt-12 shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="true"
        aria-expanded={abierto}
        title="Cambiar color del avatar"
        className={`group relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-4xl font-bold text-white shadow-[0_16px_30px_-12px_rgba(17,22,82,0.55)] ring-[6px] ring-white transition hover:scale-[1.03] focus:outline-none focus-visible:ring-luwi-tecno/40 ${
          PALETAS_AVATAR[paleta] ?? PALETAS_AVATAR[0]
        }`}
      >
        {(nombre.charAt(0) || "?").toUpperCase()}
        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-luwi-medio shadow-md ring-1 ring-luwi-linea transition group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 005-5c0-4-4-7.4-9-7.4z" />
            <circle cx="7.5" cy="11" r="1" fill="currentColor" />
            <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
            <circle cx="15" cy="7.5" r="1" fill="currentColor" />
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            role="radiogroup"
            aria-label="Color del avatar"
            className="absolute left-0 top-full z-20 mt-3 w-56 rounded-2xl border border-luwi-linea bg-white p-3 shadow-[0_20px_50px_-12px_rgba(17,22,82,0.28)]"
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-luwi-texto/60">Color del avatar</p>
            <div className="grid grid-cols-6 gap-2">
              {PALETAS_AVATAR.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={i === paleta}
                  aria-label={`Color ${i + 1}`}
                  onClick={() => {
                    onPaleta(i);
                    setAbierto(false);
                  }}
                  className={`h-7 w-7 rounded-lg bg-gradient-to-br transition hover:scale-110 ${p} ${i === paleta ? "ring-2 ring-luwi-tecno ring-offset-2" : ""}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
