import bcrypt from "bcryptjs";
import { buscarUsuarioPorCorreo } from "../repositories/usuarioRepository.js";

export async function autenticarUsuario(correo, password) {
    const usuario = await buscarUsuarioPorCorreo(
        correo.trim().toLowerCase()
    );

    if (!usuario || !usuario.activo) {
        return null;
    }

    const passwordValida = await bcrypt.compare(
        password,
        usuario.password_hash
    );

    if (!passwordValida) {
        return null;
    }

    // No exponer el hash de la contraseña.
    const { password_hash, ...usuarioSeguro } = usuario;

    return usuarioSeguro;
}
