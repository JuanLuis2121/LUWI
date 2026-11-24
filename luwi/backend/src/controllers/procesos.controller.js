import mongoose from "mongoose";
import ProcesoFormacion, {
  ESTADOS_PROCESO,
} from "../models/ProcesoFormacion.js";
import AsignacionRuta from "../models/AsignacionRuta.js";
import Candidato from "../models/Candidato.js";
import Puesto from "../models/Puesto.js";
import User from "../models/user.model.js";
import { perteneceAEmpresa } from "../middlewares/auth.middleware.js";
import { avanceDeAsignacion } from "../services/formacion.service.js";

// Pipeline de postulantes (RR. HH.).
// Cada proceso se ubica en una etapa calculada a partir de sus datos reales:
//   POR_ASIGNAR  -> proceso sin ruta activa.
//   EN_FORMACION -> tiene ruta y aún no llega al 100 %.
//   LISTO        -> proceso FINALIZADO o ruta completada al 100 %.
// Los postulantes sin ningún proceso se devuelven aparte (etapa NUEVO).

const esId = (id) => mongoose.isObjectIdOrHexString(id);
const texto = (id) => (id == null ? null : String(id));

// Empresa del usuario de la sesión (null para el ADMIN general).
const empresaDeSesion = (req) =>
  req.user.role === "ADMIN"
    ? null
    : (req.user.empresa?._id ?? req.user.empresa ?? null);

function etapaDe(proceso, asignacion) {
  if (proceso.estado === "FINALIZADO") return "LISTO";
  if (!asignacion) return "POR_ASIGNAR";
  if (asignacion.porcentaje >= 100) return "LISTO";
  return "EN_FORMACION";
}

const datosCandidato = (c, cuentas) =>
  c
    ? {
        id: String(c._id),
        nombre: c.nombre,
        correo: c.correo,
        telefono: c.telefono ?? "",
        habilidades: c.habilidades ?? [],
        puestosAplicados: (c.puestosAplicados ?? []).map((p) =>
          typeof p === "object" && p?.titulo
            ? { id: String(p._id), titulo: p.titulo }
            : { id: String(p), titulo: "" },
        ),
        cuenta: cuentas.get(texto(c.usuario)) ?? "SIN_CUENTA",
        creadoEn: c.createdAt ?? null,
      }
    : null;

// Estado de la cuenta de cada usuario (PENDIENTE = no ha activado su invitación).
async function cuentasDe(candidatos) {
  const ids = candidatos.map((c) => c?.usuario).filter(Boolean);

  if (ids.length === 0) return new Map();

  const usuarios = await User.find({ _id: { $in: ids } })
    .select("estadoCuenta")
    .lean();

  return new Map(
    usuarios.map((u) => [String(u._id), u.estadoCuenta ?? "ACTIVA"]),
  );
}

// Resumen de la ruta activa de cada proceso.
async function asignacionesDe(procesoIds) {
  if (procesoIds.length === 0) return new Map();

  const asignaciones = await AsignacionRuta.find({
    proceso: { $in: procesoIds },
    estado: "ACTIVA",
  }).lean();

  const resumenes = await Promise.all(
    asignaciones.map(async (a) => {
      const { avance } = await avanceDeAsignacion(a);
      const duracionHoras = a.cursos.reduce(
        (total, curso) => total + (curso.duracionHoras || 0),
        0,
      );

      return [
        String(a.proceso),
        {
          id: String(a._id),
          ruta: {
            id: texto(a.ruta),
            nombre: a.estructura?.nombre ?? "Ruta asignada",
          },
          fechaAsignacion: a.fechaAsignacion ?? a.createdAt ?? null,
          porcentaje: avance.porcentajeGeneral ?? 0,
          cursosHabilitados: avance.cursosHabilitados ?? 0,
          totalCursos: avance.totalCursos ?? a.cursos.length,
          duracionHoras: Math.round(duracionHoras * 100) / 100,
        },
      ];
    }),
  );

  return new Map(resumenes);
}

