// components/Acercadenosotros.jsx
//
// Basada en la sección "People step in only when it matters" de Agentix (Dribbble):
// paneles grandes apilados en horizontal. Al hacer scroll, el siguiente entra desde
// la derecha y tapa al anterior, que queda como una franja a la izquierda donde se
// sigue leyendo su título en vertical. Los que faltan esperan como franjas a la derecha.
// En pantallas angostas (o con movimiento reducido) las tarjetas se deslizan con el dedo.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";

const tarjetas = [
  {
    id: "nosotros",
    titulo: "Nosotros",
    tema: {
      panel: "bg-canvas border border-amarillo-claro",
      titulo: "text-azul",
      texto: "text-marino/80",
    },
    contenido: (
      <p>
        Somos una plataforma que ayuda a las empresas a formar a las personas
        según lo que cada cargo necesita. Medimos la distancia entre lo que sabe
        un candidato y lo que pide el puesto, y armamos una ruta de aprendizaje
        personalizada con apoyo de inteligencia artificial.
      </p>
    ),
  },
  {
    id: "mision",
    titulo: "Misión",
    tema: {
      panel: "bg-amarillo",
      titulo: "text-marino",
      texto: "text-marino/85",
    },
    contenido: (
      <p>
        Ayudar a las empresas a preparar a sus candidatos antes de que se
        incorporen al trabajo: identificamos qué les falta para ocupar un puesto
        y los acompañamos con una ruta de capacitación hecha a su medida.
      </p>
    ),
  },
  {
    id: "vision",
    titulo: "Visión",
    tema: {
      panel: "bg-azul",
      titulo: "text-amarillo",
      texto: "text-white/90",
    },
    contenido: (
      <p>
        Que llegar preparado a un empleo no dependa de la suerte. Queremos que
        cada empresa forme a sus futuros colaboradores con rutas claras, y que
        cada candidato sepa qué le falta para el puesto y cómo conseguirlo.
      </p>
    ),
  },
  {
    id: "valores",
    titulo: "Valores",
    tema: {
      panel: "bg-marino",
      titulo: "text-amarillo",
      texto: "text-white/85",
    },
    contenido: (
      <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {[
          ["Formación a la medida", "Cada ruta parte de lo que pide el puesto y de lo que el candidato ya sabe."],
          ["Transparencia", "La empresa y el candidato ven el mismo avance y los mismos resultados."],
          ["Igualdad de oportunidades", "Todo candidato vinculado a un puesto tiene la misma posibilidad de prepararse."],
          ["Mejora continua", "Medimos cada avance para ajustar la ruta cuando hace falta."],
        ].map(([nombre, texto]) => (
          <li key={nombre}>
            <span className="block font-extrabold text-amarillo">{nombre}</span>
            <span className="mt-1 block">{texto}</span>
          </li>
        ))}
      </ul>
    ),
  },
];

function Encabezado() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-block rounded-full bg-amarillo-claro px-4 py-1.5 text-sm font-bold text-marino">
        Acerca de nosotros
      </span>
      <h2
        id="nosotros-titulo"
        className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-marino sm:text-5xl"
      >
        LUWI prepara a los candidatos antes de que lleguen al puesto.
      </h2>
    </div>
  );
}

// Título en vertical, se lee de abajo hacia arriba (donde la referencia tiene el número)
function TituloVertical({ texto, clase, tamano, refTitulo }) {
  return (
    <h3
      ref={refTitulo}
      className={`select-none whitespace-nowrap font-extrabold uppercase leading-none tracking-tight ${clase}`}
      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: tamano }}
    >
      {texto}
    </h3>
  );
}

