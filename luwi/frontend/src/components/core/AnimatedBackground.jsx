import { Children, cloneElement, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Fondo animado que "viaja" entre los hijos (identificados con data-id).
 * - value: id activo (controlado, p. ej. la ruta actual)
 * - enableHover: el fondo sigue al cursor y vuelve al activo al salir
 */
export default function AnimatedBackground({
  children,
  value,
  onValueChange,
  className = "",
  transition,
  enableHover = false,
}) {
  const uniqueId = useId();
  const [hoverId, setHoverId] = useState(null);
  const activeId = hoverId ?? value ?? null;

  const select = (id) => {
    setHoverId(null);
    onValueChange?.(id);
  };

  return Children.map(children, (child) => {
    const id = child.props["data-id"];

    const interactions = enableHover
      ? {
          onMouseEnter: () => setHoverId(id),
          onMouseLeave: () => setHoverId(null),
          onFocus: () => setHoverId(id),
          onBlur: () => setHoverId(null),
        }
      : {};

    return (
      <div
        key={id}
        className="relative"
        data-id={id}
        onClick={() => select(id)}
        {...interactions}
      >
        <AnimatePresence initial={false}>
          {activeId === id && (
            <motion.div
              layoutId={`background-${uniqueId}`}
              className={`absolute inset-0 ${className}`}
              transition={transition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <div className="relative z-10">{cloneElement(child, { "data-id": id })}</div>
      </div>
    );
  });
}
