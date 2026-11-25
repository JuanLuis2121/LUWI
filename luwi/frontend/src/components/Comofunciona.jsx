// components/ComoFunciona.jsx
//
// Animación ligada al scroll (basada en el bloque "Hold everything" de tara.com):
//  1. Al entrar la sección, "CÓMO ●" llega desde la derecha y "FUNCIONA" desde la
//     izquierda, hasta que el punto queda centrado en la pantalla.
//  2. La sección se fija (sticky) y el punto crece con un clip-path hasta cubrir
//     toda la pantalla; el círculo se vuelve rectángulo y el título sale por los lados.
//  3. Aparece el texto y las tarjetas de los pasos caen desde arriba. Después del
//     paso 3 la fila se corre a la izquierda (tipo carrusel) para que entren el 4 y el 5.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";

const steps = [
  {
    title: "Registra el puesto y sus competencias",
    text: "La empresa crea el puesto y define las habilidades y conocimientos que necesita.",
  },
  {
    title: "Vincula al candidato",
    text: "Cada candidato se asocia al puesto para el que se va a preparar.",
  },
  {
    title: "Completa su perfil y evaluación inicial",
    text: "El candidato llena su perfil y realiza una evaluación para conocer su nivel de partida.",
  },
  {
    title: "Detecta brechas y recibe recomendaciones",
    text: "El sistema compara sus competencias con las del puesto y, con apoyo de IA, recomienda una ruta de capacitación.",
  },
  {
    title: "Se forma y consulta resultados",
    text: "El candidato completa su formación y la empresa revisa su progreso en el panel de seguimiento.",
  },
];

const SUBTITULO = "Del registro del puesto a la formación del candidato, en cinco pasos.";
const GAP = 56; // px entre tarjetas (deja lugar al panel azul girado)

