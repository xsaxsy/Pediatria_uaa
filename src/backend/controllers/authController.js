
import { autenticarUsuario } from "../services/authService.js";
import { crearSesion } from "../services/sessionService.js";

export async function login(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

        return res.status(405).json({
            success: false,
            message: "Método no permitido"
        });
    }

    try {
        const { correo, password } = req.body ?? {};

        if (
            typeof correo !== "string" ||
            typeof password !== "string" ||
            !correo.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Debes proporcionar correo y contraseña"
            });
        }

        const usuario = await autenticarUsuario(correo, password);

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: "Correo o contraseña incorrectos"
            });
        }

        const token = await crearSesion(usuario);

        res.setHeader(
            "Set-Cookie",
            `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=7200`
        );

        return res.status(200).json({
            success: true,
            message: "Inicio de sesión correcto",
            usuario
        });
    } catch (error) {
        console.error("Error durante el inicio de sesión:", error);

        return res.status(500).json({
            success: false,
            message: "Ocurrió un error al iniciar sesión"
        });
    }
}
