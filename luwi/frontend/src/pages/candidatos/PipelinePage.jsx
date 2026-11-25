import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActionButton, CountPill, EmptyState, PageHeader, SearchBox, TableCard, TableSkeleton } from "../../components/AdminUI";
import FilterMenu, { FilterChips } from "../../components/ui/FilterMenu";
import ViewSwitcher, { useVistaGuardada } from "../../components/ui/ViewSwitcher";
import BulkBar from "../../components/ui/BulkBar";
import { DownloadIcon } from "../../components/ui/icons";
import { useToast } from "../../components/ui/toast";
import { PlusIcon } from "../../components/dashboard/icons";
import TableroPipeline from "../../components/pipeline/TableroPipeline";
import TablaPipeline from "../../components/pipeline/TablaPipeline";
import FichaPostulanteDrawer from "../../components/pipeline/FichaPostulanteDrawer";
import IniciarProcesoModal from "../../components/pipeline/IniciarProcesoModal";
import AsignarRutaModal from "../../components/pipeline/AsignarRutaModal";
import NuevoPostulanteModal from "../../components/pipeline/NuevoPostulanteModal";
import ModalLuwi from "../../components/pipeline/ModalLuwi";
import { FlagIcon, PauseIcon, PlayIcon, UsersIcon } from "../../components/pipeline/Piezas";
import usePipeline from "../../hooks/usePipeline";
import useAtajosListado from "../../hooks/useAtajosListado";
import useAuth from "../../hooks/useAuth";
import { puestosService } from "../../services/puestosService";
import { cambiarEstadoProceso, iniciarProceso } from "../../services/procesosService";
import { descargarCSV } from "../../utils/exportar";
import { ROLES } from "../../utils/roles";
import { COLUMNAS_EXPORTAR, ESTADO_PROCESO, accionAlSoltar, armarTarjetas } from "../../utils/pipeline";

const SITUACIONES = [
  { value: "ACTIVO", label: "Proceso activo" },
  { value: "SUSPENDIDO", label: "Proceso suspendido" },
  { value: "FINALIZADO", label: "Proceso finalizado" },
  { value: "SIN_PROCESO", label: "Sin proceso" },
  { value: "PENDIENTE", label: "Invitación pendiente" },
];

const TEXTO_ESTADO = {
  SUSPENDIDO: { hecho: "Proceso suspendido", verbo: "Suspender" },
  ACTIVO: { hecho: "Proceso reactivado", verbo: "Reactivar" },
  FINALIZADO: { hecho: "Proceso finalizado", verbo: "Finalizar" },
};

const normalizar = (t) =>
  (t ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const RefreshIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" />
  </svg>
);

