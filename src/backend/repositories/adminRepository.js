import { obtenerSql } from "../config/database.js";

export async function esAdministradorActivo(id) {
    const sql = obtenerSql();
    const filas = await sql`SELECT u.id_usuario FROM usuario u JOIN rol r USING (id_rol)
        WHERE u.id_usuario = ${id} AND u.activo AND r.nombre = 'Administrativo'`;
    return filas.length === 1;
}

// Una baja conserva identificadores, relaciones e historial; solo cambia activo.
export async function cambiarEstadoAdmin(actor, recurso, id, datos, sql = obtenerSql()) {
    if (recurso === "grupos") return sql`UPDATE grupo SET activo = ${datos.activo}
        WHERE id_grupo = ${id} AND xmin::text = ${datos.version}
        AND EXISTS (SELECT 1 FROM usuario a JOIN rol ar USING (id_rol)
            WHERE a.id_usuario = ${actor} AND a.activo AND ar.nombre = 'Administrativo')
        RETURNING id_grupo, activo`;
    if (recurso !== "alumnos") throw Object.assign(new Error("Apartado inválido."), { status: 400 });
    return sql`UPDATE usuario u SET activo = ${datos.activo}
        WHERE u.id_usuario = ${id} AND u.xmin::text = ${datos.version}
        AND EXISTS (SELECT 1 FROM rol r WHERE r.id_rol = u.id_rol AND r.nombre = 'Alumno')
        AND EXISTS (SELECT 1 FROM usuario a JOIN rol ar USING (id_rol)
            WHERE a.id_usuario = ${actor} AND a.activo AND ar.nombre = 'Administrativo')
        RETURNING u.id_usuario, u.activo`;
}

export async function listarGruposAdmin() {
    const sql = obtenerSql();
    return sql`SELECT g.id_grupo, g.nombre, g.periodo, g.activo, g.xmin::text AS version,
        (SELECT count(*)::int FROM usuario u JOIN rol r USING (id_rol)
         WHERE u.id_grupo = g.id_grupo AND r.nombre = 'Alumno') AS alumnos
        FROM grupo g ORDER BY g.periodo DESC, g.nombre, g.id_grupo`;
}

export async function listarAlumnosAdmin({ buscar, grupo, estado, pagina }) {
    const sql = obtenerSql();
    const patron = `%${buscar.replace(/[\\%_]/g, "\\$&")}%`;
    const registros = await sql`SELECT u.id_usuario, u.nombre, u.correo, u.activo, u.id_grupo,
        u.xmin::text AS version, g.nombre AS grupo, g.periodo
        FROM usuario u JOIN rol r USING (id_rol) LEFT JOIN grupo g USING (id_grupo)
        WHERE r.nombre = 'Alumno' AND (${buscar} = '' OR u.nombre ILIKE ${patron} OR u.correo ILIKE ${patron})
        AND (${grupo}::int IS NULL OR u.id_grupo = ${grupo})
        AND (${estado}::boolean IS NULL OR u.activo = ${estado})
        ORDER BY u.nombre, u.id_usuario LIMIT 20 OFFSET ${(pagina - 1) * 20}`;
    const [conteo] = await sql`SELECT count(*)::int AS total FROM usuario u JOIN rol r USING (id_rol)
        WHERE r.nombre = 'Alumno' AND (${buscar} = '' OR u.nombre ILIKE ${patron} OR u.correo ILIKE ${patron})
        AND (${grupo}::int IS NULL OR u.id_grupo = ${grupo})
        AND (${estado}::boolean IS NULL OR u.activo = ${estado})`;
    return { registros, total: conteo.total, pagina };
}

export async function guardarGrupoAdmin(actor, id, datos) {
    const sql = obtenerSql();
    if (id === null) return sql`INSERT INTO grupo (nombre, periodo, activo)
        SELECT ${datos.nombre}, ${datos.periodo}, ${datos.activo}
        WHERE EXISTS (SELECT 1 FROM usuario u JOIN rol r USING (id_rol)
            WHERE u.id_usuario = ${actor} AND u.activo AND r.nombre = 'Administrativo')
        RETURNING id_grupo`;
    return sql`UPDATE grupo SET nombre = ${datos.nombre}, periodo = ${datos.periodo}, activo = ${datos.activo}
        WHERE id_grupo = ${id} AND xmin::text = ${datos.version}
        AND EXISTS (SELECT 1 FROM usuario u JOIN rol r USING (id_rol)
            WHERE u.id_usuario = ${actor} AND u.activo AND r.nombre = 'Administrativo') RETURNING id_grupo`;
}

export async function guardarAlumnoAdmin(actor, id, datos, hash = null) {
    const sql = obtenerSql();
    // Bloquear el grupo durante la escritura para coordinar asignaciones y desactivaciones.
    if (id === null) return sql`WITH grupo_valido AS (
        SELECT id_grupo FROM grupo WHERE id_grupo = ${datos.id_grupo} AND activo FOR UPDATE
    ) INSERT INTO usuario (id_rol, id_grupo, nombre, correo, password_hash, activo)
        SELECT r.id_rol, ${datos.id_grupo}, ${datos.nombre}, ${datos.correo}, ${hash}, ${datos.activo}
        FROM rol r WHERE r.nombre = 'Alumno'
        AND (${datos.id_grupo}::int IS NULL OR EXISTS (SELECT 1 FROM grupo_valido))
        AND EXISTS (SELECT 1 FROM usuario a JOIN rol ar USING (id_rol)
            WHERE a.id_usuario = ${actor} AND a.activo AND ar.nombre = 'Administrativo') RETURNING id_usuario`;
    return sql`WITH grupo_valido AS (
        SELECT id_grupo FROM grupo WHERE id_grupo = ${datos.id_grupo} AND activo FOR UPDATE
    ) UPDATE usuario u SET nombre = ${datos.nombre}, correo = ${datos.correo},
        id_grupo = ${datos.id_grupo}, activo = ${datos.activo}
        WHERE u.id_usuario = ${id} AND u.xmin::text = ${datos.version}
        AND EXISTS (SELECT 1 FROM rol r WHERE r.id_rol = u.id_rol AND r.nombre = 'Alumno')
        AND (${datos.id_grupo}::int IS NULL OR u.id_grupo = ${datos.id_grupo} OR EXISTS (SELECT 1 FROM grupo_valido))
        AND EXISTS (SELECT 1 FROM usuario a JOIN rol ar USING (id_rol)
            WHERE a.id_usuario = ${actor} AND a.activo AND ar.nombre = 'Administrativo') RETURNING id_usuario`;
}
