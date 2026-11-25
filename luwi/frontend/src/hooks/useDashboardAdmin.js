import { useCallback, useEffect, useState } from "react";
import { getResumen } from "../services/dashboardService";
import { getCursos } from "../services/cursosService";
import { getRutas } from "../services/rutasService";
import { puestosService } from "../services/puestosService";
import { empresasService } from "../services/empresasService";

const idDe = (x) => String(x?._id ?? x?.id ?? x ?? "");

/**
 * Reúne y calcula los datos del dashboard administrativo.
 * Solo usa endpoints que ya existen; si alguno falla, el resto del panel sigue funcionando.
 */
export default function useDashboardAdmin(filtros = {}) {
  const { empresa = "", puesto = "", estado = "" } = filtros;
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(false);

    const [resumen, cursos, rutas, puestos, empresas] = await Promise.allSettled([
      getResumen({ empresa, puesto, estado }),
      getCursos(),
      getRutas(),
      puestosService.list(),
      empresasService.list(),
    ]);

    // Sin el resumen no hay indicadores principales: se muestra el error.
    if (resumen.status === "rejected") {
      setError(true);
      setCargando(false);
      return;
    }

    const listaCursos = cursos.status === "fulfilled" ? cursos.value : [];
    const listaRutas = rutas.status === "fulfilled" ? rutas.value : [];
    const listaPuestos = puestos.status === "fulfilled" ? puestos.value : [];
    const listaEmpresas = empresas.status === "fulfilled" ? empresas.value : [];

    // ----- Estado de los cursos -----
    const estadoDe = (c) => c.estado ?? "BORRADOR";
    const publicados = listaCursos.filter((c) => estadoDe(c) === "PUBLICADO");
    const borradores = listaCursos.filter((c) => estadoDe(c) === "BORRADOR");
    const inactivos = listaCursos.filter((c) => estadoDe(c) === "INACTIVO");

    // ----- Cursos por nivel -----
    const niveles = ["básico", "intermedio", "avanzado"].map((nivel) => ({
      nivel,
      total: listaCursos.filter((c) => c.nivel === nivel).length,
    }));

    // ----- Pendientes -----
    const puestosConRuta = new Set(listaRutas.map((r) => idDe(r.puesto)));
    const puestosSinRuta = listaPuestos.filter((p) => !puestosConRuta.has(idDe(p)));
    const rutasSinCursos = listaRutas.filter((r) => !(r.cursos ?? []).length);

    const pendientes = [
      {
        id: "borradores",
        titulo: "Cursos en borrador",
        detalle: "Publícalos para poder incluirlos en una ruta.",
        total: borradores.length,
        items: borradores.map((c) => ({
          id: idDe(c),
          nombre: c.titulo,
          nota: c.totalUnidades ? `${c.totalUnidades} unidades` : "Sin unidades",
          to: `/dashboard/cursos/${idDe(c)}/unidades`,
        })),
        accion: { label: "Ver cursos", to: "/dashboard/cursos" },
      },
      {
        id: "puestos-sin-ruta",
        titulo: "Puestos sin ruta de aprendizaje",
        detalle: "Sus candidatos aún no tienen formación asignada.",
        total: puestosSinRuta.length,
        items: puestosSinRuta.map((p) => ({
          id: idDe(p),
          nombre: p.titulo ?? p.nombre,
          nota: "Crear ruta",
          to: "/dashboard/rutas/nuevo",
        })),
        accion: { label: "Crear ruta", to: "/dashboard/rutas/nuevo" },
      },
      {
        id: "rutas-sin-cursos",
        titulo: "Rutas sin cursos",
        detalle: "Agrega cursos publicados para que sean útiles.",
        total: rutasSinCursos.length,
        items: rutasSinCursos.map((r) => ({
          id: idDe(r),
          nombre: r.nombre,
          nota: r.puesto?.titulo ?? "",
          to: `/dashboard/rutas/${idDe(r)}/editar`,
        })),
        accion: { label: "Ver rutas", to: "/dashboard/rutas" },
      },
    ].filter((p) => p.total > 0);

    // ----- Competencias con más cursos -----
    const conteoCompetencias = new Map();
    for (const c of listaCursos) {
      const nombres = [c.competencia, ...(Array.isArray(c.competencias) ? c.competencias : [])]
        .map((x) => (typeof x === "string" ? x : x?.nombre))
        .filter(Boolean);
      for (const n of new Set(nombres)) conteoCompetencias.set(n, (conteoCompetencias.get(n) ?? 0) + 1);
    }
    const competencias = [...conteoCompetencias.entries()]
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // ----- Rutas con más cursos -----
    const topRutas = [...listaRutas]
      .map((r) => ({
        id: idDe(r),
        nombre: r.nombre,
        puesto: r.puesto?.titulo ?? "",
        cursos: (r.cursos ?? []).length,
        horas: r.duracionTotalHoras ?? 0,
      }))
      .sort((a, b) => b.cursos - a.cursos || b.horas - a.horas)
      .slice(0, 4);

    const r = resumen.value;
    const totalCursos = listaCursos.length || r.cursos || 0;
    const rutasConCursos = listaRutas.length - rutasSinCursos.length;

    // ----- Índice de preparación (0-100) -----
    // Promedio de tres coberturas: puestos con ruta, rutas con cursos y cursos publicados.
    const ratio = (a, b) => (b ? a / b : 0);
    const indicadores = [
      { label: "Puestos con ruta", valor: listaPuestos.length - puestosSinRuta.length, total: listaPuestos.length },
      { label: "Rutas con cursos", valor: rutasConCursos, total: listaRutas.length },
      { label: "Cursos publicados", valor: publicados.length, total: totalCursos },
    ];
    const conDatos = indicadores.filter((i) => i.total > 0);
    const preparacion = conDatos.length
      ? Math.round((conDatos.reduce((a, i) => a + ratio(i.valor, i.total), 0) / conDatos.length) * 100)
      : 0;

    setDatos({
      totales: { empresas: r.empresas ?? 0, puestos: r.puestos ?? 0, cursos: r.cursos ?? 0, rutas: r.rutas ?? 0 },
      recientes: r.recientes ?? [],
      // Métricas reales de formación y evaluaciones (entrega 5 de Marlon)
      formacion: {
        postulantes: r.postulantes ?? 0,
        procesos: r.procesos ?? { total: 0, activos: 0, suspendidos: 0, finalizados: 0 },
        cursosAsignados: r.cursosAsignados ?? { total: 0, habilitados: 0, pendientes: 0 },
        progreso: r.progreso ?? { asignaciones: 0, promedio: 0, completos: 0, sinIniciar: 0 },
        evaluaciones: r.evaluaciones ?? {
          publicadas: 0,
          resultados: { total: 0, aprobados: 0, reprobados: 0, enCurso: 0, promedio: null },
        },
        filtros: r.filtros ?? { empresa: empresa || null, puesto: puesto || null, estado: estado || null },
      },
      cursosEstado: {
        publicados: publicados.length,
        borradores: borradores.length,
        inactivos: inactivos.length,
        total: totalCursos,
      },
      porcentajePublicado: totalCursos ? Math.round((publicados.length / totalCursos) * 100) : 0,
      niveles,
      pendientes,
      totalPendientes: pendientes.reduce((a, p) => a + p.total, 0),
      puestosCubiertos: listaPuestos.length - puestosSinRuta.length,
      totalPuestos: listaPuestos.length,
      promedioCursosPorRuta: listaRutas.length
        ? Math.round((listaRutas.reduce((a, r) => a + (r.cursos ?? []).length, 0) / listaRutas.length) * 10) / 10
        : 0,
      topRutas,
      competencias,
      rutasConCursos,
      totalRutas: listaRutas.length,
      preparacion,
      indicadores,
      // Listas completas para los cálculos por periodo (tendencias y actividad) y selectores de filtro
      listas: { empresas: listaEmpresas, puestos: listaPuestos, cursos: listaCursos, rutas: listaRutas },
    });
    setCargando(false);
  }, [empresa, puesto, estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { datos, error, cargando, recargar: cargar };
}
