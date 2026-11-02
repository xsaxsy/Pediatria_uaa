import { verificarSesion } from "../services/sessionService.js";
import { obtenerSql } from "../config/database.js";

async function consultarCuentaActiva(id) {
    const sql = obtenerSql();
    const [cuenta] = await sql`SELECT u.id_usuario, r.nombre AS rol
        FROM usuario u JOIN rol r USING (id_rol)
        WHERE u.id_usuario = ${id} AND u.activo = TRUE`;
    return cuenta ?? null;
}

export async function verificarAutenticacion(req, res, { verificarToken = verificarSesion, consultarCuenta = consultarCuentaActiva } = {}) {
    const cookies = req.headers?.cookie ?? "";

    const cookieSesion = cookies
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("session="));

    if (!cookieSesion) {
        res.status(401).json({
            success: false,
            message: "Debes iniciar sesión"
        });

        return null;
    }

    const token = cookieSesion.slice("session=".length);
    const sesion = await verificarToken(token);
    const idValido = sesion && /^[1-9]\d*$/.test(String(sesion.id_usuario)) && Number(sesion.id_usuario) <= 2147483647;
    // El token puede seguir vigente después de una baja: comprobar la cuenta en cada solicitud.
    const cuenta = idValido ? await consultarCuenta(Number(sesion.id_usuario)) : null;

    if (!sesion || !cuenta || cuenta.rol !== sesion.rol) {
        res.setHeader(
            "Set-Cookie",
            "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
        );

        res.status(401).json({
            success: false,
            message: "Tu sesión expiró o tu cuenta ya no tiene acceso. Inicia sesión nuevamente o consulta al administrador."
        });

        return null;
    }

    return sesion;
}


export async function autorizarRoles(req, res, rolesPermitidos) {
    const sesion = await verificarAutenticacion(req, res);

    // Si no hay sesión válida, ya se respondió con HTTP 401.
    if (!sesion) {
        return null;
    }

    // Comprobar si el rol tiene permiso para acceder.
    if (!rolesPermitidos.includes(sesion.rol)) {
        res.status(403).json({
            success: false,
            message: "No tienes permisos para realizar esta acción"
        });

        return null;
    }

    // La sesión es válida y el rol está autorizado.
    return sesion;
}
