import test from "node:test";
import assert from "node:assert/strict";
import { validarFiltros, validarId, validarEdicion } from "../src/backend/validators/expedienteValidator.js";
import { crearExpedienteService } from "../src/backend/services/expedienteService.js";
import { crearConsultaExpedientes } from "../src/backend/controllers/expedienteController.js";
import { listarExpedientes, consultarValoracion, modificarValoracion, eliminarValoracion } from "../src/backend/repositories/expedienteRepository.js";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { obtenerIdAlumno, obtenerActorExpedientes } from "../src/backend/validators/alumnoSesionValidator.js";

test("identidad de alumno exige sesión válida, rol correcto e identificador entero", () => {
    assert.equal(obtenerIdAlumno({ id_usuario: 7, rol: "Alumno" }), 7);
    assert.equal(obtenerIdAlumno({ id_usuario: "8", rol: "Alumno" }), 8);
    for (const sesion of [null, {}, { id_usuario: true, rol: "Alumno" },
        { id_usuario: 7, rol: "Administrativo" }, { id_usuario: 7, rol: "Docente" },
        { id_usuario: "7.0", rol: "Alumno" }, { id_usuario: 0, rol: "Alumno" }]) {
        assert.throws(() => obtenerIdAlumno(sesion), { status: 401 });
    }
});

test("dos alumnos quedan aislados en listado, detalle, edición y eliminación", async () => {
    const registros = [
        { id_valoracion: 12, id_usuario: 7, version: "123" },
        { id_valoracion: 13, id_usuario: 8, version: "124" }
    ];
    const escrituras = [];
    const service = crearExpedienteService({
        async listarExpedientes(usuario) {
            const propios = registros.filter((item) => item.id_usuario === usuario);
            return { total: propios.length, registros: propios };
        },
        async consultarValoracion(usuario, id) {
            return registros.find((item) => item.id_usuario === usuario && item.id_valoracion === id) ?? null;
        },
        async modificarValoracion(...args) { escrituras.push(args); },
        async eliminarValoracion(...args) { escrituras.push(args); }
    });
    const handler = crearConsultaExpedientes(async (req) => req.sesionVerificada, service);
    for (const [alumno, propio, ajeno, versionAjena] of [[7, 12, 13, "124"], [8, 13, 12, "123"]]) {
        const sesionVerificada = { id_usuario: alumno, rol: "Alumno" };
        const listado = respuesta();
        await handler({ method: "GET", sesionVerificada, query: { id_usuario: String(alumno === 7 ? 8 : 7) } }, listado);
        assert.equal(listado.code, 200);
        assert.equal(listado.body.total, 1);
        assert.equal(listado.body.registros[0].id_valoracion, propio);
        assert.equal(listado.headers.Vary, "Cookie");
        for (const method of ["GET", "PUT", "DELETE"]) {
            const res = respuesta();
            await handler({ method, sesionVerificada, headers: { "content-type": "application/json" },
                query: { id: String(ajeno), id_usuario: String(alumno === 7 ? 8 : 7) },
                body: { version: versionAjena, id_usuario: alumno === 7 ? 8 : 7 } }, res);
            assert.equal(res.code, 404);
            assert.equal(res.body.message, "Valoración no encontrada.");
        }
    }
    assert.equal(escrituras.length, 0);
});

