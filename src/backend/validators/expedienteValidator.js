function invalido(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
}

function texto(valor, nombre, maximo) {
    if (valor === undefined) return "";
    if (typeof valor !== "string") invalido(`${nombre}: proporciona un solo valor.`);
    const limpio = valor.trim();
    if (limpio.length > maximo) invalido(`${nombre}: máximo ${maximo} caracteres.`);
    return limpio;
}

export function validarId(valor) {
    if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor) ||
        !Number.isSafeInteger(Number(valor)) || Number(valor) > 2147483647) {
        invalido("Identificador inválido.");
    }
    return Number(valor);
}

function fecha(valor, nombre) {
    const limpio = texto(valor, nombre, 10);
    if (!limpio) return "";
    const date = new Date(`${limpio}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(limpio) || limpio < "0001-01-01" ||
        Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== limpio) {
        invalido(`${nombre}: fecha inválida.`);
    }
    return limpio;
}

export function validarFiltros(query = {}, rol = "Alumno") {
    const buscar = texto(query.buscar, "Búsqueda", 150);
    const sexo = texto(query.sexo, "Sexo", 20);
    const estado = texto(query.estado, "Estado", 50);
    const desde = fecha(query.desde, "Desde");
    const hasta = fecha(query.hasta, "Hasta");
    if (sexo && !["Masculino", "Femenino", "Otro"].includes(sexo)) invalido("Sexo inválido.");
    if (estado && !["borrador", "completado", "validado"].includes(estado)) invalido("Estado inválido.");
    if (desde && hasta && desde > hasta) invalido("La fecha inicial debe ser anterior o igual a la final.");
    const pagina = query.pagina === undefined ? 1 : validarId(query.pagina);
    const limite = query.limite === undefined ? 20 : validarId(query.limite);
    if (limite > 100) invalido("El límite máximo es 100.");
    const filtros = { buscar, sexo, estado, desde, hasta, pagina, limite, offset: (pagina - 1) * limite };
    if (rol === "Docente") {
        filtros.alumno = texto(query.alumno, "Alumno", 254);
        filtros.idAlumno = query.id_alumno === undefined || query.id_alumno === "" ? "" : String(validarId(query.id_alumno));
    }
    return filtros;
}

export function validarVersion(body) {
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        typeof body.version !== "string" || !/^\d{1,10}$/.test(body.version)) {
        invalido("Recarga la valoración antes de realizar cambios.");
    }
    return body.version;
}

export function validarEdicion(body, actual) {
    const version = validarVersion(body);
    const fechaValoracion = fecha(body.fecha, "Fecha de valoración");
    if (!fechaValoracion || fechaValoracion < actual.fecha_nacimiento) {
        invalido("La fecha de valoración no puede ser anterior al nacimiento.");
    }
    if (!Array.isArray(body.respuestas) || body.respuestas.length > 2000) invalido("Respuestas inválidas.");
    const preguntas = new Map(actual.respuestas.map((respuesta) => [respuesta.id_pregunta, respuesta]));
    if (body.respuestas.length !== preguntas.size) invalido("Envía todas las preguntas de esta valoración.");
    const vistas = new Set();
    const filas = [];
    for (const respuesta of body.respuestas) {
        if (!respuesta || !Number.isInteger(respuesta.id_pregunta)) invalido("Pregunta inválida.");
        const pregunta = preguntas.get(respuesta.id_pregunta);
        if (!pregunta || vistas.has(respuesta.id_pregunta)) invalido("Pregunta ajena o repetida.");
        vistas.add(respuesta.id_pregunta);
        if (!Array.isArray(respuesta.valores) || respuesta.valores.length > 200 ||
            respuesta.valores.some((valor) => typeof valor !== "string" || valor.length > 10000)) {
            invalido("Valor de respuesta inválido.");
        }
        if (pregunta.tipo !== "multiple" && respuesta.valores.length > 1) invalido("Esta pregunta admite una sola respuesta.");
        const valores = [...new Set(respuesta.valores)];
        if (valores.length > 1 && valores.some((valor) => ["No hay hallazgos", "No hallazgos", "No hay"].includes(valor))) {
            invalido("La opción de ausencia no puede combinarse con otros hallazgos.");
        }
        if (!valores.length) valores.push("");
        for (const valor of valores) {
            const fila = { id_pregunta: pregunta.id_pregunta, id_opcion: null, respuesta_texto: null, respuesta_numero: null };
            if (["select", "multiple"].includes(pregunta.tipo) && valor !== "") {
                const opcion = pregunta.opciones.find((item) => item.texto === valor);
                if (!opcion) invalido("La opción no corresponde a esta pregunta.");
                fila.id_opcion = opcion.id_opcion;
            } else if (pregunta.tipo === "number" && valor !== "") {
                if (!/^\d+(\.\d+)?$/.test(valor) || !Number.isFinite(Number(valor))) invalido("Número inválido.");
                fila.respuesta_numero = valor;
                fila.respuesta_texto = valor;
            } else {
                if (pregunta.tipo === "date" && valor !== "") fecha(valor, "Respuesta");
                fila.respuesta_texto = valor;
            }
            filas.push(fila);
        }
    }
    return { version, fecha: fechaValoracion, filas };
}
