// Logo de LUWI: "LU" azul profundo, "W" en degradado e "i" azul tecnológico.
// size: "sm" (menú lateral), "md" (por defecto) o "lg" (login).
// tagline: muestra "Learn · Upgrade · Work · Improve" debajo del logo.
// variant: "dark" (sobre fondo claro, por defecto) o "light" (sobre fondo oscuro).

const SIZES = {
  sm: { word: "text-[32px]", tagline: "text-[8px]" },
  md: { word: "text-[40px]", tagline: "text-[9px]" },
  lg: { word: "text-[52px]", tagline: "text-[11px]" },
};

const PALABRAS = ["Learn", "Upgrade", "Work", "Improve"];

export default function Logo({ size = "md", tagline = true, variant = "dark", className = "" }) {
  const s = SIZES[size] ?? SIZES.md;
  const claro = variant === "light";

  return (
    <div className={`inline-flex flex-col items-start font-poppins ${className}`}>
      <span
        role="img"
        aria-label="LUWI"
        className={`${s.word} font-extrabold leading-none tracking-[-0.045em]`}
      >
        <span aria-hidden="true" className={claro ? "text-white" : "text-luwi-profundo"}>LU</span>
        <span
          aria-hidden="true"
          className={`bg-gradient-to-br bg-clip-text text-transparent ${
            claro ? "from-[#7cc8ff] to-luwi-tecno" : "from-luwi-medio to-luwi-tecno"
          }`}
        >
          W
        </span>
        <span aria-hidden="true" className="text-luwi-tecno">i</span>
      </span>

      {tagline && (
        <span
          className={`${s.tagline} mt-1.5 flex items-center gap-1.5 font-medium ${
            claro ? "text-white/70" : "text-luwi-profundo"
          }`}
        >
          {PALABRAS.map((palabra, i) => (
            <span key={palabra} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true" className="h-[3px] w-[3px] rounded-full bg-luwi-tecno" />}
              {palabra}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