test("docente consulta y modifica registros de diferentes alumnos sin transferir autoría", async () => {
    assert.deepEqual(obtenerActorExpedientes({ id_usuario: 9, rol: "Docente" }), { id: 9, rol: "Docente" });
    assert.throws(() => obtenerActorExpedientes({ id_usuario: 9, rol: "Administrativo" }), { status: 403 });
    const registros = [7, 8].map((id_usuario, i) => ({ ...actualEditable, id_valoracion: 12 + i, id_usuario }));
    const cambios = [];
    const service = crearExpedienteService({
        async listarExpedientes(usuario, filtros, _sql, rol) {
            let resultado = registros.filter((v) => rol === "Docente" || v.id_usuario === usuario);
            if (filtros.idAlumno) resultado = resultado.filter((v) => v.id_usuario === Number(filtros.idAlumno));
            return { registros: resultado, total: resultado.length };
        },
        async consultarValoracion(usuario, id, _sql, rol) {
            return registros.find((v) => v.id_valoracion === id && (rol === "Docente" || v.id_usuario === usuario)) ?? null;
        },
        async modificarValoracion(usuario, id, datos, _sql, rol) {
            cambios.push({ usuario, id, datos, rol }); return { id_valoracion: id };
        },
        async eliminarValoracion(usuario, id, version, _sql, rol) {
            cambios.push({ usuario, id, version, rol }); return { id_valoracion: id };
        }
    });
    const handler = crearConsultaExpedientes(async (req) => req.sesionVerificada, service);
    const sesionVerificada = { id_usuario: 9, rol: "Docente" };
    const listado = respuesta();
    await handler({ method: "GET", sesionVerificada, query: {} }, listado);
    assert.equal(listado.body.total, 2);
    const filtrado = respuesta();
    await handler({ method: "GET", sesionVerificada, query: { id_alumno: "8" } }, filtrado);
    assert.equal(filtrado.body.total, 1);
    assert.equal(filtrado.body.registros[0].id_usuario, 8);
    for (const [method, id] of [["PUT", "12"], ["DELETE", "13"]]) {
        const res = respuesta();
        await handler({ method, sesionVerificada, query: { id }, body: edicionValida(),
            headers: { "content-type": "application/json" } }, res);
        assert.equal(res.code, 200);
    }
    assert.deepEqual(cambios.map((cambio) => [cambio.usuario, cambio.rol]), [[9, "Docente"], [9, "Docente"]]);
    assert.deepEqual(registros.map((registro) => registro.id_usuario), [7, 8]);
    const intento = respuesta();
    await handler({ method: "GET", sesionVerificada: { id_usuario: 7, rol: "Alumno" },
        query: { id: "13", rol: "Docente", id_alumno: "8" } }, intento);
    assert.equal(intento.code, 404);
});

test("filtros docentes validan identificador y búsqueda sin ampliar permisos del alumno", () => {
    const filtros = validarFiltros({ alumno: "  Alumno prueba  ", id_alumno: "8" }, "Docente");
    assert.equal(filtros.alumno, "Alumno prueba");
    assert.equal(filtros.idAlumno, "8");
    assert.throws(() => validarFiltros({ id_alumno: "8 OR TRUE" }, "Docente"), { status: 400 });
    assert.throws(() => validarFiltros({ alumno: ["uno", "dos"] }, "Docente"), { status: 400 });
    assert.equal(validarFiltros({ id_alumno: "8", alumno: "otro" }).idAlumno, undefined);
});

test("SQL docente verifica el rol vigente del actor también en edición y eliminación", async () => {
    const consultas = [];
    const sql = async (strings, ...values) => { consultas.push({ texto: strings.join("?"), values }); return [{}]; };
    await listarExpedientes(9, validarFiltros({ alumno: "prueba%", id_alumno: "8" }, "Docente"), sql, "Docente");
    await consultarValoracion(9, 12, sql, "Docente");
    await modificarValoracion(9, 12, validarEdicion(edicionValida(), actualEditable), sql, "Docente");
    await eliminarValoracion(9, 13, "123", sql, "Docente");
    for (const consulta of consultas) {
        assert.match(consulta.texto, /u\.id_usuario = \?/);
        assert.match(consulta.texto, /r\.nombre = \? AND r\.nombre IN \('Alumno', 'Docente'\)/);
        assert.match(consulta.texto, /u\.activo = TRUE/);
        assert.match(consulta.texto, /\? = 'Docente' OR v\.id_usuario = \?/);
        assert.ok(consulta.values.includes(9));
        assert.ok(consulta.values.includes("Docente"));
    }
    assert.ok(consultas[0].values.includes("8"));
    assert.ok(consultas[0].values.includes("%prueba\\%%"));
});

