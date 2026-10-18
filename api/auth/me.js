
import { verificarAutenticacion } from "../../src/backend/validators/authMiddleware.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");

        return res.status(405).json({
            success: false,
            message: "Método no permitido"
        });
    }

    try {
        const sesion = await verificarAutenticacion(req, res);

        if (!sesion) {
            return;
        }

        return res.status(200).json({
            success: true,
            message: "Sesión válida",
            usuario: {
                id_usuario: sesion.id_usuario,
                rol: sesion.rol
            }
        });
    } catch (error) {
        console.error("Error al verificar la sesión:", error);

        return res.status(500).json({
            success: false,
            message: "No se pudo verificar la sesión"
        });
    }
}
