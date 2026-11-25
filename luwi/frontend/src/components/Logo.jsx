import { useId } from "react";

// Logotipo oficial vectorial LUWi · Paleta Colonial Cobalt suavizada + Soft Fawn + Antique White.
// size: "sm" (menú lateral), "md" (por defecto) o "lg" (login).
// tagline: muestra "Learn · Upgrade · Work · Improve" con puntos de color debajo del logo.
// variant: "dark" (sobre fondo claro, por defecto) o "light" (sobre fondo oscuro).

const SIZES = {
  sm: { width: 126, height: 42, tagline: "text-[8.5px]" },
  md: { width: 150, height: 50, tagline: "text-[9.5px]" },
  lg: { width: 186, height: 62, tagline: "text-[11px]" },
};

export function LuwiIsotipo({ className = "h-9 w-10" }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 132 104" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-w1`} x1="12" y1="22" x2="40" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A54D4" />
          <stop offset="0.55" stopColor="#222BB8" />
          <stop offset="1" stopColor="#141A75" />
        </linearGradient>
        <linearGradient id={`${uid}-w2`} x1="30" y1="86" x2="70" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#171E7E" />
          <stop offset="0.5" stopColor="#4952C4" />
          <stop offset="1" stopColor="#9A8FB8" />
        </linearGradient>
        <linearGradient id={`${uid}-w3`} x1="48" y1="40" x2="84" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7674BA" />
          <stop offset="0.55" stopColor="#2E37BD" />
          <stop offset="1" stopColor="#1C2494" />
        </linearGradient>
        <linearGradient id={`${uid}-wa`} x1="68" y1="86" x2="106" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#242DC0" />
          <stop offset="0.45" stopColor="#8A829D" />
          <stop offset="0.82" stopColor="#D1B17C" />
          <stop offset="1" stopColor="#EBD3B0" />
        </linearGradient>
        <linearGradient id={`${uid}-dt`} x1="102" y1="6" x2="124" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8E6D2" />
          <stop offset="1" stopColor="#D1B17C" />
        </linearGradient>
      </defs>
      <path d="M14 25C9 26.5 6.5 32 8.5 37L24 78C26.5 84.5 33 88 39.5 86.5C45.5 85 48.5 79 46 72.5L29 31C27 25.5 20 23.5 14 25Z" fill={`url(#${uid}-w1)`} />
      <path d="M28 74C26 79.5 29 85.5 35 87C41 88.5 46.5 85 49 79L61 52C63.5 46.5 60.5 40 54.5 38.5C48.5 37 43 40.5 40.5 46L28 74Z" fill={`url(#${uid}-w2)`} />
      <path d="M47 41C41.5 43.5 39.5 50 42 55.5L56 80.5C59 86 65.5 88.5 71.5 86C77 83.5 79.5 77 76.5 71.5L62 46C59 40.5 52.5 38.5 47 41Z" fill={`url(#${uid}-w3)`} />
      <path d="M59 74C56.5 79.5 59.5 86 65.5 87.5C71.5 89 77.5 86 80 80L95 45L101 47.5C104.2 48.8 107.5 46.2 106.8 42.8L102.8 24.8C102.2 22 99.2 20.6 96.6 21.8L80.2 29.6C77.1 31 77.4 35.5 80.6 36.8L85.5 38.8L59 74Z" fill={`url(#${uid}-wa)`} />
      <circle cx="114" cy="17" r="12" fill={`url(#${uid}-dt)`} />
    </svg>
  );
}

