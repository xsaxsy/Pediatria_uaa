import { autorizarRoles } from "../src/backend/validators/authMiddleware.js";
import { obtenerActorExpedientes } from "../src/backend/validators/alumnoSesionValidator.js";
import { validarId, validarVersion } from "../src/backend/validators/expedienteValidator.js";
import { obtenerSql } from "../src/backend/config/database.js";

export function evaluacionValida(calificacion, comentario) {
    return typeof calificacion === "number" && Number.isFinite(calificacion) && calificacion >= 0 && calificacion <= 10 &&
        typeof comentario === "string" && comentario.length <= 5000;
}

export function crearHandlerEvaluaciones(autorizar = autorizarRoles, conectar = obtenerSql) {
return async function handler(req, res) {
    res.setHeader("Cache-Control", "private, no-store");
    if (req.method !== "PUT") {
        res.setHeader("Allow", "PUT");
        return res.status(405).json({ success: false, message: "Método no permitido." });
    }
    try {
        const headers = req.headers ?? {};
        if (!(headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) return res.status(400).json({ success: false, message: "Se requiere contenido JSON." });
        if (headers["sec-fetch-site"] === "cross-site" || (headers.origin && new URL(headers.origin).host !== headers.host)) return res.status(403).json({ success: false, message: "Origen no permitido." });
        const sesion = await autorizar(req, res, ["Docente"]);
        if (!sesion) return;
        const actor = obtenerActorExpedientes(sesion);
        if (actor.rol !== "Docente") return res.status(403).json({ success: false, message: "Solo los docentes pueden evaluar." });
        const id = validarId(req.query?.id);
        const version = validarVersion(req.body);
        const { calificacion, comentario } = req.body;
        if (!evaluacionValida(calificacion, comentario)) {
            return res.status(400).json({ success: false, message: "Ingresa una calificación entre 0 y 10 y un comentario de hasta 5000 caracteres." });
        }
        const sql = conectar();
        const filas = await sql`
            UPDATE valoracion v SET calificacion = ${calificacion}, observaciones_supervisor = ${comentario.trim()}, validado_por = ${actor.id}
            WHERE v.id_valoracion = ${id} AND v.xmin::TEXT = ${version}
              AND EXISTS (SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
                  WHERE u.id_usuario = ${actor.id} AND u.activo = TRUE AND r.nombre = 'Docente')
            RETURNING v.id_valoracion`;
        if (!filas.length) return res.status(409).json({ success: false, message: "La valoración cambió o no está disponible. Recarga el detalle." });
        return res.status(200).json({ success: true, message: "Evaluación guardada." });
    } catch (error) {
        if (error.code === "42703") return res.status(503).json({ success: false, message: "Falta aplicar la migración 007 de calificaciones en la base de datos." });
        const status = [400, 401, 403].includes(error.status) ? error.status : 500;
        return res.status(status).json({ success: false, message: status === 500 ? "No se pudo guardar la evaluación." : error.message });
    }
}
}

export default crearHandlerEvaluaciones();
