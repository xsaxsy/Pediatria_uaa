# Consulta de expedientes

El esquema actual no tiene una tabla expediente. La pantalla presenta una fila
por valoración y su paciente, con detalle de respuestas y tutores actuales.
No se modifica el guardado ni se deduplican pacientes anteriores.

## Endpoints

- `GET /api/expedientes`: filtros opcionales `buscar` (nombre o folio parcial),
  `sexo`, `estado`, `desde`, `hasta` (fecha de valoración, inclusive), `pagina`
  y `limite` (20 por defecto, máximo 100).
- `GET /api/expedientes?id=123`: detalle de una valoración accesible.

Se requiere sesión de Alumno o Docente y se verifica usuario activo y rol vigente
en SQL para cada consulta, modificación y eliminación.

- Alumno: solo sus registros, según `valoracion.id_usuario`; no puede promoverse
  a Docente enviando parámetros, ni consultar registros de otro alumno.
- Docente: acceso global a las valoraciones de cualquier alumno, por decisión
  explícita del equipo. No depende de grupos ni de una asignación de supervisión.
- Administrativo: sin acceso clínico a esta API.

En `/dashboard-docente#valoraciones` se reutiliza la consulta con los filtros
anteriores y dos filtros adicionales: `alumno` (nombre o correo parcial) e
`id_alumno` (identificador exacto). Si se proporcionan ambos, se combinan con AND.
Los filtros docentes no se utilizan para ampliar el alcance de un alumno.
Los resultados y el detalle muestran el alumno autor. El docente puede editar
y eliminar, pero estas acciones no cambian el autor original de la valoración.
El apartado Mis grupos se retiró del panel docente.

El botón Exportar reportes está deshabilitado; no existe aún endpoint de exportación.

## Editar y eliminar desde la consulta

- `PUT /api/expedientes?id=123`: JSON con `version`, `fecha` y `respuestas`.
  Cada respuesta contiene `id_pregunta` y un arreglo `valores` de cadenas.
  El editor permite cambiar la fecha y las respuestas guardadas; no cambia
  los datos maestros del paciente/tutor, el estado ni la validación docente.
  Solo se ofrecen opciones existentes en el catálogo de esa pregunta. La API
  anterior registra las opciones seleccionadas, no necesariamente el catálogo
  completo del formulario: alternativas nunca guardadas aún no estarán disponibles.
- `DELETE /api/expedientes?id=123`: JSON con `version`. La interfaz solicita
  confirmación antes de enviar. Elimina permanentemente la valoración y, por las
  FK de las migraciones, sus respuestas y consentimientos. Conserva el paciente,
  los tutores, las asociaciones, los catálogos y las demás valoraciones.

Ambas operaciones exigen Alumno activo con autoría o Docente activo con acceso
global en SQL. Los administrativos quedan excluidos. La `version`
proviene de `valoracion.xmin` al consultar y detecta cambios concurrentes. La
actualización de fecha y sustitución de respuestas se realiza en una sentencia
atómica; todos los escritores futuros deberán actualizar también la fila de
valoración para conservar esta garantía. Un conflicto responde 409 y pide recargar.
No se requiere una migración nueva para estas acciones.

## Conexión Neon / Vercel

La dependencia `@neondatabase/serverless` ya está instalada. El código utiliza
`DATABASE_URL` exclusivamente en el servidor, mediante
`src/backend/config/database.js`. No necesita un servidor Express adicional.

1. La responsable debe verificar que la base de pruebas tenga las migraciones
   001 a 006 revisadas y aplicadas en orden. La consulta usa las tablas de 001–005;
   006 solo alinea defaults del guardado. No se ejecutan migraciones desde la app.
2. Configurar `DATABASE_URL` con la cadena de conexión proporcionada por Neon,
   conservando sus parámetros TLS, en las variables del proyecto Vercel para el
   entorno correspondiente. No copiar la cadena al código ni al navegador.
3. Conservar `SESSION_SECRET` en el servidor para la autenticación existente.
4. En desarrollo, proporcionar estas variables mediante el mecanismo local
   existente y ejecutar el proyecto con funciones Vercel (por ejemplo `vercel dev`
   si la CLI ya está disponible). Reiniciar tras cambiar variables. Una página
   servida únicamente como HTML estático no ejecuta las funciones de `/api`.
5. Tras configurar variables en Vercel, generar un nuevo despliegue y comprobar
   con usuarios y datos de prueba: filtros, fechas, detalle y aislamiento entre
   dos alumnos. Sin configuración, la consulta responde 503 con mensaje genérico.

No se ha verificado conectividad real ni ejecutado SQL. No hacen falta nuevas
columnas para estas consultas. El detalle usa el catálogo guardado, por lo que
tolera las opciones históricas y los campos nuevos del formulario.

## Verificación local sin conexión

`node --test tests/expedientes.test.js`

Las pruebas usan repositorios y transporte simulados. La ejecución real en
PostgreSQL/Neon y la revisión visual completa del navegador son verificaciones
pendientes para el entorno configurado.