test("valida fechas reales, intervalos y paginación sin consultar la base", () => {
    assert.equal(validarFiltros({ desde: "2024-02-29" }).desde, "2024-02-29");
    for (const query of [
        { desde: "2025-02-29" }, { desde: "2026-13-01" },
        { desde: "2026-10-02", hasta: "2026-10-01" },
        { sexo: "desconocido" }, { estado: "otro" }, { limite: "101" },
        { pagina: "0" }, { buscar: ["uno", "dos"] }, { hasta: ["2026-10-01"] }
    ]) assert.throws(() => validarFiltros(query), { status: 400 });
    assert.equal(validarFiltros({ pagina: "3", limite: "10" }).offset, 20);
    assert.equal(validarFiltros({}).limite, 20);
    for (const id of ["-1", "1.5", "1 OR 1=1", "2147483648", ["1"], ""]) {
        assert.throws(() => validarId(id), { status: 400 });
    }
});

test("el servicio usa el usuario autenticado e ignora intentos de suplantarlo en query", async () => {
    let llamada;
    const service = crearExpedienteService({
        async listarExpedientes(id, filtros) {
            llamada = { id, filtros };
            return { total: 0, registros: [] };
        }
    });
    const resultado = await service.consultar(7, { id_usuario: "99", pagina: "2" });
    assert.equal(llamada.id, 7);
    assert.equal(llamada.filtros.offset, 20);
    assert.deepEqual(resultado, { total: 0, registros: [], pagina: 2, limite: 20 });
});

test("detalle inexistente o fuera del alcance responde igual y valida antes de consultar", async () => {
    let llamadas = 0;
    const service = crearExpedienteService({
        async consultarValoracion(idUsuario, id) {
            llamadas++;
            assert.equal(idUsuario, 7);
            assert.equal(id, 12);
            return null;
        }
    });
    await assert.rejects(service.consultar(7, { id: "12" }), { status: 404 });
    await assert.rejects(service.consultar(7, { id: "12 OR TRUE" }), { status: 400 });
    assert.equal(llamadas, 1);
});

function respuesta() {
    return {
        headers: {}, code: null, body: null,
        setHeader(key, value) { this.headers[key] = value; },
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; }
    };
}

test("controlador exige sesión/rol, rechaza métodos no admitidos y marca datos como no cacheables", async () => {
    let consultas = 0;
    const service = { async consultar() { consultas++; return { total: 0, registros: [] }; } };
    const handler = crearConsultaExpedientes(async (req, res, roles) => {
        assert.deepEqual(roles, ["Alumno", "Docente"]);
        res.status(403).json({ success: false });
        return null;
    }, service);
    const denied = respuesta();
    await handler({ method: "GET" }, denied);
    assert.equal(denied.code, 403);
    assert.equal(consultas, 0);
    assert.equal(denied.headers["Cache-Control"], "private, no-store");
    const method = respuesta();
    await handler({ method: "POST" }, method);
    assert.equal(method.code, 405);
    assert.equal(method.headers.Allow, "GET, PUT, DELETE");
});

test("controlador devuelve configuración pendiente y oculta errores internos", async () => {
    for (const [error, status] of [
        [{ code: "DATABASE_NOT_CONFIGURED" }, 503],
        [new Error("detalle interno que no debe exponerse"), 500]
    ]) {
        const handler = crearConsultaExpedientes(async () => ({ id_usuario: 7, rol: "Alumno" }), {
            async consultar() { throw error; }
        });
        const res = respuesta();
        await handler({ method: "GET" }, res);
        assert.equal(res.code, status);
        assert.ok(!JSON.stringify(res.body).includes("detalle interno"));
    }
});

test("SQL parametrizado mantiene restricciones de autoría y usuario vigente en listado y detalle", async () => {
    const consultas = [];
    const sql = async (strings, ...values) => {
        consultas.push({ texto: strings.join("?"), values });
        return [{ total: 0, registros: [] }];
    };
    const ataque = "' OR TRUE --%_";
    await listarExpedientes(7, validarFiltros({ buscar: ataque }), sql);
    await consultarValoracion(7, 12, sql);
    for (const consulta of consultas) {
        assert.match(consulta.texto, /v\.id_usuario = \?/);
        assert.match(consulta.texto, /u\.activo = TRUE/);
        assert.match(consulta.texto, /r\.nombre IN \('Alumno', 'Docente'\)/);
        assert.ok(consulta.values.includes(7));
        assert.ok(!consulta.texto.includes(ataque));
    }
    assert.ok(consultas[0].values.includes("%' OR TRUE --\\%\\_%"));
    assert.match(consultas[1].texto, /rp\.id_valoracion = v\.id_valoracion/);
    assert.ok(consultas[1].values.includes(12));
});