/* ---------- easings (equivalentes a los de GSAP que usa la referencia) ---------- */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const tramo = (s, a, b) => clamp01((s - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const power2InOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const power1In = (t) => t * t;
const expoOut = (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));
const backOut = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

/* ---------- línea de tiempo, en "pantallas" de scroll ----------
   0 → 1      el título entra (la sección todavía está subiendo)
   1 → 1.9    sección fija: el punto se expande; el título sale (1.35 → 1.9)
   1.9 → 2.4  aparece el texto
   2.3 →      tarjetas: cada una cae; si no cabe, primero la fila se corre */
const INICIO_TARJETAS = 2.3;
const DUR_CAIDA = 0.55;
const DUR_CORRIMIENTO = 0.45;
const PAUSA_FINAL = 0.7;

function armarPlan(visibles) {
  let t = INICIO_TARJETAS;
  const caidas = [];
  const corrimientos = [];
  steps.forEach((_, i) => {
    if (i >= visibles) {
      corrimientos.push([t, t + DUR_CORRIMIENTO]);
      t += DUR_CORRIMIENTO;
    }
    caidas.push([t, t + DUR_CAIDA]);
    t += DUR_CAIDA;
  });
  return { caidas, corrimientos, alto: t + PAUSA_FINAL };
}

// Cuántas tarjetas caben a la vez según el ancho de pantalla
function tarjetasVisibles() {
  if (typeof window === "undefined") return 3;
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  if (window.matchMedia("(min-width: 640px)").matches) return 2;
  return 1;
}

// Suma offsetTop/offsetLeft hasta el contenedor fijo (ignora los transform)
function offsetHasta(el, ancestro) {
  let top = 0;
  let left = 0;
  for (let n = el; n && n !== ancestro; n = n.offsetParent) {
    top += n.offsetTop;
    left += n.offsetLeft;
  }
  return { top, left };
}

// Tarjeta blanca al frente con un panel azul girado detrás (como la referencia "Our team").
// El número del paso va arriba, dentro de la tarjeta.
// El estado activo vive en index.css, bloque "Cómo funciona: tarjetas con panel girado".
function TarjetaPaso({ step, i }) {
  const giro = i % 2 ? 11 : -11; // alterna el lado hacia el que se inclina el panel azul
  return (
    <div
      tabIndex={0}
      className="caja group relative h-full outline-none"
      style={{ "--giro": `${giro}deg` }}
    >
      {/* Panel azul de atrás */}
      <span aria-hidden="true" className="trasera absolute -inset-y-1 inset-x-5 rounded-[32px] bg-gradient-to-br from-azul-suave to-azul" />

      {/* Tarjeta blanca */}
      <div className="frente relative flex h-full flex-col items-center justify-center rounded-[28px] bg-white px-7 py-10 text-center group-focus-visible:ring-4 group-focus-visible:ring-azul/40">
        <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-azul text-xl font-extrabold text-white shadow-[0_10px_24px_-10px_rgb(34_43_184/0.7)]">
          <span className="sr-only">Paso </span>
          {i + 1}
        </span>
        <h3 className="mt-6 text-lg font-extrabold leading-snug tracking-tight text-marino">{step.title}</h3>
        <span aria-hidden="true" className="mt-3 h-1 w-10 flex-none rounded-full bg-amarillo" />
        <p className="mt-3 text-[15px] leading-relaxed text-marino/70">{step.text}</p>
      </div>
    </div>
  );
}

// Alto del <li>; el relleno deja lugar a las puntas del panel azul girado
const ALTO_TARJETA = "h-[clamp(320px,46vh,360px)] py-4";

/* ---------- versión animada ---------- */
function ComoFuncionaAnimado() {
  const seccionRef = useRef(null);
  const fijoRef = useRef(null);
  const puntoRef = useRef(null);
  const linea1Ref = useRef(null);
  const linea2Ref = useRef(null);
  const mascaraRef = useRef(null);
  const textoRef = useRef(null);
  const pistaRef = useRef(null);
  const tarjetasRef = useRef([]);

  const [visibles, setVisibles] = useState(tarjetasVisibles);
  const plan = useMemo(() => armarPlan(visibles), [visibles]);

  const { scrollYProgress } = useScroll({
    target: seccionRef,
    offset: ["start end", "end end"],
  });
  // Suaviza el avance (equivale al "scrub" con retraso de la referencia)
  const progreso = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.0001 });

  const pintar = useCallback(
    (p) => {
      const fijo = fijoRef.current;
      const punto = puntoRef.current;
      const linea1 = linea1Ref.current;
      const linea2 = linea2Ref.current;
      const mascara = mascaraRef.current;
      if (!fijo || !punto || !linea1 || !linea2 || !mascara) return;

      const s = p * plan.alto; // pantallas recorridas
      const W = fijo.clientWidth;
      const H = fijo.clientHeight;

      // 1) título: entra y el punto termina centrado; luego sale por los lados
      const pos = offsetHasta(punto, fijo);
      const dp = punto.offsetWidth;
      const corrimientoPct = linea1.offsetWidth
        ? ((W / 2 - (pos.left + dp / 2)) / linea1.offsetWidth) * 100
        : 0;
      const entrada = tramo(s, 0.05, 1);
      const salida = power1In(tramo(s, 1.35, 1.9));
      const x1 = lerp(lerp(110, corrimientoPct, entrada), -140, salida);
      const x2 = lerp(lerp(-1.15 * (110 - corrimientoPct), 0, entrada), 140, salida);
      linea1.style.transform = `translateX(${x1}%)`;
      linea2.style.transform = `translateX(${x2}%)`;

      // 2) el punto se expande: inset() que va del círculo a toda la pantalla
      if (s < 1) {
        punto.style.visibility = "visible";
        mascara.style.opacity = "0";
      } else {
        punto.style.visibility = "hidden";
        mascara.style.opacity = "1";
        const u = power2InOut(tramo(s, 1, 1.9));
        const t = pos.top * (1 - u);
        const l = ((W - dp) / 2) * (1 - u);
        const r = l;
        const b = (H - pos.top - dp) * (1 - u);
        const radio = (Math.min(W - l - r, H - t - b) / 2) * (1 - u);
        mascara.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round ${radio}px)`;
      }

      // 3) texto de la sección
      const c = expoOut(tramo(s, 1.9, 2.4));
      if (textoRef.current) {
        textoRef.current.style.opacity = String(c);
        textoRef.current.style.transform = `translateY(${28 * (1 - c)}px)`;
      }

      // 4) carrusel: cuánto se ha corrido la fila (en tarjetas)
      const corrido = plan.corrimientos.reduce(
        (acc, [a, b2]) => acc + power2InOut(tramo(s, a, b2)),
        0
      );
      const primera = tarjetasRef.current[0];
      const paso = primera ? primera.offsetWidth + GAP : 0;
      if (pistaRef.current) {
        pistaRef.current.style.transform = `translateX(${-corrido * paso}px)`;
      }

      // 5) cada tarjeta cae desde arriba de la pantalla; la última que aterrizó queda abierta
      let activa = -1;
      plan.caidas.forEach(([a, b2], i) => {
        if (tramo(s, a, b2) >= 0.9) activa = i;
      });
      tarjetasRef.current.forEach((el, i) => {
        if (!el) return;
        el.dataset.activo = String(i === activa);
      });
      tarjetasRef.current.forEach((el, i) => {
        if (!el) return;
        const [a, b2] = plan.caidas[i];
        const f = tramo(s, a, b2);
        const y = -window.innerHeight * (1 - backOut(f));
        const giro = (i % 2 ? 7 : -7) * (1 - f);
        const lugar = i - corrido; // < 0: ya salió por la izquierda
        const opacidad = clamp01(f * 4) * clamp01(1 + lugar * 1.3);
        el.style.transform = `translateY(${y}px) rotate(${giro}deg)`;
        el.style.opacity = String(opacidad);
      });
    },
    [plan]
  );

  useMotionValueEvent(progreso, "change", pintar);

  // Pinta el estado inicial y repinta al cambiar el tamaño de la ventana
  useLayoutEffect(() => {
    pintar(progreso.get());
  }, [pintar, progreso]);

  useEffect(() => {
    const alCambiar = () => {
      setVisibles(tarjetasVisibles());
      pintar(progreso.get());
    };
    window.addEventListener("resize", alCambiar);
    return () => window.removeEventListener("resize", alCambiar);
  }, [pintar, progreso]);

  return (
    <section
      id="como-funciona"
      ref={seccionRef}
      aria-labelledby="como-funciona-titulo"
      className="relative bg-white"
      style={{ height: `${plan.alto * 100}vh` }}
    >
      <div ref={fijoRef} className="sticky top-0 h-screen overflow-x-clip">
        {/* Título en dos líneas; el punto va después de "CÓMO" */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h2
            id="como-funciona-titulo"
            className="flex flex-col text-center font-extrabold uppercase leading-[1.02] tracking-[-0.04em] text-marino"
            style={{ fontSize: "min(104px, 13vw)" }}
          >
            <span ref={linea1Ref} className="block whitespace-nowrap will-change-transform">
              ¿Cómo&nbsp;
              <span
                ref={puntoRef}
                aria-hidden="true"
                className="mb-[0.1em] inline-block h-[0.9em] w-[0.9em] rounded-full bg-gris-fondo align-middle"
              />
            </span>
            <span ref={linea2Ref} className="block whitespace-nowrap will-change-transform">
              Funciona?
            </span>
          </h2>
        </div>

        {/* Superficie color arena que nace del punto */}
        <div ref={mascaraRef} className="absolute inset-0 z-10 bg-gris-fondo opacity-0">
          <div className="flex h-full flex-col justify-center gap-8 px-4 py-10 sm:px-10">
            <div ref={textoRef} className="mx-auto max-w-4xl text-center opacity-0">
              <p className="text-sm font-bold uppercase tracking-widest text-azul">
                ¿Cómo funciona?
              </p>
              <p className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-marino sm:text-5xl">
                {SUBTITULO}
              </p>
            </div>

            {/* El recorte va 48px más afuera que las tarjetas para no cortar el giro ni la sombra */}
            <div className="mx-auto w-full max-w-[calc(72rem+96px)] overflow-x-clip px-4 sm:px-12">
              <ol ref={pistaRef} className="pasos flex will-change-transform" style={{ gap: GAP }}>
                {steps.map((step, i) => (
                  <li
                    key={step.title}
                    ref={(el) => (tarjetasRef.current[i] = el)}
                    data-activo="false"
                    className={`tarjeta-paso ${ALTO_TARJETA} flex-none opacity-0 will-change-transform`}
                    style={{ width: `calc((100% - ${(visibles - 1) * GAP}px) / ${visibles})` }}
                  >
                    <TarjetaPaso step={step} i={i} />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- versión sin animación (prefers-reduced-motion) ---------- */
function ComoFuncionaEstatico() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-titulo"
      className="bg-gris-fondo px-6 py-20 sm:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="como-funciona-titulo"
          className="text-center text-4xl font-extrabold uppercase tracking-tight text-marino sm:text-6xl"
        >
          ¿Cómo funciona?
        </h2>
        <p className="mx-auto mt-6 max-w-4xl text-center text-3xl font-extrabold leading-tight tracking-tight text-marino sm:text-5xl">{SUBTITULO}</p>
        {/* Sin animación todas quedan abiertas, así se leen las descripciones sin pasar el cursor */}
        <ol className="mt-14 flex flex-wrap justify-center gap-x-14 gap-y-10">
          {steps.map((step, i) => (
            <li
              key={step.title}
              data-activo="true"
              className={`tarjeta-paso h-[360px] py-4 w-full sm:w-[calc(50%-1.75rem)] lg:w-[calc(33.333%-2.4rem)]`}
            >
              <TarjetaPaso step={step} i={i} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function ComoFunciona() {
  const reducir = useReducedMotion();
  return reducir ? <ComoFuncionaEstatico /> : <ComoFuncionaAnimado />;
}
