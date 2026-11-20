import { Link } from "react-router-dom";

const variants = {
  primary:
    "border-transparent bg-[linear-gradient(135deg,#1D4ED8,#7C3AED)] text-white shadow-lg shadow-admin-blue/30 hover:brightness-110",
  secondary:
    "border-admin-line bg-admin-bg text-admin-ink hover:bg-admin-soft/60",
  edit: "border-admin-blue bg-admin-soft text-admin-ink hover:brightness-105",
  danger: "border-admin-danger bg-white text-admin-danger hover:bg-red-50",
};

const sizes = {
  md: "px-6 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
};

export function ActionButton({
  variant = "secondary",
  size = "md",
  to,
  className = "",
  children,
  ...props
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full border-2 font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-admin-blue/30 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full border border-admin-line/60 bg-admin-bg px-3 py-0.5 text-xs font-medium text-admin-ink">
      {children}
    </span>
  );
}

export function Bubble({ children }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-admin-line bg-admin-soft text-sm font-bold text-admin-ink">
      {children}
    </span>
  );
}