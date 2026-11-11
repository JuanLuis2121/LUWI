import { MenuIcon } from "./icons";

/** Barra superior: botón de menú (celular) y nombre del usuario. */
export default function Topbar({ username, onMenuClick }) {
  const name = username || "Usuario";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-luwi-border bg-white/90 px-4 backdrop-blur sm:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="rounded-lg p-2 text-luwi-ink hover:bg-luwi-bg lg:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <p className="hidden text-sm text-luwi-muted lg:block">Panel de control</p>

      <div className="flex items-center gap-3">
        <span className="max-w-[10rem] truncate text-sm font-semibold text-luwi-navy sm:max-w-xs">
          {name}
        </span>
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-luwi-blue to-luwi-purple text-sm font-bold text-white"
        >
          {initial}
        </span>
      </div>
    </header>
  );
}
