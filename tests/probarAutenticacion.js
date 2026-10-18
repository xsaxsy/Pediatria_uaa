
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { autenticarUsuario } from "../src/backend/services/authService.js";

const terminal = createInterface({ input: stdin, output: stdout });

try {
    const correo = await terminal.question("Correo del usuario: ");
    const password = await terminal.question("Contraseña: ");

    const usuario = await autenticarUsuario(correo, password);

    console.log(
        usuario
            ? `Autenticación correcta. Rol: ${usuario.rol}`
            : "Credenciales incorrectas"
    );
} catch (error) {
    console.error("Error durante la prueba:", error.message);
} finally {
    terminal.close();
}
