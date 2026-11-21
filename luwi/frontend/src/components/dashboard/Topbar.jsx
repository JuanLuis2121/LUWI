import { MenuIcon } from "./icons";

/**
 * Barra superior del panel.
 * - left: contenido junto al botón de menú (ej. buscador). Si no hay, muestra `subtitle`.
 * - children: acciones a la derecha (ej. botón "Crear").
 */
export default function Topbar({ onMenuClick, subtitle = "Panel de control", left, children }) {
  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-4 border-b border-luwi-linea/80 bg-white/75 px-4 font-poppins backdrop-blur-xl sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-luwi-profundo hover:bg-luwi-cristal-fondo lg:hidden"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {left ?? <p className="truncate text-sm font-semibold text-luwi-profundo">{subtitle}</p>}
      </div>

      {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
    </header>
  );
}
