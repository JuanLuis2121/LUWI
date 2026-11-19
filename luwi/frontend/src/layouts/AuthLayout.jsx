import Logo from "../components/Logo";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-luwi-bg to-[#e8efff] px-4 py-10">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-luwi-blue to-luwi-purple opacity-60 blur-sm" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-52 rotate-[35deg] rounded-[100px] bg-gradient-to-t from-luwi-purple to-luwi-blue opacity-70" />
      <div className="pointer-events-none absolute right-10 top-16 h-10 w-10 rounded-full bg-gradient-to-br from-luwi-teal to-emerald-300 shadow-lg" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-luwi-purple to-luwi-blue opacity-40" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/80 px-8 py-10 shadow-card backdrop-blur">
        <Logo className="mb-8" />

        <header className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-luwi-navy">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-luwi-muted">{subtitle}</p>}
        </header>

        {children}

        {footer && <p className="mt-6 text-center text-xs text-luwi-muted">{footer}</p>}
      </section>
    </main>
  );
} 