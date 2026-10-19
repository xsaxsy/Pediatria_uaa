const etiquetaRol = document.querySelector("#rol-usuario");
const botonCerrarSesion = document.querySelector("#btn-cerrar-sesion");

const botonMenu = document.querySelector("#btn-menu");
const botonCerrarMenu = document.querySelector("#btn-cerrar-menu");
const menuLateral = document.querySelector("#menu-lateral");
const overlay = document.querySelector("#sidebar-overlay");

const esMovil = window.matchMedia("(max-width: 768px)");


/* =========================================
   MENÚ LATERAL
   ========================================= */

function abrirMenuMovil() {
    menuLateral.classList.add("sidebar-open");
    overlay.classList.add("overlay-visible");
    document.body.classList.add("menu-abierto");

    botonMenu.setAttribute("aria-expanded", "true");
}

function cerrarMenuMovil() {
    menuLateral.classList.remove("sidebar-open");
    overlay.classList.remove("overlay-visible");
    document.body.classList.remove("menu-abierto");

    botonMenu.setAttribute("aria-expanded", "false");
}

function alternarMenu() {
    if (esMovil.matches) {
        const estaAbierto =
            menuLateral.classList.contains("sidebar-open");

        if (estaAbierto) {
            cerrarMenuMovil();
        } else {
            abrirMenuMovil();
        }

        return;
    }

    const estaOculto =
        document.body.classList.toggle("sidebar-collapsed");

    botonMenu.setAttribute(
        "aria-expanded",
        String(!estaOculto)
    );
}

// Configurar el menú solo si la página tiene sus elementos.
if (botonMenu && botonCerrarMenu && menuLateral && overlay) {
    botonMenu.addEventListener("click", alternarMenu);

    botonCerrarMenu.addEventListener("click", cerrarMenuMovil);
    overlay.addEventListener("click", cerrarMenuMovil);

    menuLateral.querySelectorAll("a").forEach((enlace) => {
        enlace.addEventListener("click", () => {
            if (esMovil.matches) {
                cerrarMenuMovil();
            }
        });
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && esMovil.matches) {
            cerrarMenuMovil();
        }
    });

    esMovil.addEventListener("change", (evento) => {
        cerrarMenuMovil();

        if (!evento.matches) {
            document.body.classList.remove("sidebar-collapsed");
            botonMenu.setAttribute("aria-expanded", "true");
        }
    });
}


/* =========================================
   COMPROBACIÓN DE SESIÓN
   ========================================= */


async function comprobarSesion() {
    try {
        const respuesta = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!respuesta.ok) {
            window.location.replace("/");
            return;
        }

        const datos = await respuesta.json();

        if (!datos.success || !datos.usuario) {
            window.location.replace("/");
            return;
        }

        const rutasPorRol = {
            Alumno: "/dashboard",
            Docente: "/dashboard-docente",
            Administrativo: "/dashboard-admin"
        };

        const rol = datos.usuario.rol;
        const rutaCorrecta = rutasPorRol[rol];

        if (!rutaCorrecta) {
            window.location.replace("/");
            return;
        }

        // Evitar que un usuario permanezca en el dashboard equivocado.
        const rutaActual = window.location.pathname;

        if (rutaActual !== rutaCorrecta) {
            window.location.replace(rutaCorrecta);
            return;
        }

        if (etiquetaRol) {
            etiquetaRol.textContent = `Sesión iniciada · ${rol}`;
        }

        document.documentElement.classList.remove("auth-pending");

    } catch (error) {
        console.error("No se pudo comprobar la sesión:", error);
        window.location.replace("/");
    }
}


/* =========================================
   CIERRE DE SESIÓN
   ========================================= */


/* =========================================
   CIERRE DE SESIÓN
   ========================================= */

if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener("click", async () => {
        botonCerrarSesion.disabled = true;
        botonCerrarSesion.textContent = "Cerrando sesión...";

        try {
            const respuesta = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            if (respuesta.ok) {
                window.location.replace("/");
                return;
            }

            alert("No se pudo cerrar la sesión. Intenta nuevamente.");

        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            alert("No se pudo conectar con el servidor.");
        }

        botonCerrarSesion.disabled = false;
        botonCerrarSesion.textContent = "Cerrar sesión";
    });
}


/* =========================================
   INICIALIZACIÓN
   ========================================= */

comprobarSesion();
