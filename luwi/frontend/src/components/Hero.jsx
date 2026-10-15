// components/Hero.jsx
import { useEffect, useState } from "react";

export default function Hero() {
  const [visible, setVisible] = useState(false);

  // Activa la animación justo después del primer render
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(id);
  }, []);

  return (
    <section
      id="inicio"
      className="grid items-center gap-8 overflow-x-clip bg-black py-16 md:grid-cols-2"
    >
      <div className="px-8 md:px-16">
        <h1 className="text-5xl font-extrabold leading-tight text-white md:text-6xl">
          Empieza a formar hoy mismo,{" "}
          <span className="text-teal-500">la experiencia que necesitas</span>
        </h1>

        <a
          href="/solicitar"
          className="mt-10 inline-block rounded-full bg-purple-300 px-8 py-4 text-lg font-bold text-black hover:bg-purple-400 transition-colors"
        >
          Inicia hoy
        </a>
      </div>

      {/* Entra deslizándose desde la derecha */}
      <div
        className={`relative h-[480px] transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-x-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
          visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        {/* Recuadro: mismo tamaño de antes */}
        <div
          className="absolute inset-0 bg-teal-500"
          style={{ clipPath: "polygon(12% 0, 100% 0, 100% 100%, 12% 100%, 0 50%)" }}
        />

        {/* Imagen: más alta que el recuadro, la cabeza sobresale por arriba */}
        <img
          src="/ChicafondoLuwi.png"
          alt="Chica sonriendo, imagen de Luwi"
          className="absolute bottom-0 left-1/2 h-[560px] max-w-none -translate-x-1/2"
        />
      </div>
    </section>
  );
}