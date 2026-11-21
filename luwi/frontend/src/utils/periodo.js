// Cálculos por periodo para el dashboard (registros creados, tendencias y comparaciones).
// Usa la fecha "createdAt" que el backend guarda en cada registro.

export const PERIODOS = {
  "7d": { label: "7 días", corto: "7 d", anterior: "semana anterior" },
  "30d": { label: "30 días", corto: "30 d", anterior: "mes anterior" },
  "90d": { label: "90 días", corto: "90 d", anterior: "trimestre anterior" },
  "12m": { label: "12 meses", corto: "12 m", anterior: "año anterior" },
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIA_MS = 864e5;

const inicioDelDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fechaDe = (x) => (x?.createdAt ? new Date(x.createdAt) : null);

/**
 * Intervalos del periodo, del más antiguo al más reciente.
 * Cada uno: { inicio, fin, etiqueta } (fin excluido).
 */
export function intervalos(periodo, ahora = new Date()) {
  const hoy = inicioDelDia(ahora);
  const manana = new Date(hoy.getTime() + DIA_MS);

  if (periodo === "12m") {
    return Array.from({ length: 12 }, (_, i) => {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 11 + i, 1);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth() - 10 + i, 1);
      return { inicio, fin, etiqueta: MESES.at(inicio.getMonth()) };
    });
  }

  if (periodo === "90d") {
    return Array.from({ length: 13 }, (_, i) => {
      const fin = new Date(manana.getTime() - (12 - i) * 7 * DIA_MS);
      const inicio = new Date(fin.getTime() - 7 * DIA_MS);
      return { inicio, fin, etiqueta: `${inicio.getDate()} ${MESES.at(inicio.getMonth())}` };
    });
  }

  const dias = periodo === "7d" ? 7 : 30;
  return Array.from({ length: dias }, (_, i) => {
    const inicio = new Date(hoy.getTime() - (dias - 1 - i) * DIA_MS);
    const fin = new Date(inicio.getTime() + DIA_MS);
    return { inicio, fin, etiqueta: `${inicio.getDate()} ${MESES.at(inicio.getMonth())}` };
  });
}

/** Inicio y fin del periodo actual y del anterior, de la misma duración. */
export function rango(periodo, ahora = new Date()) {
  const lista = intervalos(periodo, ahora);
  const inicio = lista.at(0).inicio;
  const fin = lista.at(-1).fin;
  const duracion = fin.getTime() - inicio.getTime();
  return { inicio, fin, inicioAnterior: new Date(inicio.getTime() - duracion) };
}

/** Cuántos registros se crearon entre dos fechas (fin excluido). */
export function creadosEntre(items, inicio, fin) {
  return items.filter((x) => {
    const f = fechaDe(x);
    return f && f >= inicio && f < fin;
  }).length;
}

/**
 * Resumen de un tipo de registro en el periodo:
 * - nuevos: creados en el periodo
 * - anterior: creados en el periodo anterior
 * - serie: total acumulado al final de cada intervalo (para la minigráfica)
 */
export function tendencia(items, periodo, ahora = new Date()) {
  const lista = intervalos(periodo, ahora);
  const { inicio, fin, inicioAnterior } = rango(periodo, ahora);
  const sinFecha = items.filter((x) => !fechaDe(x)).length;

  return {
    nuevos: creadosEntre(items, inicio, fin),
    anterior: creadosEntre(items, inicioAnterior, inicio),
    serie: lista.map((b) => sinFecha + items.filter((x) => fechaDe(x) && fechaDe(x) < b.fin).length),
  };
}

/** Registros creados por intervalo y por tipo, para la gráfica de actividad. */
export function actividadPorIntervalo(grupos, periodo, ahora = new Date()) {
  return intervalos(periodo, ahora).map((b) => ({
    ...b,
    valores: Object.fromEntries(Object.entries(grupos).map(([k, items]) => [k, creadosEntre(items, b.inicio, b.fin)])),
  }));
}
