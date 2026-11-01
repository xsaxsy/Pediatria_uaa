import bcrypt from "bcryptjs";
import { autorizarRoles } from "../validators/authMiddleware.js";
import { validarIdAdmin, validarDatosAdmin, validarEstadoAdmin } from "../validators/adminValidator.js";
import * as repositorio from "../repositories/adminRepository.js";

export function crearAdminHandler(autorizar = autorizarRoles, repo = repositorio) {
    return async function handler(req, res) {
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("Vary", "Cookie");
        if (!["GET", "POST", "PUT", "PATCH"].includes(req.method)) {
            res.setHeader("Allow", "GET, POST, PUT, PATCH");
            return res.status(405).json({ success: false, message: "Método no permitido." });
        }
        try {
            const sesion = await autorizar(req, res, ["Administrativo"]);
            if (!sesion) return;
            if (sesion.rol !== "Administrativo" || !await repo.esAdministradorActivo(validarIdAdmin(sesion.id_usuario))) {
                return res.status(403).json({ success: false, message: "Tu cuenta no tiene permisos administrativos activos." });
            }
            const recurso = req.query?.recurso ?? "alumnos";
            if (!["alumnos", "grupos"].includes(recurso)) throw Object.assign(new Error("Apartado inválido."), { status: 400 });
            if (req.method === "GET") {
                if (recurso === "grupos") return res.status(200).json({ success: true, registros: await repo.listarGruposAdmin() });
                const q = req.query ?? {};
                const buscar = q.buscar ?? "";
                if (typeof buscar !== "string" || buscar.length > 150 || ![undefined, "", "true", "false"].includes(q.activo)) throw Object.assign(new Error("Filtros inválidos."), { status: 400 });
                const pagina = validarIdAdmin(q.pagina ?? 1);
                if (pagina > 100000) throw Object.assign(new Error("Página inválida."), { status: 400 });
                const datos = await repo.listarAlumnosAdmin({ buscar: buscar.trim(), grupo: q.grupo ? validarIdAdmin(q.grupo) : null,
                    estado: q.activo ? q.activo === "true" : null, pagina });
                return res.status(200).json({ success: true, ...datos });
            }
            if (!req.headers?.["content-type"]?.toLowerCase().startsWith("application/json")) return res.status(415).json({ success: false, message: "Envía los datos en formato JSON." });
            // Bloquea formularios cruzados; fetch usa JSON y la cookie existente SameSite.
            if (req.headers["sec-fetch-site"] === "cross-site" || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) return res.status(403).json({ success: false, message: "Solicitud no permitida." });
            if (req.method === "PATCH") {
                const id = validarIdAdmin(req.query?.id);
                const datos = validarEstadoAdmin(req.body);
                const filas = await repo.cambiarEstadoAdmin(sesion.id_usuario, recurso, id, datos);
                if (!filas.length) return res.status(409).json({ success: false, message: "No se cambió el estado. El registro cambió o ya no tienes acceso a él. Actualiza la lista y vuelve a intentarlo." });
                return res.status(200).json({ success: true, message: datos.activo ? "Registro reactivado correctamente." : "Baja realizada correctamente. Se conserva el historial." });
            }
            const editar = req.method === "PUT";
            const id = editar ? validarIdAdmin(req.query?.id) : null;
            const datos = validarDatosAdmin(req.body, recurso, editar);
            const filas = recurso === "grupos" ? await repo.guardarGrupoAdmin(sesion.id_usuario, id, datos)
                : await repo.guardarAlumnoAdmin(sesion.id_usuario, id, datos, editar ? null : await bcrypt.hash(datos.password, 12));
            if (!filas.length) return res.status(409).json({ success: false, message: "No se pudo guardar: el registro cambió, el grupo no está activo o el rol Alumno no está disponible. Recarga la lista y revisa los datos." });
            return res.status(editar ? 200 : 201).json({ success: true, message: "Cambios guardados correctamente." });
        } catch (error) {
            const duplicado = error.code === "23505";
            const status = duplicado ? 409 : error.status ?? (error.code === "DATABASE_NOT_CONFIGURED" ? 503 : 500);
            if (status === 500) console.error("Error en administración:", error.code ?? "Error de servidor");
            return res.status(status).json({ success: false, message: duplicado ? "Ya existe ese correo o ese grupo en el mismo periodo."
                : error.status ? error.message : "No se pudo acceder a la base de datos. Intenta nuevamente." });
        }
    };
}
export default crearAdminHandler();
