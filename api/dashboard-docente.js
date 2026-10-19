import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { autorizarRoles } from "../src/backend/validators/authMiddleware.js";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).send("Método no permitido");
    }

    try {
        // Solo los docentes pueden entrar a este dashboard.
        const sesion = await autorizarRoles(req, res, ["Docente"]);

        if (!sesion) {
            return;
        }

        const rutaHTML = resolve(
            process.cwd(),
            "src/backend/views/dashboard-docente.html"
        );

        const html = await readFile(rutaHTML, "utf8");

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "private, no-store");

        return res.status(200).send(html);
    } catch (error) {
        console.error("Error al cargar el dashboard del docente:", error);

        return res.status(500).send(
            "No se pudo cargar el dashboard del docente."
        );
    }
}
