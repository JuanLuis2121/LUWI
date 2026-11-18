# API — Mi formación (postulante)

Endpoints que usa el postulante para ver su ruta de formación, revisar el contenido de los cursos y guardar dónde se quedó.

- Base: `/api/mi-formacion`
- Sesión: cookie `token` (JWT). Todas las rutas usan `requireAuth` + `requireRol("POSTULANTE")`.
- Respuesta exitosa: `{ data: ... }`
- Respuesta de error: `{ message, codigo }` (los errores 500 solo traen `message`).
- Documentación interactiva: `/api/docs` → etiqueta **Mi formación**.

## Endpoints

| Método | Ruta | Descripción | Respuesta (`data`) |
| --- | --- | --- | --- |
| GET | `/` | Resumen de la formación del postulante | `{ postulante, empresa, puesto, proceso, asignacion }` |
| GET | `/:asignacionId/cursos/:cursoAsignadoId` | Contenido de un curso habilitado | `{ asignacionId, curso, unidades, ultimaUnidadId, porcentajeGeneral }` |
| POST | `/:asignacionId/cursos/:cursoAsignadoId/unidades/:unidadId/revision` | Marca la unidad como revisada (idempotente) | Igual que el GET del curso |
| PUT | `/:asignacionId/ultima-consulta` | Guarda la última unidad consultada. Body: `{ cursoAsignadoId, unidadId }`. **No** cuenta como revisada | `{ cursoAsignadoId, unidadId }` |

- `cursoAsignadoId` es el `_id` del curso dentro de `AsignacionRuta.cursos`.
- `unidadId` es el `_id` de la unidad dentro de `Curso.unidades`.

### GET `/` — forma de `data`

```json
{
  "postulante": { "nombre": "…", "correo": "…" },
  "empresa": { "id": "…", "nombre": "…" },
  "puesto": { "id": "…", "titulo": "…" },
  "proceso": { "id": "…", "estado": "ACTIVO" },
  "asignacion": {
    "id": "…",
    "ruta": { "nombre": "…", "descripcion": "…" },
    "porcentaje": 20,
    "cursosHabilitados": 1,
    "totalCursos": 2,
    "tieneAvance": true,
    "cursos": [
      {
        "id": "…", "titulo": "…", "duracionHoras": 2, "nivel": "básico", "orden": 1,
        "acceso": "HABILITADO", "estado": "EN_CURSO",
        "totalUnidades": 4, "unidadesObligatorias": 3, "revisadasObligatorias": 1, "porcentaje": 33
      }
    ],
    "ultimaConsulta": { "cursoAsignadoId": "…", "unidadId": "…" }
  }
}
```

`empresa`, `puesto` y `proceso` son `null` si no hay proceso vigente; `asignacion` es `null` si el proceso no tiene una asignación `ACTIVA`.

## Códigos de error

| HTTP | `codigo` | Cuándo |
| --- | --- | --- |
| 401 | — | No hay sesión o el token no es válido |
| 403 | — | El usuario no tiene rol `POSTULANTE` ("No tienes permiso para acceder a esta sección.") |
| 404 | `NO_ENCONTRADO` | Id con formato inválido; la asignación no es `ACTIVA` o no es del proceso del usuario; el curso no está en la asignación; la unidad no existe |
| 404 | `SIN_PROCESO` | El postulante no tiene un proceso `ACTIVO` o `SUSPENDIDO` |
| 403 | `PROCESO_SUSPENDIDO` | "Tu proceso de formación está suspendido. Contacta a Recursos Humanos." |
| 403 | `CURSO_BLOQUEADO` | "Pendiente de habilitación por Recursos Humanos." |

Las validaciones se aplican en ese orden a los endpoints del curso, de la revisión y de la última consulta.

## Reglas del avance

- Solo cuentan las unidades **obligatorias** revisadas (`ProgresoUnidad`). Las opcionales se pueden marcar, pero no suben el porcentaje.
- Porcentaje del curso = revisadas obligatorias / obligatorias del curso.
- Porcentaje general = revisadas obligatorias / obligatorias de **toda** la ruta (incluye los cursos bloqueados).
- Se redondea al entero. Si el total es 0, el porcentaje es 0.
- Las unidades se leen del `Curso` actual (`asignacion.cursos[].curso`), ordenadas por `orden`.
- Estado de cada curso:
  - `BLOQUEADO`: `acceso` distinto de `HABILITADO`.
  - `REVISADO`: tiene al menos una unidad obligatoria y todas están revisadas.
  - `EN_CURSO`: alguna unidad revisada, o es el curso de la última consulta.
  - `SIN_INICIAR`: en cualquier otro caso.
- `ultimaConsulta` solo se devuelve si su curso sigue `HABILITADO` y la unidad todavía existe. Si el proceso está suspendido, se devuelve `null`.
- Marcar una unidad es idempotente (índice único `{ asignacion, unidad }` + upsert con `$setOnInsert`).
- Guardar la última consulta hace upsert del único registro de `UltimaConsulta` de la asignación.

## Pendientes de coordinación

- **Marlon** — CRUD de unidades de los cursos. Se propuso el subesquema `unidades` en `models/Curso.js`: `{ titulo (requerido, máx. 150), contenido (default ""), recursoUrl (opcional, máx. 500), obligatoria (default true), orden (requerido) }`. El `_id` de cada unidad es el `unidadId` que usan `ProgresoUnidad` y `UltimaConsulta`; al editar un curso no se deben recrear las unidades existentes (cambiaría su `_id` y se perdería el avance).
- **Wala** — Proteger las rutas administrativas (empresas, puestos, cursos, rutas, dashboard…) con `requireRol("ADMIN", "RRHH")` después de `requireAuth`. Hoy un postulante con sesión podría llamarlas directamente.
- **Deliani** — El acceso de cada curso se lee de `AsignacionRuta.cursos[].acceso` (`HABILITADO` / `BLOQUEADO`). Al habilitar o bloquear, actualizar también `fechaCambioAcceso`, `cambiadoPor` y agregar una entrada a `historialAcceso`.

## Datos de prueba

```bash
cd backend
npm run seed:postulante                 # crea o revisa los datos (idempotente)
npm run seed:postulante -- --habilitar  # habilita el curso 2
npm run seed:postulante -- --bloquear   # bloquea el curso 2
npm run seed:postulante -- --suspender  # suspende el proceso
npm run seed:postulante -- --activar    # reactiva el proceso
npm run seed:postulante -- --reiniciar  # borra el avance y la última consulta
```

Crea la "Empresa Demo LUWI", el puesto "Asistente administrativo de prueba", dos cursos con unidades, la "Ruta de incorporación - Demo LUWI" y el postulante:

- Correo: `postulante.prueba@luwi.test`
- Contraseña: `Postulante123`

La asignación queda con el curso 1 **HABILITADO** y el curso 2 **BLOQUEADO**.
