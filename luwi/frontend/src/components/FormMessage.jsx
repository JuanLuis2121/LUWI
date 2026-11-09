const styles = {
  error: "border-red-200 bg-red-50 text-red-600",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function FormMessage({ type = "error", children }) {
  if (!children) return null;

  return (
    <p
      role={type === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-2.5 text-center text-xs ${styles[type]}`}
    >
      {children}
    </p>
  );
}