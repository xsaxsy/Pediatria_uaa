import { verificarSesion } from "../services/sessionService.js";

export async function verificarAutenticacion(req, res) {
    const cookies = req.headers.cookie ?? "";

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
    const sesion = await verificarSesion(token);

    if (!sesion) {
        res.setHeader(
            "Set-Cookie",
            "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
        );

        res.status(401).json({
            success: false,
            message: "Tu sesión no es válida o ha expirado"
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