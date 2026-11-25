// components/Hero.jsx
import { useEffect, useState } from "react";

/* Logos de los cursos que ofrecen las empresas (íconos ilustrativos) */
const ExcelIcon = () => (
  <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
    <rect x="4" y="4" width="40" height="40" rx="9" fill="#107C41" />
    <path d="M16 15l16 18M32 15 16 33" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

const PowerBIIcon = () => (
  <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
    <rect x="9" y="24" width="8" height="16" rx="2.5" fill="#F9D84A" />
    <rect x="20" y="16" width="8" height="24" rx="2.5" fill="#F2C811" />
    <rect x="31" y="8" width="8" height="32" rx="2.5" fill="#D9A800" />
  </svg>
);

const InglesIcon = () => (
  <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
    <path d="M10 6h28a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H22l-9 7v-7h-3a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z" fill="#E63946" />
    <text x="24" y="27" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="DM Sans, sans-serif">EN</text>
  </svg>
);

const LetraIcon = ({ letra, color }) => (
  <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
    <rect x="4" y="4" width="40" height="40" rx="9" fill={color} />
    <text x="24" y="32" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" fontFamily="DM Sans, sans-serif">{letra}</text>
  </svg>
);

// Posiciones según el sketch: alrededor de la imagen
const cursos = [
  { nombre: "Excel", Icono: ExcelIcon, pos: "left-0 top-[38%] md:-left-4", delay: "0s" },
  { nombre: "Inglés", Icono: InglesIcon, pos: "left-[14%] top-[6%]", delay: "1.2s" },
  { nombre: "Power BI", Icono: PowerBIIcon, pos: "left-[44%] -top-2", delay: "2.4s" },
  { nombre: "Word", Icono: () => <LetraIcon letra="W" color="#185ABD" />, pos: "right-[10%] top-[6%]", delay: "0.6s" },
  { nombre: "PowerPoint", Icono: () => <LetraIcon letra="P" color="#C43E1C" />, pos: "right-0 top-[40%] md:-right-2", delay: "1.8s" },
];

function TarjetaCurso({ nombre, Icono, pos, delay }) {
  return (
    <div
      className={`absolute z-20 flex w-20 flex-col items-center gap-1 rounded-2xl bg-white p-2.5 shadow-[0_12px_30px_-10px_rgb(15_20_76/0.35)] animate-flotar motion-reduce:animate-none ${pos}`}
      style={{ animationDelay: delay }}
    >
      <Icono />
      <span className="text-[11px] font-bold text-marino">{nombre}</span>
    </div>
  );
}

export default function Hero() {
  const [visible, setVisible] = useState(false);

  // Activa la animación de entrada justo después del primer render
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <section
      id="inicio"
      className="mx-auto grid max-w-screen-2xl items-center gap-10 px-8 pb-16 pt-8 md:grid-cols-2 md:px-16 md:pb-0"
    >
      {/* Eslogan + botón */}
      <div>
        <span className="inline-block rounded-full bg-amarillo-claro px-4 py-1.5 text-sm font-bold text-marino">
          Cursos que las empresas valoran
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight text-marino md:text-5xl lg:text-6xl">
          Empieza a formarte hoy mismo,{" "}
          <span className="relative whitespace-nowrap text-azul">
            la experiencia
            {/* Subrayado amarillo */}
            <svg
              viewBox="0 0 300 16"
              preserveAspectRatio="none"
              className="absolute -bottom-2 left-0 h-3 w-full text-amarillo"
              aria-hidden="true"
            >
              <path d="M3 12C80 3 200 2 297 9" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            </svg>
          </span>{" "}
          que necesitas
        </h1>

        <a
          href="/solicitar"
          className="mt-10 inline-block rounded-full bg-azul px-10 py-4 text-lg font-bold text-white shadow-lg shadow-azul/30 transition-colors hover:bg-azul-oscuro"
        >
          Inicia hoy
        </a>
      </div>

      {/* Imagen + logos de cursos flotando. En móvil lleva su propio fondo azul */}
      <div
        className={`relative h-[420px] rounded-3xl bg-azul transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-x-0 motion-reduce:opacity-100 motion-reduce:transition-none md:h-[540px] md:rounded-none md:bg-transparent ${
          visible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
        }`}
      >
        <img
          src="/hero-colaboracion.png"
          alt="Dos profesionales colaborando frente a un portátil"
          className="absolute bottom-0 left-1/2 z-10 w-[92%] max-w-[600px] -translate-x-1/2"
        />

        {cursos.map((c) => (
          <TarjetaCurso key={c.nombre} {...c} />
        ))}
      </div>
    </section>
  );
}