export default function Logo({ size = "md", tagline = true, variant = "dark", className = "" }) {
  const uid = useId().replace(/:/g, "");
  const s = SIZES[size] ?? SIZES.md;
  const claro = variant === "light";

  const lTop = claro ? "#5862DE" : "#111652";
  const lBot = claro ? "#2630B8" : "#1B2385";
  const lFold = claro ? "#171E82" : "#0B0E3B";
  const lFoot = claro ? "#3D47CC" : "#1E2696";
  const uTop = claro ? "#4F59DC" : "#3741C8";

  const palabras = [
    { label: "Learn", dot: "#3B45C9" },
    { label: "Upgrade", dot: "#D1B17C" },
    { label: "Work", dot: claro ? "#F8E6D2" : "#222BB8" },
    { label: "Improve", dot: null },
  ];

  return (
    <div className={`inline-flex flex-col items-start font-display ${className}`}>
      <svg
        role="img"
        aria-label="LUWI"
        width={s.width}
        height={s.height}
        viewBox="0 0 264 88"
        fill="none"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={`${uid}-l`} x1="12" y1="14" x2="54" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor={lTop} />
            <stop offset="1" stopColor={lBot} />
          </linearGradient>
          <linearGradient id={`${uid}-lf`} x1="10" y1="62" x2="62" y2="74" gradientUnits="userSpaceOnUse">
            <stop stopColor={lFold} />
            <stop offset="0.4" stopColor={lFoot} />
            <stop offset="1" stopColor={lTop} />
          </linearGradient>
          <linearGradient id={`${uid}-u`} x1="72" y1="14" x2="122" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor={uTop} />
            <stop offset="0.55" stopColor="#222BB8" />
            <stop offset="1" stopColor="#182094" />
          </linearGradient>
          <linearGradient id={`${uid}-w1`} x1="132" y1="14" x2="158" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4A54D4" />
            <stop offset="0.55" stopColor="#222BB8" />
            <stop offset="1" stopColor="#141A75" />
          </linearGradient>
          <linearGradient id={`${uid}-w2`} x1="150" y1="74" x2="188" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#171E7E" />
            <stop offset="0.48" stopColor="#4952C4" />
            <stop offset="1" stopColor="#9A8FB8" />
          </linearGradient>
          <linearGradient id={`${uid}-w3`} x1="168" y1="30" x2="202" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7674BA" />
            <stop offset="0.55" stopColor="#2E37BD" />
            <stop offset="1" stopColor="#1C2494" />
          </linearGradient>
          <linearGradient id={`${uid}-wa`} x1="184" y1="74" x2="222" y2="14" gradientUnits="userSpaceOnUse">
            <stop stopColor="#242DC0" />
            <stop offset="0.45" stopColor="#8A829D" />
            <stop offset="0.82" stopColor="#D1B17C" />
            <stop offset="1" stopColor="#EBD3B0" />
          </linearGradient>
          <linearGradient id={`${uid}-i`} x1="234" y1="25" x2="246" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5DFBF" />
            <stop offset="0.45" stopColor="#D1B17C" />
            <stop offset="1" stopColor="#A6844D" />
          </linearGradient>
          <linearGradient id={`${uid}-d`} x1="234" y1="2" x2="254" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8E6D2" />
            <stop offset="1" stopColor="#D1B17C" />
          </linearGradient>
        </defs>

        <path d="M16 14C10.5 14 6 18.5 6 24V58C6 69 15 78 26 78H52C57.5 78 62 73.5 62 68C62 62.5 57.5 58 52 58H26V24C26 18.5 21.5 14 16 14Z" fill={`url(#${uid}-l)`} />
        <path d="M6 56C6 68 15 78 27 78H52C57.5 78 62 73.5 62 68C62 62.5 57.5 58 52 58H29C22 58 17 54 17 48V56H6Z" fill={`url(#${uid}-lf)`} />
        <path d="M77 14C71.5 14 67 18.5 67 24V50C67 65.5 79.5 78 95 78C110.5 78 123 65.5 123 50V24C123 18.5 118.5 14 113 14C107.5 14 103 18.5 103 24V50C103 54.4 99.4 58 95 58C90.6 58 87 54.4 87 50V24C87 18.5 82.5 14 77 14Z" fill={`url(#${uid}-u)`} />
        <path d="M87 50C87 54.4 90.6 58 95 58C99.4 58 103 54.4 103 50V44C101 51 97 54 93 54C89.5 54 87 52 87 50Z" fill="#0F144C" fillOpacity="0.22" />
        <path d="M134 15C129 16.5 126.5 22 128.5 27L144 68C146.5 74.5 153 78 159.5 76.5C165.5 75 168.5 69 166 62.5L149 21C147 15.5 140 13.5 134 15Z" fill={`url(#${uid}-w1)`} />
        <path d="M148 64C146 69.5 149 75.5 155 77C161 78.5 166.5 75 169 69L181 42C183.5 36.5 180.5 30 174.5 28.5C168.5 27 163 30.5 160.5 36L148 64Z" fill={`url(#${uid}-w2)`} />
        <path d="M167 31C161.5 33.5 159.5 40 162 45.5L176 70.5C179 76 185.5 78.5 191.5 76C197 73.5 199.5 67 196.5 61.5L182 36C179 30.5 172.5 28.5 167 31Z" fill={`url(#${uid}-w3)`} />
        <path d="M179 64C176.5 69.5 179.5 76 185.5 77.5C191.5 79 197.5 76 200 70L215 35L221 37.5C224.2 38.8 227.5 36.2 226.8 32.8L222.8 14.8C222.2 12 219.2 10.6 216.6 11.8L200.2 19.6C197.1 21 197.4 25.5 200.6 26.8L205.5 28.8L179 64Z" fill={`url(#${uid}-wa)`} />
        <rect x="231" y="25" width="21" height="53" rx="10.5" fill={`url(#${uid}-i)`} />
        <circle cx="243" cy="12" r="10.5" fill={`url(#${uid}-d)`} />
      </svg>

      {tagline && (
        <span
          className={`${s.tagline} mt-1 flex items-center gap-1.5 font-bold tracking-[0.02em] ${
            claro ? "text-luwi-antique/90" : "text-luwi-profundo"
          }`}
        >
          {palabras.map((p) => (
            <span key={p.label} className="flex items-center gap-1.5">
              {p.label}
              {p.dot && (
                <span aria-hidden="true" className="h-[3.5px] w-[3.5px] rounded-full" style={{ backgroundColor: p.dot }} />
              )}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
