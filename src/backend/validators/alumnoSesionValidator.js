// La identidad del autor solo proviene de la sesión verificada por el middleware.
// Nunca aceptar id_usuario/id_alumno de filtros, formularios o parámetros de ruta.
export function obtenerIdAlumno(sesion) {
    const valor = sesion?.id_usuario;
    const id = typeof valor === "number" || (typeof valor === "string" && /^[1-9]\d*$/.test(valor))
        ? Number(valor) : NaN;
    if (sesion?.rol !== "Alumno" || !Number.isInteger(id) || id <= 0 || id > 2147483647) {
        throw Object.assign(new Error("Sesión de alumno inválida. Inicia sesión nuevamente."), { status: 401 });
    }
    return id;
}

export function obtenerActorExpedientes(sesion) {
    if (!["Alumno", "Docente"].includes(sesion?.rol)) {
        throw Object.assign(new Error("No tienes acceso a los expedientes."), { status: 403 });
    }
    return { id: obtenerIdAlumno({ ...sesion, rol: "Alumno" }), rol: sesion.rol };
}
