import { autorizarRoles } from "../../src/backend/validators/authMiddleware.js";
import { obtenerActorExpedientes } from "../../src/backend/validators/alumnoSesionValidator.js";
import { validarFiltros } from "../../src/backend/validators/expedienteValidator.js";
import { listarExpedientes } from "../../src/backend/repositories/expedienteRepository.js";
import { generarExcelValoraciones } from "../../src/backend/services/reporteService.js";

const MAXIMO_REGISTROS = 10000;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Vary", "Cookie");

    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");

        return res.status(405).json({
            success: false,
            message: "Método no permitido."
        });
    }

    try {
        const sesion = await autorizarRoles(req, res, [
            "Alumno",
            "Docente"
        ]);

        if (!sesion) return;

        const actor = obtenerActorExpedientes(sesion);

        
        const filtros = validarFiltros(
            {
                ...req.query,
                pagina: "1",
                limite: "100"
            },
            actor.rol
        );

        const datos = await listarExpedientes(
            actor.id,
            {
                ...filtros,
                limite: MAXIMO_REGISTROS,
                offset: 0
            },
            undefined,
            actor.rol
        );

        if (datos.total > MAXIMO_REGISTROS) {
            return res.status(400).json({
                success: false,
                message:
                    "El reporte supera los 10,000 registros. " +
                    "Aplica más filtros o reduce el intervalo de fechas."
            });
        }

        if (datos.registros.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No hay valoraciones que coincidan con los filtros."
            });
        }

        const archivo = await generarExcelValoraciones(
            datos.registros
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="reporte-valoraciones.xlsx"'
        );

        return res.status(200).send(Buffer.from(archivo));
    } catch (error) {
        if ([400, 401, 403].includes(error.status)) {
            return res.status(error.status).json({
                success: false,
                message: error.message
            });
        }

        console.error("Error al generar el reporte:", error);

        return res.status(500).json({
            success: false,
            message: "No se pudo generar el reporte."
        });
    }
}