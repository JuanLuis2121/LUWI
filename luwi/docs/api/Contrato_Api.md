# Contrato de Endpoints - LUWI

## 1. Autenticación

| Método HTTP | Endpoint             | ¿Qué recibe?                  | ¿Qué devuelve?                    |
| ----------- | -------------------- | ----------------------------- | --------------------------------- |
| POST        | `/api/auth/register` | Datos de registro del usuario | Confirmación o error              |
| POST        | `/api/auth/login`    | Credenciales del usuario      | Resultado del inicio de sesión    |
| POST        | `/api/auth/logout`   | Solicitud de cierre de sesión | Confirmación del cierre de sesión |

## 2. Empresas

| Método HTTP | Endpoint            | ¿Qué recibe?                     | ¿Qué devuelve?              |
| ----------- | ------------------- | -------------------------------- | --------------------------- |
| GET         | `/api/empresas`     | Ninguno o parámetros de consulta | Lista de empresas           |
| GET         | `/api/empresas/:id` | ID de la empresa                 | Datos de una empresa        |
| POST        | `/api/empresas`     | Datos de la empresa              | Empresa creada o error      |
| PUT         | `/api/empresas/:id` | ID y datos actualizados          | Empresa actualizada o error |
| DELETE      | `/api/empresas/:id` | ID de la empresa                 | Confirmación de eliminación |

## 3. Candidatos

| Método HTTP | Endpoint              | ¿Qué recibe?            | ¿Qué devuelve?                           |
| ----------- | --------------------- | ----------------------- | ---------------------------------------- |
| GET         | `/api/candidatos`     | Ninguno                 | Mensaje de módulo en construcción        |
| GET         | `/api/candidatos/:id` | ID del candidato        | Mensaje con el ID solicitado             |
| POST        | `/api/candidatos`     | Datos del candidato     | Mensaje de creación en construcción      |
| PUT         | `/api/candidatos/:id` | ID y datos actualizados | Mensaje de actualización en construcción |
| DELETE      | `/api/candidatos/:id` | ID del candidato        | Mensaje de eliminación en construcción   |

## 4. Cursos

| Método HTTP | Endpoint          | ¿Qué recibe?                     | ¿Qué devuelve?              |
| ----------- | ----------------- | -------------------------------- | --------------------------- |
| GET         | `/api/cursos`     | Ninguno o parámetros de consulta | Lista de cursos             |
| GET         | `/api/cursos/:id` | ID del curso                     | Datos de un curso           |
| POST        | `/api/cursos`     | Datos del curso                  | Curso creado o error        |
| PUT         | `/api/cursos/:id` | ID y datos actualizados          | Curso actualizado o error   |
| DELETE      | `/api/cursos/:id` | ID del curso                     | Confirmación de eliminación |

## 5. Evaluaciones

| Método HTTP | Endpoint                | ¿Qué recibe?                     | ¿Qué devuelve?                 |
| ----------- | ----------------------- | -------------------------------- | ------------------------------ |
| GET         | `/api/evaluaciones`     | Ninguno o parámetros de consulta | Lista de evaluaciones          |
| GET         | `/api/evaluaciones/:id` | ID de la evaluación              | Datos de una evaluación        |
| POST        | `/api/evaluaciones`     | Datos de la evaluación           | Evaluación creada o error      |
| PUT         | `/api/evaluaciones/:id` | ID y datos actualizados          | Evaluación actualizada o error |
| DELETE      | `/api/evaluaciones/:id` | ID de la evaluación              | Confirmación de eliminación    |

## 6. Progreso

| Método HTTP | Endpoint            | ¿Qué recibe?                     | ¿Qué devuelve?               |
| ----------- | ------------------- | -------------------------------- | ---------------------------- |
| GET         | `/api/progreso`     | Ninguno o parámetros de consulta | Información del progreso     |
| GET         | `/api/progreso/:id` | ID del registro de progreso      | Datos del progreso           |
| POST        | `/api/progreso`     | Datos del progreso               | Registro creado o error      |
| PUT         | `/api/progreso/:id` | ID y datos actualizados          | Registro actualizado o error |
| DELETE      | `/api/progreso/:id` | ID del registro de progreso      | Confirmación de eliminación  |
