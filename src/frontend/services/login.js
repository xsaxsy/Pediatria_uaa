const formulario = document.querySelector("#form-login");
const mensaje = document.querySelector("#mensaje-error");
const boton = document.querySelector("#btn-login");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // Limpiar mensajes anteriores
    mensaje.textContent = "";
    mensaje.style.color = "";

    // Evitar envíos repetidos
    boton.disabled = true;
    boton.textContent = "Iniciando sesión...";

    const correo = document.querySelector("#correo").value.trim();
    const password = document.querySelector("#password").value;

    try {
        const respuesta = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
                correo: correo,
                password: password
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.success) {
            mensaje.style.color = "#b42318";
            mensaje.textContent =
                datos.message || "No se pudo iniciar sesión.";
            return;
        }

        mensaje.style.color = "#15803d";
        mensaje.textContent =
            "¡Inicio de sesión correcto! Tu sesión está activa.";

        formulario.reset();

    } catch (error) {
        console.error("Error al iniciar sesión:", error);

        mensaje.style.color = "#b42318";
        mensaje.textContent =
            "No se pudo conectar con el servidor. Intenta nuevamente.";

    } finally {
        boton.disabled = false;
        boton.textContent = "Iniciar sesión";
    }
});
