import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export async function buscarUsuarioPorCorreo(correo) {
    const resultado = await sql`
        SELECT
            u.id_usuario,
            u.nombre,
            u.correo,
            u.password_hash,
            u.activo,
            r.nombre AS rol
        FROM usuario u
        INNER JOIN rol r
            ON r.id_rol = u.id_rol
        WHERE u.correo = ${correo}
        LIMIT 1
    `;

    return resultado[0] ?? null;
}
