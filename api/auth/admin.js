
import { autorizarRoles } from "../../src/backend/validators/authMiddleware.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");

        return res.status(405).json({
            success: false,
            message: "Método no permitido"
        });
    }

    try {
        const sesion = await autorizarRoles(
            req,
            res,
            ["Administrativo"]
        );

        if (!sesion) {
            return;
        }

        return res.status(200).json({
            success: true,
            message: "Acceso administrativo autorizado"
        });
    } catch (error) {
        console.error("Error al verificar permisos:", error);

        return res.status(500).json({
            success: false,
            message: "No se pudieron verificar los permisos"
        });
    }
}
