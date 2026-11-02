function fallo(message, status = 400) {
    throw Object.assign(new Error(message), { status });
}
export function validarIdAdmin(valor) {
    if (!/^[1-9]\d*$/.test(String(valor)) || Number(valor) > 2147483647) fallo("Identificador inválido.");
    return Number(valor);
}
function texto(valor, nombre, maximo) {
    if (typeof valor !== "string" || !valor.trim() || valor.trim().length > maximo) fallo(`${nombre}: completa un valor de hasta ${maximo} caracteres.`);
    return valor.trim();
}
export function validarEstadoAdmin(body) {
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.activo !== "boolean") fallo("Indica un estado válido para la cuenta o el grupo.");
    if (typeof body.version !== "string" || !/^\d+$/.test(body.version)) fallo("Recarga el registro antes de cambiar su estado.");
    return { activo: body.activo, version: body.version };
}
export function validarDatosAdmin(body, recurso, editar) {
    if (!body || typeof body !== "object" || Array.isArray(body)) fallo("Datos inválidos.");
    const datos = { nombre: texto(body.nombre, "Nombre", recurso === "alumnos" ? 150 : 100) };
    if (typeof body.activo !== "boolean") fallo("Indica si el registro está activo.");
    datos.activo = body.activo;
    if (editar) {
        if (typeof body.version !== "string" || !/^\d+$/.test(body.version)) fallo("Recarga el registro antes de editarlo.");
        datos.version = body.version;
    }
    if (recurso === "grupos") {
        datos.periodo = texto(body.periodo, "Periodo", 30);
        if (!/^[1-9]\d{3}-[12]$/.test(datos.periodo)) fallo("Selecciona un semestre y un año válidos.");
    }
    else {
        datos.correo = texto(body.correo, "Correo", 254).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) fallo("Escribe un correo válido.");
        datos.id_grupo = body.id_grupo === null ? null : validarIdAdmin(body.id_grupo);
        if (!editar) {
            if (typeof body.password !== "string" || body.password.length < 10 || new TextEncoder().encode(body.password).length > 72) fallo("La contraseña debe tener al menos 10 caracteres y no superar 72 bytes.");
            datos.password = body.password;
        }
    }
    return datos;
}