export default function PipelinePage() {
  const toast = useToast();
  const { user } = useAuth();
  const puedeRegistrar = user?.rol === ROLES.RRHH;
  const { tarjetas, loading, error, recargar, reemplazarProceso } = usePipeline();

  const [vista, setVista] = useVistaGuardada("pipeline", "kanban", ["kanban", "tabla"]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroPuesto, setFiltroPuesto] = useState([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState([]);
  const [filtroSituacion, setFiltroSituacion] = useState([]);
  const [seleccion, setSeleccion] = useState(new Set());
  const [abiertoKey, setAbiertoKey] = useState(null);
  const [modal, setModal] = useState(null); // { tipo, tarjeta, continuar? }
  const [ocupadas, setOcupadas] = useState(new Set());
  const [puestos, setPuestos] = useState([]);
  const buscarRef = useRef(null);

  // Puestos para iniciar procesos y registrar postulantes
  useEffect(() => {
    puestosService
      .list()
      .then((lista) =>
        setPuestos(
          lista.map((p) => ({
            id: String(p.id),
            titulo: p.titulo,
            empresaId: p.empresaId ? String(p.empresaId) : null,
            empresaNombre: typeof p.empresa === "object" ? p.empresa?.nombre ?? "" : "",
          }))
        )
      )
      .catch(() => setPuestos([]));
  }, []);

  const abierta = tarjetas.find((t) => t.key === abiertoKey) ?? null;

  // ---------- filtros ----------

  const opcionesPuesto = useMemo(() => {
    const mapa = new Map();
    for (const t of tarjetas) {
      const lista = t.proceso?.puesto ? [t.proceso.puesto] : t.postulante?.puestosAplicados ?? [];
      for (const p of lista) {
        if (!p?.id) continue;
        const actual = mapa.get(p.id) ?? { value: p.id, label: p.titulo || "Puesto", count: 0 };
        actual.count += 1;
        mapa.set(p.id, actual);
      }
    }
    return [...mapa.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [tarjetas]);

  const opcionesEmpresa = useMemo(() => {
    const mapa = new Map();
    for (const t of tarjetas) {
      const e = t.proceso?.empresa;
      if (!e?.id) continue;
      const actual = mapa.get(e.id) ?? { value: e.id, label: e.nombre, count: 0 };
      actual.count += 1;
      mapa.set(e.id, actual);
    }
    return [...mapa.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [tarjetas]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return tarjetas.filter((t) => {
      if (q) {
        const texto = normalizar(
          [t.nombre, t.correo, t.proceso?.puesto?.titulo, t.proceso?.asignacion?.ruta?.nombre, ...(t.postulante?.habilidades ?? [])].join(" ")
        );
        if (!texto.includes(q)) return false;
      }
      if (filtroPuesto.length) {
        const ids = t.proceso?.puesto ? [t.proceso.puesto.id] : (t.postulante?.puestosAplicados ?? []).map((p) => p.id);
        if (!ids.some((id) => filtroPuesto.includes(id))) return false;
      }
      if (filtroEmpresa.length && !filtroEmpresa.includes(t.proceso?.empresa?.id)) return false;
      if (filtroSituacion.length) {
        const marcas = [t.proceso ? t.proceso.estado : "SIN_PROCESO"];
        if (t.postulante?.cuenta === "PENDIENTE") marcas.push("PENDIENTE");
        if (!marcas.some((m) => filtroSituacion.includes(m))) return false;
      }
      return true;
    });
  }, [tarjetas, busqueda, filtroPuesto, filtroEmpresa, filtroSituacion]);

  const chips = [
    ...filtroPuesto.map((v) => ({ key: `puesto:${v}`, label: `Puesto: ${opcionesPuesto.find((o) => o.value === v)?.label ?? "—"}` })),
    ...filtroEmpresa.map((v) => ({ key: `empresa:${v}`, label: `Empresa: ${opcionesEmpresa.find((o) => o.value === v)?.label ?? "—"}` })),
    ...filtroSituacion.map((v) => ({ key: `situacion:${v}`, label: SITUACIONES.find((o) => o.value === v)?.label ?? v })),
  ];
  const hayFiltros = chips.length > 0 || busqueda.trim() !== "";

  const quitarChip = (key) => {
    const [tipo, valor] = key.split(":");
    if (tipo === "puesto") setFiltroPuesto((l) => l.filter((x) => x !== valor));
    if (tipo === "empresa") setFiltroEmpresa((l) => l.filter((x) => x !== valor));
    if (tipo === "situacion") setFiltroSituacion((l) => l.filter((x) => x !== valor));
  };
  const limpiarTodo = () => {
    setBusqueda("");
    setFiltroPuesto([]);
    setFiltroEmpresa([]);
    setFiltroSituacion([]);
  };

  // Quitar de la selección lo que ya no está visible
  useEffect(() => {
    setSeleccion((s) => {
      const keys = new Set(visibles.map((t) => t.key));
      const nueva = new Set([...s].filter((k) => keys.has(k)));
      return nueva.size === s.size ? s : nueva;
    });
  }, [visibles]);

  // ---------- indicadores ----------

  const stats = useMemo(() => {
    const conRuta = tarjetas.filter((t) => t.proceso?.asignacion);
    const promedio = conRuta.length ? Math.round(conRuta.reduce((s, t) => s + t.proceso.asignacion.porcentaje, 0) / conRuta.length) : 0;
    const personas = new Set(tarjetas.map((t) => t.postulante?.id).filter(Boolean)).size;
    return [
      { label: "Postulantes", value: personas },
      { label: "En formación", value: tarjetas.filter((t) => t.etapa === "EN_FORMACION").length },
      { label: "Listos", value: tarjetas.filter((t) => t.etapa === "LISTO").length },
      { label: "Avance promedio", value: `${promedio}%` },
    ];
  }, [tarjetas]);

  // ---------- acciones ----------

  const marcarOcupada = (key, si) =>
    setOcupadas((s) => {
      const n = new Set(s);
      if (si) n.add(key);
      else n.delete(key);
      return n;
    });

  const aplicarEstado = useCallback(
    async (tarjeta, estado, { conDeshacer = true } = {}) => {
      const anterior = tarjeta.proceso.estado;
      marcarOcupada(tarjeta.key, true);
      try {
        const fila = await cambiarEstadoProceso(tarjeta.proceso.id, estado);
        reemplazarProceso(fila);
        if (conDeshacer) {
          toast({
            title: TEXTO_ESTADO[estado].hecho,
            description: tarjeta.nombre,
            variant: "success",
            duration: 6000,
            action: {
              label: "Deshacer",
              onClick: () => aplicarEstado({ ...tarjeta, proceso: fila }, anterior, { conDeshacer: false }),
            },
          });
        }
        return true;
      } catch (e) {
        toast({ title: `No se pudo ${TEXTO_ESTADO[estado].verbo.toLowerCase()}`, description: e.message, variant: "error" });
        return false;
      } finally {
        marcarOcupada(tarjeta.key, false);
      }
    },
    [reemplazarProceso, toast]
  );

  const pedirEstado = (tarjeta, estado) => {
    if (estado === "FINALIZADO") setModal({ tipo: "finalizar", tarjeta });
    else aplicarEstado(tarjeta, estado);
  };

  const confirmarIniciar = async (puestoId) => {
    const { tarjeta, continuar } = modal;
    const fila = await iniciarProceso(tarjeta.postulante.id, puestoId);
    reemplazarProceso(fila);
    const nueva = armarTarjetas({ procesos: [fila], candidatosSinProceso: [] })[0];
    if (abiertoKey === tarjeta.key) setAbiertoKey(nueva.key);
    toast({ title: "Proceso iniciado", description: `${tarjeta.nombre} · ${fila.puesto?.titulo ?? ""}`, variant: "success" });
    setModal(continuar ? { tipo: "asignar", tarjeta: nueva } : null);
  };

  const alAsignar = async (ruta) => {
    const { tarjeta } = modal;
    await recargar();
    setModal(null);
    toast({ title: "Ruta asignada", description: `${tarjeta.nombre} · ${ruta.nombre}`, variant: "success" });
  };

  const alCrearPostulante = async ({ correoEnviado, mensaje }) => {
    await recargar();
    setModal(null);
    toast({
      title: correoEnviado ? "Postulante registrado" : "Postulante registrado sin correo",
      description: mensaje,
      variant: correoEnviado ? "success" : "info",
    });
  };

  const soltar = (tarjeta, destino) => {
    const { accion, mensaje } = accionAlSoltar(tarjeta, destino);
    if (accion === "bloqueado") toast({ title: "Movimiento no permitido", description: mensaje, variant: "info" });
    if (accion === "iniciar") setModal({ tipo: "iniciar", tarjeta });
    if (accion === "iniciar-y-asignar") setModal({ tipo: "iniciar", tarjeta, continuar: true });
    if (accion === "asignar") setModal({ tipo: "asignar", tarjeta });
    if (accion === "finalizar") setModal({ tipo: "finalizar", tarjeta });
    if (accion === "reabrir") aplicarEstado(tarjeta, "ACTIVO");
  };

  // ---------- selección y acciones masivas ----------

  const alternar = (key) =>
    setSeleccion((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const elegidas = visibles.filter((t) => seleccion.has(t.key));

  const enLote = async (estado, permitidos) => {
    const aplicables = elegidas.filter((t) => t.proceso && permitidos.includes(t.proceso.estado));
    if (aplicables.length === 0) {
      toast({ title: "Nada que cambiar", description: "Ninguno de los seleccionados admite esta acción.", variant: "info" });
      return;
    }
    const resultados = await Promise.all(aplicables.map((t) => aplicarEstado(t, estado, { conDeshacer: false })));
    const ok = resultados.filter(Boolean).length;
    setSeleccion(new Set());
    toast({
      title: `${TEXTO_ESTADO[estado].hecho}${ok === 1 ? "" : "s"}: ${ok}`,
      description: ok < aplicables.length ? `${aplicables.length - ok} no se pudieron cambiar.` : undefined,
      variant: ok === aplicables.length ? "success" : "error",
    });
  };

  const exportar = (lista) => descargarCSV("postulantes-luwi", COLUMNAS_EXPORTAR, lista);

  const accionesLote = [
    { key: "exportar", label: "Exportar", icon: DownloadIcon, onClick: () => exportar(elegidas) },
    { key: "suspender", label: "Suspender", icon: PauseIcon, onClick: () => enLote("SUSPENDIDO", ["ACTIVO"]) },
    { key: "reactivar", label: "Reactivar", icon: PlayIcon, onClick: () => enLote("ACTIVO", ["SUSPENDIDO"]) },
    { key: "finalizar", label: "Finalizar", icon: FlagIcon, onClick: () => enLote("FINALIZADO", ["ACTIVO", "SUSPENDIDO"]) },
  ];

  const abrirNuevo = useCallback(() => puedeRegistrar && setModal({ tipo: "nuevo" }), [puedeRegistrar]);
  const limpiarSeleccion = useCallback(() => setSeleccion(new Set()), []);
  useAtajosListado({ buscarRef, onNuevo: puedeRegistrar ? abrirNuevo : undefined, onEscape: limpiarSeleccion });

  // ---------- render ----------

  const botonNuevo = puedeRegistrar ? (
    <ActionButton variant="primary" onClick={abrirNuevo} title="Nuevo postulante (N)">
      <PlusIcon className="h-4 w-4" />
      Nuevo postulante
    </ActionButton>
  ) : null;

  const contenido = loading ? (
    <TableSkeleton />
  ) : error ? (
    <EmptyState icon={UsersIcon} title="No se pudo cargar el pipeline" text={error} action={<ActionButton onClick={recargar}>Reintentar</ActionButton>} />
  ) : visibles.length === 0 ? (
    <EmptyState
      icon={UsersIcon}
      title={hayFiltros ? "Sin resultados" : "Aún no hay postulantes"}
      text={hayFiltros ? "No hay postulantes que coincidan con la búsqueda o los filtros." : "Registra postulantes para seguir su formación desde aquí."}
      action={hayFiltros ? <ActionButton onClick={limpiarTodo}>Limpiar filtros</ActionButton> : botonNuevo}
    />
  ) : vista === "tabla" ? (
    <TablaPipeline
      tarjetas={visibles}
      seleccion={seleccion}
      onSeleccionar={alternar}
      onSeleccionarTodos={(si) => setSeleccion(si ? new Set(visibles.map((t) => t.key)) : new Set())}
      onAbrir={(t) => setAbiertoKey(t.key)}
      ocupadas={ocupadas}
    />
  ) : (
    <TableroPipeline
      tarjetas={visibles}
      seleccion={seleccion}
      onSeleccionar={alternar}
      onAbrir={(t) => setAbiertoKey(t.key)}
      onSoltar={soltar}
      ocupadas={ocupadas}
    />
  );

  const aFinalizar = modal?.tipo === "finalizar" ? modal.tarjeta : null;
  const avanceFinal = aFinalizar?.proceso?.asignacion?.porcentaje;

  return (
    <div>
      <PageHeader
        icon={UsersIcon}
        seccion="Talento"
        title="Pipeline de postulantes"
        subtitle="Sigue a cada postulante desde su registro hasta que está listo para el puesto."
        stats={loading || error ? [] : stats}
        action={botonNuevo}
      />

      <TableCard>
        <div className="flex flex-wrap items-center gap-3 border-b border-luwi-linea/70 px-5 py-4">
          <div ref={buscarRef} className="min-w-[220px] flex-1">
            <SearchBox value={busqueda} onChange={setBusqueda} placeholder="Buscar postulante, puesto o habilidad" />
          </div>
          <FilterMenu label="Puesto" options={opcionesPuesto} value={filtroPuesto} onChange={setFiltroPuesto} />
          {opcionesEmpresa.length > 1 && <FilterMenu label="Empresa" options={opcionesEmpresa} value={filtroEmpresa} onChange={setFiltroEmpresa} />}
          <FilterMenu label="Situación" options={SITUACIONES} value={filtroSituacion} onChange={setFiltroSituacion} />
          <ViewSwitcher value={vista} onChange={setVista} opciones={["kanban", "tabla"]} />
          <ActionButton size="sm" className="h-11 w-11" onClick={recargar} title="Actualizar" aria-label="Actualizar">
            <RefreshIcon className="h-4 w-4" />
          </ActionButton>
          <ActionButton size="sm" className="h-11 px-3.5" onClick={() => exportar(visibles)} disabled={!visibles.length} title="Exportar lo visible a CSV">
            <DownloadIcon className="h-4 w-4" />
            CSV
          </ActionButton>
        </div>

        {(chips.length > 0 || (!loading && !error)) && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
            <FilterChips chips={chips} onRemove={quitarChip} onClear={limpiarTodo} />
            {!loading && !error && (
              <div className="ml-auto flex items-center gap-3">
                {vista === "kanban" && <span className="hidden text-[11px] text-luwi-texto/60 md:inline">Arrastra las tarjetas para avanzar de etapa</span>}
                <CountPill>
                  {visibles.length} {visibles.length === 1 ? "postulante" : "postulantes"}
                </CountPill>
              </div>
            )}
          </div>
        )}

        {contenido}
      </TableCard>

      <BulkBar count={elegidas.length} actions={accionesLote} onClear={limpiarSeleccion} />

      {abierta && !modal && (
        <FichaPostulanteDrawer
          tarjeta={abierta}
          onClose={() => setAbiertoKey(null)}
          onIniciar={(t) => setModal({ tipo: "iniciar", tarjeta: t })}
          onAsignar={(t) => setModal({ tipo: "asignar", tarjeta: t })}
          onEstado={pedirEstado}
          onRecargar={recargar}
          ocupada={ocupadas.has(abierta.key)}
        />
      )}

      {modal?.tipo === "iniciar" && (
        <IniciarProcesoModal
          tarjeta={modal.tarjeta}
          puestos={puestos}
          continuarConRuta={Boolean(modal.continuar)}
          onClose={() => setModal(null)}
          onConfirm={confirmarIniciar}
        />
      )}

      {modal?.tipo === "asignar" && <AsignarRutaModal tarjeta={modal.tarjeta} onClose={() => setModal(null)} onAsignado={alAsignar} />}

      <NuevoPostulanteModal open={modal?.tipo === "nuevo"} puestos={puestos} onClose={() => setModal(null)} onCreado={alCrearPostulante} />

      <ModalLuwi
        open={Boolean(aFinalizar)}
        onClose={() => setModal(null)}
        icon={FlagIcon}
        tono="verde"
        title="Finalizar proceso"
        subtitle={aFinalizar ? `${aFinalizar.nombre} pasará a “Listos” y su proceso quedará cerrado.` : ""}
        footer={
          <>
            <ActionButton onClick={() => setModal(null)}>Cancelar</ActionButton>
            <ActionButton
              variant="primary"
              onClick={async () => {
                const t = aFinalizar;
                setModal(null);
                await aplicarEstado(t, "FINALIZADO");
              }}
            >
              Finalizar proceso
            </ActionButton>
          </>
        }
      >
        {aFinalizar && (
          <div className="space-y-3 text-sm text-luwi-texto">
            <p>
              Estado actual: <strong className="font-semibold text-luwi-profundo">{ESTADO_PROCESO[aFinalizar.proceso?.estado]?.label}</strong>
              {aFinalizar.proceso?.asignacion ? ` · avance ${avanceFinal}%` : " · sin ruta asignada"}
            </p>
            {(avanceFinal ?? 0) < 100 && (
              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-100">
                Todavía no ha completado su ruta. Puedes finalizar igual y reabrir el proceso más adelante si hace falta.
              </p>
            )}
          </div>
        )}
      </ModalLuwi>
    </div>
  );
}
