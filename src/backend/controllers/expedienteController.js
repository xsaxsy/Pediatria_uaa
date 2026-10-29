import { autorizarRoles } from "../validators/authMiddleware.js";
import { expedienteService } from "../services/expedienteService.js";
import { obtenerActorExpedientes } from "../validators/alumnoSesionValidator.js";

export function crearConsultaExpedientes(autorizar = autorizarRoles, service = expedienteService) {
    return async function consultarExpedientes(req, res) {
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("Vary", "Cookie");
        if (!["GET", "PUT", "DELETE"].includes(req.method)) {
            res.setHeader("Allow", "GET, PUT, DELETE");
            return res.status(405).json({ success: false, message: "Método no permitido" });
        }
        try {
            if (req.method !== "GET") {
                const headers = req.headers ?? {};
                if (!(headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
                    return res.status(400).json({ success: false, message: "Se requiere contenido JSON." });
                }
                if (headers["sec-fetch-site"] === "cross-site" || (headers.origin && new URL(headers.origin).host !== headers.host)) {
                    return res.status(403).json({ success: false, message: "Origen no permitido." });
                }
            }
            const sesion = await autorizar(req, res, ["Alumno", "Docente"]);
            if (!sesion) return;
            const actor = obtenerActorExpedientes(sesion);
            const datos = req.method === "GET"
                ? await service.consultar(actor.id, req.query ?? {}, actor.rol)
                : await service.cambiar(actor.id, req.query ?? {}, req.body, req.method, actor.rol);
            return res.status(200).json({ success: true, ...datos });
        } catch (error) {
            const status = [400, 401, 403, 404, 409].includes(error.status) ? error.status
                : error.code === "DATABASE_NOT_CONFIGURED" ? 503 : 500;
            const message = [400, 401, 403, 404, 409].includes(status) ? error.message
                : status === 503 ? "La conexión de base de datos aún no está configurada."
                    : "No se pudo completar la operación del expediente. Intenta de nuevo.";
            return res.status(status).json({ success: false, message });
        }
    };
}

export const consultarExpedientes = crearConsultaExpedientes();
