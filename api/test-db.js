import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    try {
        const result = await sql`SELECT NOW() AS ahora`;

        res.status(200).json({
            success: true,
            message: "Conexión con Neon exitosa",
            databaseTime: result[0].ahora
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "No se pudo conectar con la base de datos"
        });
    }
}