const actualEditable = {
    version: "123", fecha_nacimiento: "2026-01-01",
    respuestas: [
        { id_pregunta: 1, tipo: "number", opciones: [] },
        { id_pregunta: 2, tipo: "select", opciones: [{ id_opcion: 10, texto: "Sí" }, { id_opcion: 11, texto: "No" }] },
        { id_pregunta: 3, tipo: "multiple", opciones: [{ id_opcion: 12, texto: "Uno" }, { id_opcion: 13, texto: "Dos" }] }
    ]
};
const edicionValida = () => ({ version: "123", fecha: "2026-10-28", respuestas: [
    { id_pregunta: 1, valores: ["2"] }, { id_pregunta: 2, valores: ["Sí"] },
    { id_pregunta: 3, valores: ["Uno", "Dos"] }
] });

test("edición valida preguntas y opciones propias, números, fechas y selección múltiple", () => {
    const datos = validarEdicion(edicionValida(), actualEditable);
    assert.equal(datos.filas.length, 4);
    assert.equal(datos.filas[0].respuesta_numero, "2");
    assert.equal(datos.filas[1].id_opcion, 10);
    for (const modificar of [
        (body) => { body.fecha = "2025-01-01"; },
        (body) => { body.respuestas[0].valores = ["-1"]; },
        (body) => { body.respuestas[1].valores = ["Otra opción"]; },
        (body) => { body.respuestas[1].valores = ["Sí", "No"]; },
        (body) => { body.respuestas[0].id_pregunta = 99; },
        (body) => { body.respuestas[0].id_pregunta = 2; },
        (body) => { body.respuestas.pop(); }
    ]) {
        const body = edicionValida();
        modificar(body);
        assert.throws(() => validarEdicion(body, actualEditable), { status: 400 });
    }
    const vacias = edicionValida();
    vacias.respuestas[2].valores = [];
    const filas = validarEdicion(vacias, actualEditable).filas;
    assert.equal(filas[2].id_pregunta, 3);
    assert.equal(filas[2].respuesta_texto, "");
});

test("guardar y eliminar exigen autoría existente y versión vigente", async () => {
    let actual = actualEditable;
    const escrituras = [];
    const service = crearExpedienteService({
        async consultarValoracion() { return actual; },
        async modificarValoracion(...args) { escrituras.push(args); return { id_valoracion: 12 }; },
        async eliminarValoracion(...args) { escrituras.push(args); return { id_valoracion: 12 }; }
    });
    await service.cambiar(7, { id: "12" }, edicionValida(), "PUT");
    await service.cambiar(7, { id: "12" }, { version: "123" }, "DELETE");
    assert.equal(escrituras.length, 2);
    assert.deepEqual(escrituras[1], [7, 12, "123", undefined, "Alumno"]);
    await assert.rejects(service.cambiar(7, { id: "12" }, { version: "122" }, "DELETE"), { status: 409 });
    actual = null;
    await assert.rejects(service.cambiar(7, { id: "12" }, edicionValida(), "PUT"), { status: 404 });
    assert.equal(escrituras.length, 2);
});

test("operaciones SQL restringen usuario y versión sin borrar paciente o catálogos", async () => {
    const queries = [];
    const sql = async (strings, ...values) => {
        queries.push({ text: strings.join("?"), values });
        return [{ id_valoracion: 12 }];
    };
    await modificarValoracion(7, 12, validarEdicion(edicionValida(), actualEditable), sql);
    await eliminarValoracion(7, 12, "123", sql);
    for (const query of queries) {
        assert.match(query.text, /v\.id_usuario = \?/);
        assert.match(query.text, /v\.xmin::TEXT = \?/);
        assert.match(query.text, /u\.activo = TRUE/);
        assert.ok(query.values.includes(7));
        assert.ok(query.values.includes("123"));
        assert.doesNotMatch(query.text, /DELETE FROM (paciente|tutor|pregunta|opcion_respuesta)\b/);
    }
    assert.match(queries[0].text, /DELETE FROM respuesta rp USING autorizada/);
    assert.match(queries[1].text, /DELETE FROM valoracion v/);
});