function filaDeProceso(p, asignacion, cuentas) {
  return {
    id: String(p._id),
    estado: p.estado,
    etapa: etapaDe(p, asignacion),
    fechaInicio: p.fechaInicio,
    fechaSuspension: p.fechaSuspension ?? null,
    fechaFinalizacion: p.fechaFinalizacion ?? null,
    actualizadoEn: p.updatedAt ?? p.fechaInicio,
    postulante: datosCandidato(p.candidato, cuentas),
    puesto: p.puesto
      ? { id: String(p.puesto._id), titulo: p.puesto.titulo }
      : null,
    empresa: p.empresa
      ? { id: String(p.empresa._id), nombre: p.empresa.nombre }
      : null,
    asignacion: asignacion ?? null,
  };
}

const POBLAR_PROCESO = [
  {
    path: "candidato",
    select:
      "nombre correo telefono habilidades usuario puestosAplicados createdAt",
    populate: { path: "puestosAplicados", select: "titulo" },
  },
  { path: "puesto", select: "titulo" },
  { path: "empresa", select: "nombre" },
];

async function filaPorId(procesoId) {
  const proceso = await ProcesoFormacion.findById(procesoId)
    .populate(POBLAR_PROCESO)
    .lean();

  if (!proceso) return null;

  const [asignaciones, cuentas] = await Promise.all([
    asignacionesDe([proceso._id]),
    cuentasDe([proceso.candidato]),
  ]);

  return filaDeProceso(proceso, asignaciones.get(String(proceso._id)), cuentas);
}

// GET /api/procesos-formacion
export async function listarPipeline(req, res) {
  try {
    const empresa = empresaDeSesion(req);

    if (req.user.role !== "ADMIN" && !empresa) {
      return res.status(403).json({
        message: "No tienes una empresa asociada.",
      });
    }

    const filtroEmpresa = empresa ? { empresa } : {};

    const procesos = await ProcesoFormacion.find(filtroEmpresa)
      .populate(POBLAR_PROCESO)
      .sort({ updatedAt: -1 })
      .lean();

    // Postulantes de la empresa: por el campo empresa del perfil o, en
    // registros antiguos que no lo tienen, por la empresa de su usuario.
    let filtroCandidatos = {};

    if (empresa) {
      const usuarios = await User.find({ empresa, role: "POSTULANTE" })
        .select("_id")
        .lean();

      filtroCandidatos = {
        $or: [
          { empresa },
          { empresa: null, usuario: { $in: usuarios.map((u) => u._id) } },
        ],
      };
    }

    const conProceso = new Set(procesos.map((p) => texto(p.candidato?._id)));

    const candidatos = (
      await Candidato.find(filtroCandidatos)
        .select(
          "nombre correo telefono habilidades usuario puestosAplicados createdAt",
        )
        .populate("puestosAplicados", "titulo")
        .sort({ createdAt: -1 })
        .lean()
    ).filter((c) => !conProceso.has(String(c._id)));

    const [asignaciones, cuentas] = await Promise.all([
      asignacionesDe(procesos.map((p) => p._id)),
      cuentasDe([...procesos.map((p) => p.candidato), ...candidatos]),
    ]);

    return res.json({
      data: {
        procesos: procesos
          .filter((p) => p.candidato)
          .map((p) =>
            filaDeProceso(p, asignaciones.get(String(p._id)), cuentas),
          ),
        candidatosSinProceso: candidatos.map((c) => datosCandidato(c, cuentas)),
      },
    });
  } catch (error) {
    console.error("Error al listar el pipeline:", error);
    return res.status(500).json({
      message: "No se pudo cargar el pipeline de postulantes.",
    });
  }
}

