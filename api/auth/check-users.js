
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({
            success: false,
            message: "Método no permitido"
        });
    }

    try {
        const resultado = await sql`
            SELECT
                COUNT(*)::INTEGER AS total
            FROM usuario
        `;

        return res.status(200).json({
            success: true,
            totalUsuarios: resultado[0].total
        });
    } catch (error) {
        console.error("Error al consultar usuarios:", error);

        return res.status(500).json({
            success: false,
            message: "No se pudo consultar el total de usuarios"
        });
    }
}
