export default async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

        return res.status(405).json({
            success: false,
            message: "Método no permitido"
        });
    }

    res.setHeader(
        "Set-Cookie",
        "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
    );

    return res.status(200).json({
        success: true,
        message: "Sesión cerrada correctamente"
    });
}