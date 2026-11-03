const passwordInput = document.getElementById('password');
const toggleBtn = document.getElementById('btn-toggle-password');

if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
        const currentType = passwordInput.getAttribute('type');
        
        if (currentType === 'password') {
            passwordInput.setAttribute('type', 'text');
            // Cambiar a icono de Ojo oculto / tachado (Hide)
            toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            `;
        } else {
            passwordInput.setAttribute('type', 'password');
            // Regresar a icono de Ojo normal (Eye)
            toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            `;
        }
    });
}
const formulario = document.querySelector("#form-login");
const mensaje = document.querySelector("#mensaje-error");
const boton = document.querySelector("#btn-login");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

   
    mensaje.textContent = "";
    mensaje.style.color = "";

    
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

        const rutasPorRol = {
            Alumno: "/dashboard",
            Docente: "/dashboard-docente",
            Administrativo: "/dashboard-admin"
        }

        const ruta = rutasPorRol[datos.usuario?.rol];

        if(!ruta) {
            mensaje.style.color = "#b42318";
            mensaje.textContent = "Tu cuenta no tiene un rol válido para acceder a la plataforma.";
            return;
        }

        window.location.replace(ruta);

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