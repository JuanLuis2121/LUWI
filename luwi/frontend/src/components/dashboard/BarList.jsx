/** Barras horizontales (sin librerías). items: [{ label, value, color }] */
export default function BarList({ items }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-4">
      {items.map(({ label, value, color }) => (
        <li key={label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-luwi-ink">{label}</span>
            <span className="font-semibold text-luwi-navy">{value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-luwi-bg">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${color}`}
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
