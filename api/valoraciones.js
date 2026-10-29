import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { autorizarRoles } from "../src/backend/validators/authMiddleware.js";
import { obtenerIdAlumno } from "../src/backend/validators/alumnoSesionValidator.js";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Vary", "Cookie");
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ success: false, message: "Método no permitido" });
    }

    try {
        const sesion = await autorizarRoles(req, res, ["Alumno"]);
        if (!sesion) return;
        const idUsuario = obtenerIdAlumno(sesion);

        const {
            pacienteNombre,
            tutorNombre,
            tutorParentesco,
            tutorTelefono,
            fechaValoracion,
            fechaNacimiento,
            sexo,
            domicilio,
            respuestasPorSeccion,
            etiquetas = {},
            tiposRespuesta = {}
        } = req.body ?? {};

        const seccionesValidas = respuestasPorSeccion &&
            typeof respuestasPorSeccion === "object" &&
            !Array.isArray(respuestasPorSeccion) &&
            Object.keys(respuestasPorSeccion).length > 0 &&
            Object.values(respuestasPorSeccion).every((respuestas) =>
                respuestas && typeof respuestas === "object" && !Array.isArray(respuestas)
            );

        if (typeof pacienteNombre !== "string" || !pacienteNombre.trim() || pacienteNombre.trim().length > 150 ||
            typeof tutorNombre !== "string" || !tutorNombre.trim() || tutorNombre.trim().length > 150 ||
            typeof tutorParentesco !== "string" || !tutorParentesco.trim() || tutorParentesco.length > 50 ||
            typeof tutorTelefono !== "string" || !tutorTelefono.trim() || tutorTelefono.length > 20 ||
            typeof fechaValoracion !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fechaValoracion) ||
            typeof fechaNacimiento !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento) ||
            typeof sexo !== "string" || !sexo.trim() || sexo.length > 20 ||
            !seccionesValidas || !etiquetas || typeof etiquetas !== "object" || Array.isArray(etiquetas) ||
            !tiposRespuesta || typeof tiposRespuesta !== "object" || Array.isArray(tiposRespuesta)) {
            return res.status(400).json({
                success: false,
                message: "Completa los datos del tutor, nombre del paciente, fecha de nacimiento, sexo y fecha de valoración antes de guardar."
            });
        }

        const folio = `VAL-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
        const datosSecciones = JSON.stringify(respuestasPorSeccion);
        const etiquetasJson = JSON.stringify(etiquetas);
        const tiposJson = JSON.stringify(tiposRespuesta);

        const guardado = await sql`
            WITH paciente_nuevo AS (
                INSERT INTO paciente (folio, nombre, fecha_nacimiento, sexo, domicilio)
                VALUES (
                    ${folio},
                    ${pacienteNombre.trim()},
                    ${fechaNacimiento},
                    ${sexo},
                    ${typeof domicilio === "string" && domicilio.trim() ? domicilio.trim() : null}
                )
                RETURNING id_paciente
            ),
            valoracion_nueva AS (
                INSERT INTO valoracion (id_paciente, id_usuario, fecha_valoracion, estado)
                SELECT id_paciente, ${idUsuario}, ${fechaValoracion}, 'completado'
                FROM paciente_nuevo
                RETURNING id_valoracion
            ),
            tutor_nuevo AS (
                INSERT INTO tutor (nombre, parentesco, telefono)
                VALUES (${tutorNombre.trim()}, ${tutorParentesco.trim()}, ${tutorTelefono.trim()})
                RETURNING id_tutor
            ),
            relacion_tutor AS (
                INSERT INTO paciente_tutor (id_paciente, id_tutor, tutor_principal)
                SELECT paciente_nuevo.id_paciente, tutor_nuevo.id_tutor, TRUE
                FROM paciente_nuevo CROSS JOIN tutor_nuevo
                RETURNING id_paciente
            ),
            catalogo_secciones AS (
                INSERT INTO seccion (nombre, orden)
                SELECT nombre, ROW_NUMBER() OVER (ORDER BY nombre)::INTEGER
                FROM jsonb_object_keys(${datosSecciones}::jsonb) AS s(nombre)
                ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
                RETURNING id_seccion, nombre
            ),
            respuestas AS (
                SELECT
                    seccion.key AS nombre_seccion,
                    respuesta.key AS clave,
                    respuesta.value AS valor,
                    COALESCE(${etiquetasJson}::jsonb ->> respuesta.key, respuesta.key) AS enunciado,
                    COALESCE(${tiposJson}::jsonb ->> respuesta.key, 'text') AS tipo_respuesta,
                    ROW_NUMBER() OVER (PARTITION BY seccion.key ORDER BY respuesta.key)::INTEGER AS orden
                FROM jsonb_each(${datosSecciones}::jsonb) AS seccion
                CROSS JOIN LATERAL jsonb_each(seccion.value) AS respuesta
            ),
            preguntas_guardadas AS (
                INSERT INTO pregunta (id_seccion, enunciado, tipo_respuesta, obligatoria, orden)
                SELECT
                    seccion.id_seccion,
                    respuesta.enunciado,
                    respuesta.tipo_respuesta,
                    FALSE,
                    respuesta.orden
                FROM respuestas AS respuesta
                INNER JOIN catalogo_secciones AS seccion
                    ON seccion.nombre = respuesta.nombre_seccion
                ON CONFLICT (id_seccion, enunciado)
                DO UPDATE SET tipo_respuesta = EXCLUDED.tipo_respuesta
                RETURNING id_pregunta, id_seccion, enunciado
            ),
            opciones_seleccionadas AS (
                SELECT
                    respuesta.nombre_seccion,
                    respuesta.enunciado,
                    opcion.texto,
                    opcion.orden::INTEGER AS orden
                FROM respuestas AS respuesta
                CROSS JOIN LATERAL jsonb_array_elements_text(
                    CASE WHEN jsonb_typeof(respuesta.valor) = 'array'
                        THEN respuesta.valor ELSE '[]'::jsonb END
                ) WITH ORDINALITY AS opcion(texto, orden)
                WHERE respuesta.tipo_respuesta = 'multiple' AND opcion.texto <> ''

                UNION ALL

                SELECT respuesta.nombre_seccion, respuesta.enunciado,
                    respuesta.valor #>> '{}', 1::INTEGER
                FROM respuestas AS respuesta
                WHERE respuesta.tipo_respuesta = 'select'
                    AND jsonb_typeof(respuesta.valor) = 'string'
                    AND respuesta.valor #>> '{}' <> ''
            ),
            opciones_guardadas AS (
                INSERT INTO opcion_respuesta (id_pregunta, texto, orden)
                SELECT pregunta.id_pregunta, opcion.texto, opcion.orden
                FROM opciones_seleccionadas AS opcion
                INNER JOIN catalogo_secciones AS seccion
                    ON seccion.nombre = opcion.nombre_seccion
                INNER JOIN preguntas_guardadas AS pregunta
                    ON pregunta.id_seccion = seccion.id_seccion
                    AND pregunta.enunciado = opcion.enunciado
                ON CONFLICT (id_pregunta, texto)
                DO UPDATE SET orden = EXCLUDED.orden
                RETURNING id_opcion, id_pregunta, texto
            ),
            respuestas_guardadas AS (
                INSERT INTO respuesta (id_valoracion, id_pregunta, id_opcion, respuesta_texto, respuesta_numero)
                SELECT
                    valoracion.id_valoracion,
                    pregunta.id_pregunta,
                    NULL::INTEGER,
                    CASE
                        WHEN jsonb_typeof(respuesta.valor) = 'string' THEN respuesta.valor #>> '{}'
                        ELSE respuesta.valor::TEXT
                    END,
                    CASE
                        WHEN jsonb_typeof(respuesta.valor) = 'number' THEN (respuesta.valor #>> '{}')::NUMERIC
                        ELSE NULL
                    END
                FROM respuestas AS respuesta
                INNER JOIN catalogo_secciones AS seccion
                    ON seccion.nombre = respuesta.nombre_seccion
                INNER JOIN preguntas_guardadas AS pregunta
                    ON pregunta.id_seccion = seccion.id_seccion
                    AND pregunta.enunciado = respuesta.enunciado
                CROSS JOIN valoracion_nueva AS valoracion
                WHERE respuesta.tipo_respuesta NOT IN ('select', 'multiple')

                UNION ALL

                SELECT
                    valoracion.id_valoracion,
                    opcion.id_pregunta,
                    opcion.id_opcion,
                    NULL::TEXT,
                    NULL::NUMERIC
                FROM opciones_guardadas AS opcion
                CROSS JOIN valoracion_nueva AS valoracion
                RETURNING id_respuesta
            )
            SELECT
                paciente_nuevo.id_paciente,
                valoracion_nueva.id_valoracion,
                (SELECT COUNT(*)::INTEGER FROM respuestas_guardadas) AS respuestas_guardadas
            FROM paciente_nuevo
            CROSS JOIN valoracion_nueva
            CROSS JOIN relacion_tutor
        `;

        return res.status(201).json({
            success: true,
            message: "Valoración guardada correctamente.",
            paciente: { id_paciente: guardado[0].id_paciente, folio },
            id_valoracion: guardado[0].id_valoracion,
            respuestas_guardadas: guardado[0].respuestas_guardadas
        });
    } catch (error) {
        if (error.status === 401) {
            return res.status(401).json({ success: false, message: error.message });
        }
        console.error("Error al guardar valoración:", error);
        const codigoError = typeof error?.code === "string" ? error.code : "";
        const detalleError = typeof error?.message === "string" ? error.message : "";
        const migracionPendiente =
            codigoError === "42P10" ||
            codigoError === "42703" ||
            codigoError === "23502" ||
            /no unique or exclusion constraint|does not exist|not-null constraint/i.test(detalleError);

        return res.status(500).json({
            success: false,
            message: migracionPendiente
                ? "La base de datos aún no tiene el esquema requerido para guardar valoraciones. Aplica las migraciones 002 a 005 y vuelve a intentarlo."
                : "No se pudo guardar la valoración. Inténtalo de nuevo y, si persiste, contacta al administrador."
        });
    }
}
