import { neon } from "@neondatabase/serverless";

// Se inicializa al consultar, nunca en el navegador ni al importar el módulo.
export function obtenerSql() {
    if (!process.env.DATABASE_URL) {
        const error = new Error("La conexión de base de datos no está configurada.");
        error.code = "DATABASE_NOT_CONFIGURED";
        throw error;
    }
    return neon(process.env.DATABASE_URL);
}