test("controlador bloquea mutaciones de origen ajeno y cuerpo sin JSON", async () => {
    let llamadas = 0;
    const handler = crearConsultaExpedientes(async () => ({ id_usuario: 7, rol: "Alumno" }), {
        async cambiar() { llamadas++; return { message: "OK" }; }
    });
    for (const [headers, esperado] of [
        [{}, 400],
        [{ "content-type": "application/json", origin: "https://ajeno.example", host: "local.example" }, 403],
        [{ "content-type": "application/json", "sec-fetch-site": "cross-site" }, 403],
        [{ "content-type": "application/json", origin: "https://local.example", host: "local.example" }, 200]
    ]) {
        const res = respuesta();
        await handler({ method: "DELETE", headers, query: { id: "12" }, body: { version: "123" } }, res);
        assert.equal(res.code, esperado);
    }
    assert.equal(llamadas, 1);
});

test("navegación alterna expedientes, valoración e inicio sin superponer paneles", async () => {
    const codigo = await readFile(new URL("../src/frontend/services/dashboard.js", import.meta.url), "utf8");
    const inicio = codigo.indexOf("function mostrarPanelValoraciones() {");
    const fin = codigo.indexOf('window.addEventListener("hashchange", mostrarPanelValoraciones);', inicio);
    const valoraciones = {}, expedientes = {}, inicioPanel = {}, titulo = {};
    const enlaces = ["/dashboard", "#valoraciones", "#expedientes"].map((ruta) => ({
        getAttribute() { return ruta; },
        classList: { toggle() {} }, setAttribute() {}, removeAttribute() {}
    }));
    const context = vm.createContext({
        window: { location: { hash: "#expedientes" } },
        document: {
            querySelector(selector) {
                return { "#valoraciones-panel": valoraciones, "#expedientes-panel": expedientes,
                    ".topbar h1": titulo }[selector];
            },
            querySelectorAll(selector) {
                return selector === ".sidebar-nav .nav-link" ? enlaces : [inicioPanel];
            }
        }
    });
    vm.runInContext(codigo.slice(inicio, fin), context);
    for (const [hash, v, e, home, texto] of [
        ["#expedientes", true, false, true, "Expedientes"],
        ["#valoraciones", false, true, true, "Valoraciones"],
        ["", true, true, false, "Panel principal"]
    ]) {
        context.window.location.hash = hash;
        vm.runInContext("mostrarPanelValoraciones()", context);
        assert.equal(valoraciones.hidden, v);
        assert.equal(expedientes.hidden, e);
        assert.equal(inicioPanel.hidden, home);
        assert.equal(titulo.textContent, texto);
    }
    expedientes.dataset = { consultaHash: "#valoraciones" };
    context.document.querySelector = (selector) => ({ "#expedientes-panel": expedientes, ".topbar h1": titulo }[selector]);
    context.window.location.hash = "#valoraciones";
    vm.runInContext("mostrarPanelValoraciones()", context);
    assert.equal(expedientes.hidden, false);
    assert.equal(inicioPanel.hidden, true);
    assert.equal(titulo.textContent, "Valoraciones");
    context.window.location.hash = "";
    vm.runInContext("mostrarPanelValoraciones()", context);
    assert.equal(expedientes.hidden, true);
    assert.equal(titulo.textContent, "Panel docente");
});

