(() => {
    const form = document.querySelector("#expedientes-filtros");
    if (!form) return;
    const esDocente = form.dataset?.rol === "Docente";
    const consultaHash = esDocente ? "#valoraciones" : "#expedientes";
    const mensaje = document.querySelector("#expedientes-mensaje");
    const cuerpo = document.querySelector("#expedientes-resultados");
    const detalle = document.querySelector("#expediente-detalle");
    const anterior = document.querySelector("#expedientes-anterior");
    const siguiente = document.querySelector("#expedientes-siguiente");
    const paginacion = document.querySelector("#expedientes-paginacion");
    let pagina = 1;
    let filtros = new URLSearchParams();
    let solicitud;
    let consultaDetalle;
    let guardando = false;

    function nodo(tag, contenido) {
        const elemento = document.createElement(tag);
        elemento.textContent = contenido ?? "Sin dato";
        return elemento;
    }

    async function pedir(params, signal, method = "GET", body) {
        const res = await fetch(`/api/expedientes?${params}`, {
            credentials: "same-origin", cache: "no-store", signal, method,
            ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {})
        });
        if (res.status === 401) {
            window.location.replace("/");
            throw new Error("Debes iniciar sesión.");
        }
        const datos = await res.json();
        if (!res.ok || !datos.success) throw new Error(datos.message || "No se pudo realizar la consulta.");
        return datos;
    }

    async function cambiar(exp, metodo, body, estado, boton) {
        if (guardando) return;
        guardando = true;
        boton.disabled = true;
        estado.textContent = metodo === "DELETE" ? "Eliminando…" : "Guardando cambios…";
        try {
            const datos = await pedir(new URLSearchParams({ id: exp.id_valoracion }), undefined, metodo, body);
            if (window.location.hash === consultaHash) {
                pagina = 1;
                await cargar();
                mensaje.textContent = datos.message;
            }
        } catch (error) {
            estado.textContent = error.message;
        } finally {
            guardando = false;
            boton.disabled = false;
        }
    }

    function confirmarEliminacion(exp, boton) {
        if (guardando || !window.confirm(`¿Eliminar la valoración del ${exp.fecha_valoracion} de ${exp.nombre}? Se eliminarán sus respuestas y consentimientos. Esta acción no se puede deshacer. El paciente y las demás valoraciones se conservarán.`)) return;
        const estado = nodo("p", "");
        estado.setAttribute("role", "status");
        detalle.append(estado);
        return cambiar(exp, "DELETE", { version: exp.version }, estado, boton);
    }

    function editar(exp) {
        detalle.replaceChildren(nodo("h3", `Editar valoración · ${exp.nombre}`));
        const editor = document.createElement("form");
        editor.className = "valuation-form";
        const fechaLabel = nodo("label", "Fecha de valoración");
        fechaLabel.className = "valuation-field";
        const fecha = document.createElement("input");
        fecha.type = "date";
        fecha.value = exp.fecha_valoracion;
        fecha.min = exp.fecha_nacimiento;
        fecha.required = true;
        fechaLabel.append(fecha);
        editor.append(fechaLabel);
        const preguntas = new Map();
        for (const respuesta of exp.respuestas) {
            if (!preguntas.has(respuesta.id_pregunta)) preguntas.set(respuesta.id_pregunta, { ...respuesta, valores: [] });
            if (respuesta.valor !== null && respuesta.valor !== "") preguntas.get(respuesta.id_pregunta).valores.push(String(respuesta.valor));
        }
        const campos = [];
        let seccion;
        for (const pregunta of preguntas.values()) {
            if (seccion !== pregunta.seccion) {
                seccion = pregunta.seccion;
                editor.append(nodo("h4", seccion));
            }
            const grupo = document.createElement("fieldset");
            grupo.className = "valuation-field valuation-checks";
            grupo.append(nodo("legend", pregunta.pregunta));
            const controles = [];
            if (pregunta.tipo === "multiple") {
                for (const opcion of pregunta.opciones) {
                    const label = nodo("label", "");
                    label.className = "valuation-boolean";
                    const input = document.createElement("input");
                    input.type = "checkbox";
                    input.value = opcion.texto;
                    input.checked = pregunta.valores.includes(opcion.texto);
                    label.append(input, nodo("span", opcion.texto));
                    controles.push(input);
                    input.addEventListener("change", () => {
                        if (!input.checked) return;
                        const ausencias = ["No hay hallazgos", "No hallazgos", "No hay"];
                        controles.forEach((otro) => {
                            if (otro !== input && (ausencias.includes(input.value) || ausencias.includes(otro.value))) otro.checked = false;
                        });
                    });
                    grupo.append(label);
                }
            } else {
                const control = document.createElement(pregunta.tipo === "select" ? "select" : pregunta.tipo === "number" || pregunta.tipo === "date" ? "input" : "textarea");
                if (pregunta.tipo === "select") {
                    const vacio = nodo("option", "Sin respuesta");
                    vacio.value = "";
                    control.append(vacio);
                    for (const opcion of pregunta.opciones) {
                        const option = nodo("option", opcion.texto);
                        option.value = opcion.texto;
                        control.append(option);
                    }
                } else if (pregunta.tipo === "number" || pregunta.tipo === "date") {
                    control.type = pregunta.tipo === "number" ? "number" : "date";
                    if (pregunta.tipo === "number") { control.min = "0"; control.step = "any"; }
                }
                control.value = pregunta.valores[0] ?? "";
                control.setAttribute("aria-label", pregunta.pregunta);
                controles.push(control);
                grupo.append(control);
            }
            campos.push({ pregunta, controles });
            editor.append(grupo);
        }
        const acciones = document.createElement("div");
        acciones.className = "form-actions";
        const cancelar = nodo("button", "Cancelar");
        cancelar.type = "button";
        cancelar.className = "valuation-back";
        cancelar.addEventListener("click", () => { if (!guardando) abrirDetalle(exp.id_valoracion, cancelar); });
        const guardar = nodo("button", "Guardar cambios");
        guardar.type = "submit";
        guardar.className = "submit-button";
        const estado = nodo("p", "");
        estado.setAttribute("role", "status");
        acciones.append(cancelar, guardar);
        editor.append(estado, acciones);
        editor.addEventListener("submit", (evento) => {
            evento.preventDefault();
            if (!editor.reportValidity()) return;
            const respuestas = campos.map(({ pregunta, controles }) => ({
                id_pregunta: pregunta.id_pregunta,
                valores: pregunta.tipo === "multiple" ? controles.filter((control) => control.checked).map((control) => control.value)
                    : controles[0].value === "" ? [] : [controles[0].value]
            }));
            cambiar(exp, "PUT", { version: exp.version, fecha: fecha.value, respuestas }, estado, guardar);
        });
        detalle.append(editor);
        detalle.focus();
    }

    async function abrirDetalle(id, boton, accion) {
        if (guardando) return;
        consultaDetalle?.abort();
        const actual = new AbortController();
        consultaDetalle = actual;
        boton.disabled = true;
        detalle.hidden = false;
        detalle.replaceChildren(nodo("p", "Cargando valoración…"));
        try {
            const { expediente: exp } = await pedir(new URLSearchParams({ id }), actual.signal);
            if (actual.signal.aborted) return;
            if (accion === "editar") { editar(exp); return; }
            detalle.replaceChildren(nodo("h3", `${exp.nombre} · ${exp.folio}`));
            const cerrar = nodo("button", "Cerrar detalle");
            cerrar.type = "button";
            cerrar.className = "valuation-back";
            cerrar.addEventListener("click", () => { detalle.hidden = true; detalle.replaceChildren(); });
            detalle.append(cerrar, nodo("p", `Valoración: ${exp.fecha_valoracion} · ${exp.estado}`),
                nodo("p", `Nacimiento: ${exp.fecha_nacimiento} · Sexo: ${exp.sexo}`),
                nodo("p", `Domicilio: ${exp.domicilio || "Sin dato"}`), nodo("h4", "Tutores actuales"));
            if (esDocente) detalle.append(nodo("p", `Alumno responsable: ${exp.alumno} · ${exp.correo_alumno}`));
            const tutores = nodo("ul", "");
            for (const tutor of exp.tutores) {
                tutores.append(nodo("li", `${tutor.nombre} · ${tutor.parentesco} · ${tutor.telefono || "Sin teléfono"}`));
            }
            detalle.append(tutores);
            let seccion;
            for (const respuesta of exp.respuestas) {
                if (seccion !== respuesta.seccion) {
                    seccion = respuesta.seccion;
                    detalle.append(nodo("h4", seccion));
                }
                detalle.append(nodo("p", `${respuesta.pregunta}: ${respuesta.valor ?? "Sin respuesta"}`));
            }
            if (!exp.respuestas.length) detalle.append(nodo("p", "Sin respuestas registradas."));
            if (exp.observaciones_supervisor) detalle.append(nodo("p", `Observaciones del supervisor: ${exp.observaciones_supervisor}`));
            const editarBoton = nodo("button", "Editar valoración");
            editarBoton.type = "button";
            editarBoton.className = "valuation-back";
            editarBoton.addEventListener("click", () => { if (!guardando) editar(exp); });
            const eliminarBoton = nodo("button", "Eliminar valoración");
            eliminarBoton.type = "button";
            eliminarBoton.className = "valuation-back";
            eliminarBoton.addEventListener("click", () => confirmarEliminacion(exp, eliminarBoton));
            detalle.append(editarBoton, eliminarBoton);
            detalle.focus();
            if (accion === "eliminar") confirmarEliminacion(exp, eliminarBoton);
        } catch (error) {
            if (error.name !== "AbortError") detalle.replaceChildren(nodo("p", error.message));
        } finally {
            boton.disabled = false;
        }
    }

    async function cargar() {
        solicitud?.abort();
        consultaDetalle?.abort();
        detalle.hidden = true;
        detalle.replaceChildren();
        const actual = new AbortController();
        solicitud = actual;
        mensaje.textContent = "Consultando expedientes…";
        anterior.disabled = siguiente.disabled = true;
        cuerpo.replaceChildren();
        paginacion.textContent = "";
        const params = new URLSearchParams(filtros);
        params.set("pagina", pagina);
        params.set("limite", "20");
        try {
            const datos = await pedir(params, actual.signal);
            if (actual.signal.aborted) return;
            for (const registro of datos.registros) {
                const fila = document.createElement("tr");
                for (const valor of [registro.folio, registro.nombre, registro.sexo,
                    registro.fecha_nacimiento, registro.fecha_valoracion, registro.estado]) {
                    fila.append(nodo("td", valor));
                }
                if (esDocente) fila.append(nodo("td", `${registro.alumno} · ${registro.correo_alumno} · ID ${registro.id_alumno}`));
                const celda = document.createElement("td");
                const boton = nodo("button", "Ver valoración");
                boton.type = "button";
                boton.className = "valuation-back";
                boton.setAttribute("aria-label", `Ver valoración de ${registro.nombre} del ${registro.fecha_valoracion}`);
                boton.addEventListener("click", () => abrirDetalle(registro.id_valoracion, boton));
                celda.append(boton);
                for (const [accion, texto] of [["editar", "Editar"], ["eliminar", "Eliminar"]]) {
                    const accionBoton = nodo("button", texto);
                    accionBoton.type = "button";
                    accionBoton.className = "valuation-back";
                    accionBoton.setAttribute("aria-label", `${texto} valoración de ${registro.nombre} del ${registro.fecha_valoracion}`);
                    accionBoton.addEventListener("click", () => abrirDetalle(registro.id_valoracion, accionBoton, accion));
                    celda.append(accionBoton);
                }
                fila.append(celda);
                cuerpo.append(fila);
            }
            mensaje.textContent = datos.total ? `${datos.total} valoraciones encontradas.` : "No hay valoraciones que coincidan con los filtros.";
            paginacion.textContent = `Página ${pagina} de ${Math.max(1, Math.ceil(datos.total / 20))}`;
            anterior.disabled = pagina <= 1;
            siguiente.disabled = pagina * 20 >= datos.total;
        } catch (error) {
            if (error.name !== "AbortError") mensaje.textContent = error.message;
        }
    }

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const desde = form.elements.desde.value;
        const hasta = form.elements.hasta.value;
        if (desde && hasta && desde > hasta) {
            mensaje.textContent = "La fecha inicial debe ser anterior o igual a la final.";
            return;
        }
        filtros = new URLSearchParams(new FormData(form));
        pagina = 1;
        cargar();
    });
    form.addEventListener("reset", () => {
        filtros = new URLSearchParams();
        pagina = 1;
        cargar();
    });
    anterior.addEventListener("click", () => { pagina--; cargar(); });
    siguiente.addEventListener("click", () => { pagina++; cargar(); });
    function activar() {
        if (window.location.hash === consultaHash) cargar();
        else {
            solicitud?.abort();
            consultaDetalle?.abort();
            cuerpo.replaceChildren();
            detalle.hidden = true;
            detalle.replaceChildren();
        }
    }
    window.addEventListener("hashchange", activar);
    activar();
})();
