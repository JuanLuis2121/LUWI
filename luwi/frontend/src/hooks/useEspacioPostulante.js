import { useEffect, useMemo, useState } from "react";
import {
  avanceSemanal, calcularLogros, calcularRacha, contarNotas, guardarAnimo, guardarAvatar, guardarMeta, guardarRitmo,
  leerAnimo, leerAvatar, leerDias, leerMeta, leerRitmo, registrarVisita, semanaActual,
} from "../utils/espacioPostulante";

/**
 * Hábitos y preferencias del postulante guardados en este navegador.
 * - uid: identificador del usuario (su correo).
 * - resumen: resultado de resumenFormacion() (puede ser null).
 * - asignacion: asignación activa (para el avance y las notas).
 */
export default function useEspacioPostulante(uid, resumen, asignacion) {
  const [dias, setDias] = useState(() => leerDias(uid));
  const [meta, setMetaEstado] = useState(() => leerMeta(uid));
  const [ritmo, setRitmoEstado] = useState(() => leerRitmo(uid));
  const [animo, setAnimoEstado] = useState(() => leerAnimo(uid));
  const [avatar, setAvatarEstado] = useState(() => leerAvatar(uid));

  // Al entrar se registra el día y se cargan las preferencias de este usuario
  useEffect(() => {
    if (!uid) return;
    setDias(registrarVisita(uid));
    setMetaEstado(leerMeta(uid));
    setRitmoEstado(leerRitmo(uid));
    setAnimoEstado(leerAnimo(uid));
    setAvatarEstado(leerAvatar(uid));
  }, [uid]);

  const unidades = resumen?.unidadesRevisadas ?? 0;
  const semana = useMemo(() => {
    const activos = new Set(dias);
    const hoy = new Date().toDateString();
    return semanaActual().map((d) => ({ ...d, activo: activos.has(d.dia), hoy: d.fecha.toDateString() === hoy, futuro: d.fecha > new Date() }));
  }, [dias]);

  const racha = useMemo(() => calcularRacha(dias), [dias]);
  const diasSemana = semana.filter((d) => d.activo).length;
  const hechasSemana = useMemo(() => (resumen ? avanceSemanal(uid, unidades) : 0), [uid, unidades, resumen]);
  const notas = useMemo(() => contarNotas(asignacion?.id), [asignacion?.id]);

  const logros = useMemo(
    () =>
      calcularLogros({
        resumen,
        porcentaje: asignacion?.porcentaje ?? 0,
        racha,
        diasSemana,
        notas,
        metaCumplida: hechasSemana >= meta,
      }),
    [resumen, asignacion?.porcentaje, racha, diasSemana, notas, hechasSemana, meta]
  );

  return {
    semana,
    racha,
    diasSemana,
    notas,
    logros,
    meta,
    hechasSemana,
    ritmo,
    animo,
    avatar,
    setMeta: (v) => {
      guardarMeta(uid, v);
      setMetaEstado(v);
    },
    setRitmo: (v) => {
      guardarRitmo(uid, v);
      setRitmoEstado(v);
    },
    setAnimo: (v) => {
      guardarAnimo(uid, v);
      setAnimoEstado(v);
    },
    setAvatar: (v) => {
      guardarAvatar(uid, v);
      setAvatarEstado(v);
    },
  };
}