// POST /api/procesos-formacion  { candidatoId, puestoId }
export async function crearProceso(req, res) {
  try {
    const { candidatoId, puestoId } = req.body ?? {};

    if (!esId(candidatoId) || !esId(puestoId)) {
      return res.status(400).json({
        message: "Indica un postulante y un puesto válidos.",
      });
    }

    const [candidato, puesto] = await Promise.all([
      Candidato.findById(candidatoId).select("empresa usuario").lean(),
      Puesto.findById(puestoId).select("empresa titulo").lean(),
    ]);

    if (!candidato) {
      return res.status(404).json({ message: "Postulante no encontrado." });
    }

    if (!puesto) {
      return res.status(404).json({ message: "Puesto no encontrado." });
    }

    if (!perteneceAEmpresa(req.user, puesto.empresa)) {
      return res
        .status(403)
        .json({ message: "El puesto pertenece a otra empresa." });
    }

    // Empresa del postulante (perfil o, en registros antiguos, su usuario).
    let empresaCandidato = candidato.empresa;

    if (!empresaCandidato && candidato.usuario) {
      const usuario = await User.findById(candidato.usuario)
        .select("empresa")
        .lean();

      empresaCandidato = usuario?.empresa;
    }

    if (
      !empresaCandidato ||
      String(empresaCandidato) !== String(puesto.empresa)
    ) {
      return res.status(400).json({
        message:
          "El postulante y el puesto deben pertenecer a la misma empresa.",
      });
    }

    const proceso = await mongoose.connection.transaction(async (session) => {
      const [creado] = await ProcesoFormacion.create(
        [
          {
            candidato: candidato._id,
            empresa: puesto.empresa,
            puesto: puesto._id,
            estado: "ACTIVO",
            fechaInicio: new Date(),
            creadoPor: req.user._id,
          },
        ],
        { session },
      );

      const resultado = await Candidato.updateOne(
        { _id: candidato._id, empresa: candidato.empresa ?? null },
        {
          $addToSet: { puestosAplicados: puesto._id },
          $set: { empresa: puesto.empresa },
        },
        { session },
      );

      if (resultado.matchedCount !== 1) {
        const error = new Error(
          "El postulante cambió durante la operación. Inténtalo de nuevo.",
        );
        error.status = 409;
        throw error;
      }

      return creado;
    });

    return res.status(201).json({
      message: "Proceso de formación iniciado.",
      data: await filaPorId(proceso._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Este postulante ya tiene un proceso vigente para ese puesto.",
      });
    }

    if (error.status === 409) {
      return res.status(409).json({ message: error.message });
    }

    console.error("Error al crear el proceso:", error);
    return res.status(500).json({ message: "No se pudo iniciar el proceso." });
  }
}

// Cambios de estado permitidos.
const TRANSICIONES = {
  ACTIVO: ["SUSPENDIDO", "FINALIZADO"],
  SUSPENDIDO: ["ACTIVO", "FINALIZADO"],
  FINALIZADO: ["ACTIVO", "SUSPENDIDO"],
};

// PATCH /api/procesos-formacion/:procesoId/estado  { estado }
export async function cambiarEstadoProceso(req, res) {
  try {
    const { procesoId } = req.params;
    const { estado } = req.body ?? {};

    if (!esId(procesoId)) {
      return res.status(400).json({ message: "ID de proceso inválido." });
    }

    if (!ESTADOS_PROCESO.includes(estado)) {
      return res.status(400).json({ message: "Estado no válido." });
    }

    const proceso = await ProcesoFormacion.findById(procesoId);

    if (!proceso || !perteneceAEmpresa(req.user, proceso.empresa)) {
      return res.status(404).json({
        message: "Proceso de formación no encontrado.",
      });
    }

    if (proceso.estado !== estado) {
      if (!TRANSICIONES[proceso.estado]?.includes(estado)) {
        return res.status(409).json({
          message: `No se puede pasar de ${proceso.estado.toLowerCase()} a ${estado.toLowerCase()}.`,
        });
      }

      proceso.estado = estado;
      if (estado === "SUSPENDIDO") proceso.fechaSuspension = new Date();
      if (estado === "FINALIZADO") proceso.fechaFinalizacion = new Date();

      if (estado === "ACTIVO") {
        proceso.fechaSuspension = undefined;
        proceso.fechaFinalizacion = undefined;
      }

      await proceso.save();
    }

    return res.json({
      message: "Estado actualizado.",
      data: await filaPorId(proceso._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "El postulante ya tiene otro proceso vigente para ese puesto.",
      });
    }

    console.error("Error al cambiar el estado del proceso:", error);
    return res.status(500).json({
      message: "No se pudo cambiar el estado del proceso.",
    });
  }
}
