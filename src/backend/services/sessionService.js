import { SignJWT, jwtVerify } from "jose";

function obtenerClaveSecreta() {
    const secreto = process.env.SESSION_SECRET;

    if (!secreto) {
        throw new Error("Falta configurar SESSION_SECRET");
    }

    return new TextEncoder().encode(secreto);
}

export async function crearSesion(usuario) {
    return new SignJWT({
        id_usuario: usuario.id_usuario,
        rol: usuario.rol
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(obtenerClaveSecreta());
}

export async function verificarSesion(token) {
    try {
        const { payload } = await jwtVerify(
            token,
            obtenerClaveSecreta()
        );

        return payload;
    } catch {
        return null;
    }
}
