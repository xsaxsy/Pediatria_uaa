import { obtenerSql } from "../config/database.js";

// Alumno: solo autoría. Docente: acceso global autorizado por la política actual.
// Los datos vigentes de usuario/rol se verifican también en cada consulta.
export async function listarExpedientes(idUsuario, filtros, sql = obtenerSql(), rol = "Alumno") {
    const { buscar, sexo, estado, desde, hasta, limite, offset, alumno = "", idAlumno = "" } = filtros;
    const patronAlumno = `%${alumno.replace(/[\\%_]/g, "\\$&")}%`;
    const patron = `%${buscar.replace(/[\\%_]/g, "\\$&")}%`;
    const filas = await sql`
        WITH filtradas AS (
            SELECT v.id_valoracion, p.id_paciente, p.folio, p.nombre,
                p.fecha_nacimiento::TEXT, p.sexo,
                v.fecha_valoracion::TEXT, v.estado,
                alumno.id_usuario AS id_alumno, alumno.nombre AS alumno, alumno.correo AS correo_alumno
            FROM valoracion v
            JOIN paciente p ON p.id_paciente = v.id_paciente
            JOIN usuario alumno ON alumno.id_usuario = v.id_usuario
            WHERE (${rol} = 'Docente' OR v.id_usuario = ${idUsuario})
                AND EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
                    WHERE u.id_usuario = ${idUsuario} AND u.activo = TRUE
                        AND r.nombre = ${rol} AND r.nombre IN ('Alumno', 'Docente'))
                AND (${idAlumno} = '' OR v.id_usuario = NULLIF(${idAlumno}, '')::INTEGER)
                AND (${alumno} = '' OR alumno.nombre ILIKE ${patronAlumno} OR alumno.correo ILIKE ${patronAlumno})
                AND (${buscar} = '' OR p.nombre ILIKE ${patron} OR p.folio ILIKE ${patron})
                AND (${sexo} = '' OR p.sexo = ${sexo})
                AND (${estado} = '' OR v.estado = ${estado})
                AND (${desde} = '' OR v.fecha_valoracion >= NULLIF(${desde}, '')::DATE)
                AND (${hasta} = '' OR v.fecha_valoracion <= NULLIF(${hasta}, '')::DATE)
        )
        SELECT (SELECT COUNT(*)::INTEGER FROM filtradas) AS total,
            COALESCE((SELECT jsonb_agg(pagina ORDER BY fecha_valoracion DESC, id_valoracion DESC)
                FROM (SELECT * FROM filtradas ORDER BY fecha_valoracion DESC, id_valoracion DESC
                    LIMIT ${limite} OFFSET ${offset}) pagina), '[]'::jsonb) AS registros
    `;
    return filas[0];
}