test("panel docente sin Mis grupos consulta por alumno y muestra al autor", async () => {
    const html = await readFile(new URL("../src/backend/views/dashboard-docente.html", import.meta.url), "utf8");
    assert.doesNotMatch(html, /Mis grupos|href="#grupos"/);
    assert.match(html, /name="alumno"/);
    assert.match(html, /name="id_alumno"/);
    class Nodo {
        constructor() { this.children = []; this.events = {}; this.textContent = ""; }
        append(...items) { this.children.push(...items); }
        replaceChildren(...items) { this.children = items; }
        addEventListener(event, action) { this.events[event] = action; }
        setAttribute() {}
    }
    const ids = Object.fromEntries([
        "expedientes-filtros", "expedientes-mensaje", "expedientes-resultados", "expediente-detalle",
        "expedientes-anterior", "expedientes-siguiente", "expedientes-paginacion"
    ].map((id) => [`#${id}`, new Nodo()]));
    ids["#expedientes-filtros"].dataset = { rol: "Docente" };
    ids["#expedientes-filtros"].elements = { desde: { value: "" }, hasta: { value: "" } };
    const requests = [];
    const context = vm.createContext({
        URLSearchParams, AbortController,
        FormData: class { *[Symbol.iterator]() { yield ["alumno", "Prueba"]; yield ["id_alumno", "8"]; } },
        document: { querySelector: (id) => ids[id], createElement: () => new Nodo() },
        window: { location: { hash: "#valoraciones" }, addEventListener() {} },
        async fetch(url) {
            requests.push(url);
            return { ok: true, status: 200, async json() { return { success: true, total: 1, registros: [{
                id_valoracion: 12, alumno: "Prueba", correo_alumno: "prueba@example.test", id_alumno: 8,
                folio: "PRUEBA", nombre: "Paciente de prueba", fecha_nacimiento: "2026-01-01",
                fecha_valoracion: "2026-10-28", sexo: "Femenino", estado: "completado"
            }] }; } };
        }
    });
    vm.runInContext(await readFile(new URL("../src/frontend/services/expedientes.js", import.meta.url), "utf8"), context);
    const terminar = () => new Promise((resolve) => setImmediate(resolve));
    await terminar();
    assert.equal(ids["#expedientes-resultados"].children[0].children.length, 8);
    assert.match(ids["#expedientes-resultados"].children[0].children[6].textContent, /Prueba.*ID 8/);
    ids["#expedientes-filtros"].events.submit({ preventDefault() {} });
    await terminar();
    assert.ok(requests.at(-1).includes("alumno=Prueba"));
    assert.ok(requests.at(-1).includes("id_alumno=8"));
});

test("pantalla consulta resultados, pagina y carga detalle sin interpretar HTML del paciente", async () => {
    class Nodo {
        constructor() { this.children = []; this.events = {}; this.textContent = ""; }
        append(...children) { this.children.push(...children); }
        replaceChildren(...children) { this.children = children; }
        addEventListener(event, action) { this.events[event] = action; }
        setAttribute() {}
        focus() {}
    }
    const ids = Object.fromEntries([
        "expedientes-filtros", "expedientes-mensaje", "expedientes-resultados", "expediente-detalle",
        "expedientes-anterior", "expedientes-siguiente", "expedientes-paginacion"
    ].map((id) => [`#${id}`, new Nodo()]));
    const nombre = '<img src=x onerror="alert(1)">';
    const requests = [];
    const context = vm.createContext({
        URLSearchParams, AbortController,
        document: { querySelector: (id) => ids[id], createElement: () => new Nodo() },
        window: { location: { hash: "#expedientes" }, addEventListener() {} },
        async fetch(url) {
            requests.push(url);
            const detalle = url.includes("id=12");
            return { ok: true, status: 200, async json() {
                return detalle ? { success: true, expediente: {
                    nombre, folio: "PRUEBA", fecha_valoracion: "2026-10-28", estado: "completado",
                    fecha_nacimiento: "2026-01-01", sexo: "Femenino", tutores: [],
                    respuestas: [{ seccion: "Prueba", pregunta: "Frecuencia", valor: "Semanal" }]
                } } : { success: true, total: 21, registros: [{
                    id_valoracion: 12, nombre, folio: "PRUEBA", sexo: "Femenino",
                    fecha_nacimiento: "2026-01-01", fecha_valoracion: "2026-10-28", estado: "completado"
                }] };
            } };
        }
    });
    const codigo = await readFile(new URL("../src/frontend/services/expedientes.js", import.meta.url), "utf8");
    vm.runInContext(codigo, context);
    const terminar = () => new Promise((resolve) => setImmediate(resolve));
    await terminar();
    const fila = ids["#expedientes-resultados"].children[0];
    assert.equal(fila.children[1].textContent, nombre);
    assert.equal(ids["#expedientes-anterior"].disabled, true);
    assert.equal(ids["#expedientes-siguiente"].disabled, false);
    const boton = fila.children[6].children[0];
    await boton.events.click();
    await terminar();
    assert.equal(ids["#expediente-detalle"].hidden, false);
    assert.equal(ids["#expediente-detalle"].children[0].textContent, `${nombre} · PRUEBA`);
    ids["#expedientes-siguiente"].events.click();
    await terminar();
    assert.ok(requests.some((url) => url.includes("pagina=2")));
    assert.equal(ids["#expedientes-anterior"].disabled, false);
    assert.equal(ids["#expedientes-siguiente"].disabled, true);
});

