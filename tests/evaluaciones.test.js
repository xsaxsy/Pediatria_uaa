import test from "node:test";
import assert from "node:assert/strict";
import { evaluacionValida, crearHandlerEvaluaciones } from "../api/evaluaciones.js";
import { validarFiltros } from "../src/backend/validators/expedienteValidator.js";

test("las calificaciones aceptan decimales entre 0 y 10, incluidos los extremos", () => {
    for (const nota of [0, 0.1, 8.75, 10]) assert.equal(evaluacionValida(nota, "Bien"), true);
    for (const nota of [-0.01, 10.01, NaN, Infinity, "8", null]) assert.equal(evaluacionValida(nota, "Bien"), false);
    assert.equal(evaluacionValida(8, "x".repeat(5001)), false);
});

test("el filtro de calificación acepta únicamente estados conocidos", () => {
    assert.equal(validarFiltros({ estado_calificacion: "calificado" }).estadoCalificacion, "calificado");
    assert.equal(validarFiltros({ estado_calificacion: "pendiente" }).estadoCalificacion, "pendiente");
    assert.throws(() => validarFiltros({ estado_calificacion: "otro" }), { status: 400 });
});

test("solo docentes pueden registrar o modificar evaluaciones con una versión vigente", async () => {
    let escrituras = 0;
    let devolverFila = true;
    const handler = crearHandlerEvaluaciones(async (req) => req.sesion, () => async (partes, ...valores) => {
        escrituras++;
        assert.match(partes.join("?"), /r\.nombre = 'Docente'/);
        assert.ok(valores.includes(8.5));
        return devolverFila ? [{ id_valoracion: 4 }] : [];
    });
    const peticion = { method: "PUT", headers: { "content-type": "application/json" }, query: { id: "4" },
        body: { version: "12", calificacion: 8.5, comentario: "Buen trabajo" }, sesion: { id_usuario: 3, rol: "Docente" } };
    function respuesta() { return { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
    let res = respuesta();
    await handler({ ...peticion, sesion: { id_usuario: 2, rol: "Alumno" } }, res);
    assert.equal(res.code, 403);
    assert.equal(escrituras, 0);
    res = respuesta();
    await handler({ ...peticion, body: { ...peticion.body, calificacion: 10.1 } }, res);
    assert.equal(res.code, 400);
    assert.equal(escrituras, 0);
    res = respuesta();
    await handler(peticion, res);
    assert.equal(res.code, 200);
    devolverFila = false;
    res = respuesta();
    await handler(peticion, res);
    assert.equal(res.code, 409);
    res = respuesta();
    await handler({ ...peticion, method: "DELETE" }, res);
    assert.equal(res.code, 405);
});