export async function consultarValoracion(idUsuario, idValoracion, sql = obtenerSql(), rol = "Alumno") {
    const filas = await sql`
        SELECT v.id_valoracion, v.xmin::TEXT AS version, v.fecha_valoracion::TEXT, v.estado, v.nivel_riesgo,
            v.observaciones_supervisor, alumno.nombre AS alumno, alumno.correo AS correo_alumno,
            p.id_paciente, p.folio, p.nombre,
            p.fecha_nacimiento::TEXT, p.sexo, p.domicilio,
            COALESCE((SELECT jsonb_agg(jsonb_build_object(
                'nombre', t.nombre, 'parentesco', t.parentesco, 'telefono', t.telefono,
                'principal', pt.tutor_principal) ORDER BY pt.tutor_principal DESC, t.id_tutor)
                FROM paciente_tutor pt JOIN tutor t ON t.id_tutor = pt.id_tutor
                WHERE pt.id_paciente = p.id_paciente), '[]'::jsonb) AS tutores,
            COALESCE((SELECT jsonb_agg(jsonb_build_object(
                'seccion', s.nombre, 'pregunta', q.enunciado,
                'id_pregunta', q.id_pregunta, 'tipo', q.tipo_respuesta,
                'opciones', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                    'id_opcion', op.id_opcion, 'texto', op.texto) ORDER BY op.orden, op.id_opcion)
                    FROM opcion_respuesta op WHERE op.id_pregunta = q.id_pregunta), '[]'::jsonb),
                'valor', COALESCE(o.texto, rp.respuesta_numero::TEXT, rp.respuesta_texto))
                ORDER BY s.orden, s.id_seccion, q.orden, q.id_pregunta, rp.id_respuesta)
                FROM respuesta rp JOIN pregunta q ON q.id_pregunta = rp.id_pregunta
                JOIN seccion s ON s.id_seccion = q.id_seccion
                LEFT JOIN opcion_respuesta o ON o.id_opcion = rp.id_opcion
                WHERE rp.id_valoracion = v.id_valoracion), '[]'::jsonb) AS respuestas
        FROM valoracion v JOIN paciente p ON p.id_paciente = v.id_paciente
        JOIN usuario alumno ON alumno.id_usuario = v.id_usuario
        WHERE v.id_valoracion = ${idValoracion} AND (${rol} = 'Docente' OR v.id_usuario = ${idUsuario})
            AND EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
                WHERE u.id_usuario = ${idUsuario} AND u.activo = TRUE
                    AND r.nombre = ${rol} AND r.nombre IN ('Alumno', 'Docente'))
    `;
    return filas[0] ?? null;
}

export async function modificarValoracion(idUsuario, idValoracion, datos, sql = obtenerSql(), rol = "Alumno") {
    const filas = await sql`
        WITH autorizada AS (
            UPDATE valoracion v SET fecha_valoracion = ${datos.fecha}::DATE
            WHERE v.id_valoracion = ${idValoracion} AND (${rol} = 'Docente' OR v.id_usuario = ${idUsuario})
                AND v.xmin::TEXT = ${datos.version}
                AND EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
                    WHERE u.id_usuario = ${idUsuario} AND u.activo = TRUE
                        AND r.nombre = ${rol} AND r.nombre IN ('Alumno', 'Docente'))
            RETURNING v.id_valoracion
        ), borradas AS (
            DELETE FROM respuesta rp USING autorizada a
            WHERE rp.id_valoracion = a.id_valoracion RETURNING rp.id_respuesta
        ), guardadas AS (
            INSERT INTO respuesta (id_valoracion, id_pregunta, id_opcion, respuesta_texto, respuesta_numero)
            SELECT a.id_valoracion, d.id_pregunta, d.id_opcion, d.respuesta_texto, d.respuesta_numero
            FROM autorizada a
            CROSS JOIN jsonb_to_recordset(${JSON.stringify(datos.filas)}::jsonb)
                AS d(id_pregunta INTEGER, id_opcion INTEGER, respuesta_texto TEXT, respuesta_numero NUMERIC)
            CROSS JOIN (SELECT COUNT(*) FROM borradas) eliminadas
            RETURNING id_respuesta
        )
        SELECT id_valoracion, (SELECT COUNT(*)::INTEGER FROM guardadas) AS respuestas_guardadas FROM autorizada
    `;
    return filas[0] ?? null;
}

export async function eliminarValoracion(idUsuario, idValoracion, version, sql = obtenerSql(), rol = "Alumno") {
    // Las FK del esquema eliminan respuestas y consentimientos de esta valoración.
    // No se eliminan pacientes, tutores, relaciones ni catálogos compartidos.
    const filas = await sql`
        DELETE FROM valoracion v
        WHERE v.id_valoracion = ${idValoracion} AND (${rol} = 'Docente' OR v.id_usuario = ${idUsuario})
            AND v.xmin::TEXT = ${version}
            AND EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
                WHERE u.id_usuario = ${idUsuario} AND u.activo = TRUE
                    AND r.nombre = ${rol} AND r.nombre IN ('Alumno', 'Docente'))
        RETURNING v.id_valoracion
    `;
    return filas[0] ?? null;
}
