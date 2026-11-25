// Exportación de datos a CSV, compatible con Excel (incluye BOM para que respete las tildes).

const escapar = (valor) => {
  const texto = valor == null ? "" : String(valor);
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

/**
 * Descarga un archivo CSV.
 * - nombre: nombre base del archivo (se le agrega la fecha).
 * - columnas: [{ label, value: (fila) => texto }]
 * - filas: registros a exportar.
 */
export function descargarCSV(nombre, columnas, filas) {
  const encabezado = columnas.map((c) => escapar(c.label)).join(",");
  const cuerpo = filas.map((f) => columnas.map((c) => escapar(c.value(f))).join(","));
  const contenido = "﻿" + [encabezado, ...cuerpo].join("\r\n");

  const fecha = new Date().toISOString().slice(0, 10);
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombre}-${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