test("pantalla permite editar y exige confirmación antes de eliminar", async () => {
    class Nodo {
        constructor() { this.children = []; this.events = {}; this.textContent = ""; }
        append(...items) { this.children.push(...items); }
        replaceChildren(...items) { this.children = items; }
        addEventListener(event, action) { this.events[event] = action; }
        setAttribute() {}
        focus() {}
        reportValidity() { return true; }
    }
    const ids = Object.fromEntries([
        "expedientes-filtros", "expedientes-mensaje", "expedientes-resultados", "expediente-detalle",
        "expedientes-anterior", "expedientes-siguiente", "expedientes-paginacion"
    ].map((id) => [`#${id}`, new Nodo()]));
    let confirmar = false;
    const mutations = [];
    const exp = {
        id_valoracion: 12, version: "123", nombre: "Paciente de prueba", folio: "PRUEBA",
        fecha_valoracion: "2026-10-28", fecha_nacimiento: "2026-01-01", sexo: "Femenino", estado: "completado",
        tutores: [], respuestas: [{ id_pregunta: 1, tipo: "number", pregunta: "Cantidad", seccion: "Prueba", valor: "2", opciones: [] }]
    };
    const context = vm.createContext({
        URLSearchParams, AbortController,
        document: { querySelector: (id) => ids[id], createElement: () => new Nodo() },
        window: { location: { hash: "#expedientes" }, addEventListener() {}, confirm() { return confirmar; } },
        async fetch(url, options) {
            if (options.method !== "GET") mutations.push({ url, method: options.method, body: JSON.parse(options.body) });
            return { ok: true, status: 200, async json() {
                if (options.method !== "GET") return { success: true, message: "Operación realizada" };
                return url.includes("id=12") ? { success: true, expediente: exp }
                    : { success: true, total: 1, registros: [exp] };
            } };
        }
    });
    const codigo = await readFile(new URL("../src/frontend/services/expedientes.js", import.meta.url), "utf8");
    vm.runInContext(codigo, context);
    const terminar = () => new Promise((resolve) => setImmediate(resolve));
    await terminar();
    const acciones = () => ids["#expedientes-resultados"].children[0].children[6].children;
    await acciones()[1].events.click();
    const editor = ids["#expediente-detalle"].children[1];
    const cantidad = editor.children[2].children[1];
    cantidad.value = "3";
    editor.events.submit({ preventDefault() {} });
    await terminar();
    assert.equal(mutations[0].method, "PUT");
    assert.equal(mutations[0].body.version, "123");
    assert.deepEqual(mutations[0].body.respuestas, [{ id_pregunta: 1, valores: ["3"] }]);
    await acciones()[2].events.click();
    await terminar();
    assert.equal(mutations.length, 1, "cancelar confirmación no debe borrar");
    confirmar = true;
    const botones = ids["#expediente-detalle"].children;
    await botones.at(-1).events.click();
    await terminar();
    assert.equal(mutations[1].method, "DELETE");
    assert.deepEqual(mutations[1].body, { version: "123" });
});