/* ---------- escritorio: paneles apilados ligados al scroll ---------- */
const FRANJA = 112; // ancho visible de un panel tapado (px)
const TITULO_MAX = 80; // tamaño máximo del título vertical (px)
const RELLENO = 28; // espacio libre arriba y abajo del título dentro del panel (px)
const INICIO = 1.2; // pantallas de scroll antes del primer cambio
const POR_CAMBIO = 0.9; // pantallas de scroll por cada panel que entra
const PAUSA = 0.4;
const ALTO = INICIO + (tarjetas.length - 1) * POR_CAMBIO + PAUSA;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function NosotrosApilado() {
  const seccionRef = useRef(null);
  const pilaRef = useRef(null);
  const panelesRef = useRef([]);
  const contenidosRef = useRef([]);
  const titulosRef = useRef([]);

  const { scrollYProgress } = useScroll({ target: seccionRef, offset: ["start end", "end end"] });
  const progreso = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.0001 });

  // Ajusta el tamaño de los títulos verticales para que el más largo quepa en el panel
  const ajustarTitulos = useCallback(() => {
    const pila = pilaRef.current;
    const titulos = titulosRef.current.filter(Boolean);
    if (!pila || !titulos.length) return;
    titulos.forEach((t) => (t.style.fontSize = `${TITULO_MAX}px`));
    const disponible = pila.clientHeight - RELLENO * 2;
    const masLargo = Math.max(...titulos.map((t) => t.offsetHeight));
    const tamano = Math.min(TITULO_MAX, Math.floor((TITULO_MAX * disponible) / masLargo));
    titulos.forEach((t) => (t.style.fontSize = `${tamano}px`));
  }, []);

  const pintar = useCallback((p) => {
    const pila = pilaRef.current;
    if (!pila) return;
    const n = tarjetas.length;
    const W = pila.clientWidth;
    const margen = Math.max(32, (W - 1152) / 2); // los paneles arrancan alineados al contenido

    // k: panel activo (con decimales mientras uno entra)
    const bruto = Math.min(n - 1, Math.max(0, (p * ALTO - INICIO) / POR_CAMBIO));
    const base = Math.floor(bruto);
    const k = base + suave(bruto - base);

    panelesRef.current.forEach((el, i) => {
      if (!el) return;
      const reposo = W - (n - i) * FRANJA; // esperando como franja a la derecha
      const destino = margen + i * FRANJA; // apilado a la izquierda
      const x = i === 0 ? margen : reposo + (destino - reposo) * clamp01(k - i + 1);
      el.style.transform = `translateX(${x}px)`;
      el.style.width = `${W - margen - i * FRANJA}px`;
      const c = contenidosRef.current[i];
      if (c) c.style.opacity = String(clamp01(1 - Math.abs(k - i) * 1.4));
    });
  }, []);

  useMotionValueEvent(progreso, "change", pintar);
  useLayoutEffect(() => {
    ajustarTitulos();
    pintar(progreso.get());
  }, [ajustarTitulos, pintar, progreso]);
  useEffect(() => {
    const alCambiar = () => {
      ajustarTitulos();
      pintar(progreso.get());
    };
    window.addEventListener("resize", alCambiar);
    document.fonts?.ready.then(alCambiar); // remide cuando carga la fuente
    return () => window.removeEventListener("resize", alCambiar);
  }, [ajustarTitulos, pintar, progreso]);

  // Clic en una franja: lleva el scroll hasta ese panel
  const irA = (i) => {
    const seccion = seccionRef.current;
    const top = seccion.getBoundingClientRect().top + window.scrollY;
    const s = INICIO + i * POR_CAMBIO;
    window.scrollTo({ top: top + (s - 1) * window.innerHeight, behavior: "smooth" });
  };

  return (
    <section
      id="nosotros"
      ref={seccionRef}
      aria-labelledby="nosotros-titulo"
      className="relative bg-white"
      style={{ height: `${ALTO * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col gap-10 overflow-x-clip py-12">
        <div className="flex-none px-8">
          <Encabezado />
        </div>

        {/* Los paneles ocupan todo el alto que queda libre en la pantalla */}
        <div ref={pilaRef} className="relative max-h-[560px] min-h-[320px] w-full flex-1">
          {tarjetas.map((t, i) => (
            <article
              key={t.id}
              ref={(el) => (panelesRef.current[i] = el)}
              onClick={() => irA(i)}
              className={`absolute inset-y-0 left-0 flex cursor-pointer overflow-hidden rounded-[2rem] will-change-transform ${t.tema.panel} ${
                i > 0 ? "shadow-[-28px_0_50px_-30px_rgb(15_20_76/0.45)]" : ""
              }`}
              style={{ zIndex: i + 1 }}
            >
              <div
                className="flex flex-none items-end justify-center"
                style={{ width: FRANJA, paddingBottom: RELLENO }}
              >
                <TituloVertical
                  texto={t.titulo}
                  clase={t.tema.titulo}
                  tamano={`${TITULO_MAX}px`}
                  refTitulo={(el) => (titulosRef.current[i] = el)}
                />
              </div>
              <div
                ref={(el) => (contenidosRef.current[i] = el)}
                className={`flex flex-1 flex-col items-center justify-center text-center text-lg leading-relaxed [&>*]:max-w-2xl ${t.tema.texto}`}
                // a la derecha se descuenta lo que tapan las franjas de los paneles siguientes
                style={{ paddingBlock: RELLENO, paddingLeft: 16, paddingRight: (tarjetas.length - 1 - i) * FRANJA + 56 }}
              >
                {t.contenido}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- móvil / movimiento reducido: tarjetas deslizables ---------- */
function NosotrosDeslizable() {
  return (
    <section id="nosotros" aria-labelledby="nosotros-titulo" className="bg-white py-20">
      <div className="px-6">
        <Encabezado />
      </div>
      <ul className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-6 [scrollbar-width:none]">
        {tarjetas.map((t) => (
          <li
            key={t.id}
            className={`flex min-h-[400px] w-[86%] max-w-md flex-none snap-center overflow-hidden rounded-[2rem] ${t.tema.panel}`}
          >
            <div className="flex w-16 flex-none items-end justify-center pb-6">
              <TituloVertical texto={t.titulo} clase={t.tema.titulo} tamano="42px" />
            </div>
            <div className={`flex flex-1 flex-col items-center justify-center py-6 pr-6 text-center text-base leading-relaxed ${t.tema.texto}`}>
              {t.contenido}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AcercaDeNosotros() {
  const reducir = useReducedMotion();
  const [ancho, setAncho] = useState(
    () => typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const alCambiar = () => setAncho(mq.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  return ancho && !reducir ? <NosotrosApilado /> : <NosotrosDeslizable />;
}
