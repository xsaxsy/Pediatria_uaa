import test from 'node:test';
import assert from 'node:assert/strict';
import { validarDatosAdmin } from '../src/backend/validators/adminValidator.js';
import { crearAdminHandler } from '../src/backend/controllers/adminController.js';
import { cambiarEstadoAdmin } from '../src/backend/repositories/adminRepository.js';
import { verificarAutenticacion } from '../src/backend/validators/authMiddleware.js';

const alumno = { nombre: ' Alumna Prueba ', correo: ' ALUMNA@example.com ', id_grupo: 2, activo: true, password: 'Prueba-segura-2026' };
function respuesta() {
    return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}
function entorno(opciones = {}) {
    const escritos = [];
    const repo = {
        esAdministradorActivo: async () => opciones.activo ?? true,
        listarGruposAdmin: async () => [],
        listarAlumnosAdmin: async filtros => ({ registros: [], total: 0, filtros }),
        guardarAlumnoAdmin: async (...args) => { escritos.push(args); return opciones.resultado ?? [{ id_usuario: 5 }]; },
        guardarGrupoAdmin: async (...args) => { escritos.push(args); return opciones.resultado ?? [{ id_grupo: 2 }]; },
        cambiarEstadoAdmin: async (...args) => { escritos.push(args); return opciones.resultado ?? [{ activo: args[3].activo }]; }
    };
    const handler = crearAdminHandler(async () => opciones.sesion ?? { id_usuario: 1, rol: 'Administrativo' }, repo);
    return { handler, escritos };
}
const solicitud = (body, query = {}) => ({ method: 'PUT', headers: { 'content-type': 'application/json' }, query: { recurso: 'alumnos', id: '5', ...query }, body });

test('validación limita campos, normaliza correo y protege contraseña inicial', () => {
    const datos = validarDatosAdmin({ ...alumno, id_rol: 1, password_hash: 'inyectado' }, 'alumnos', false);
    assert.equal(datos.correo, 'alumna@example.com');
    assert.equal(datos.nombre, 'Alumna Prueba');
    assert.equal(datos.id_rol, undefined);
    assert.equal(datos.password_hash, undefined);
    for (const cambio of [{ activo: 'false' }, { id_grupo: -2 }, { correo: 'incorrecto' }, { password: 'corta' }, { password: 'á'.repeat(40) }]) {
        assert.throws(() => validarDatosAdmin({ ...alumno, ...cambio }, 'alumnos', false), { status: 400 });
    }
    assert.throws(() => validarDatosAdmin(alumno, 'alumnos', true), { status: 400 });
});
test('alumno, docente y administrador desactivado no pueden escribir', async () => {
    for (const opciones of [{ sesion: { id_usuario: 1, rol: 'Alumno' } }, { sesion: { id_usuario: 1, rol: 'Docente' } }, { activo: false }]) {
        const { handler, escritos } = entorno(opciones); const res = respuesta();
        await handler(solicitud({ ...alumno, version: '123' }), res);
        assert.equal(res.code, 403); assert.equal(escritos.length, 0);
    }
});
test('creación cifra contraseña y descarta un rol solicitado por el cliente', async () => {
    const { handler, escritos } = entorno(); const res = respuesta();
    await handler({ ...solicitud({ ...alumno, id_rol: 1 }), method: 'POST' }, res);
    assert.equal(res.code, 201); assert.equal(escritos[0][0], 1); assert.equal(escritos[0][1], null);
    assert.match(escritos[0][3], /^\$2[aby]\$/); assert.equal(escritos[0][2].id_rol, undefined);
    assert.ok(!JSON.stringify(res.body).includes(alumno.password));
});
test('edición usa versión y no permite modificar contraseña ni rol', async () => {
    const { handler, escritos } = entorno(); const res = respuesta();
    await handler(solicitud({ ...alumno, version: '123', id_rol: 1 }), res);
    assert.equal(res.code, 200); assert.equal(escritos[0][2].version, '123');
    assert.equal(escritos[0][2].password, undefined); assert.equal(escritos[0][3], null);
});
test('conflicto de versión o grupo inactivo pide recargar', async () => {
    const { handler } = entorno({ resultado: [] }); const res = respuesta();
    await handler(solicitud({ ...alumno, version: '123' }), res); assert.equal(res.code, 409);
});
test('operaciones sin JSON, cruzadas y DELETE se rechazan', async () => {
    for (const [cambio, estado] of [[{ headers: {} }, 415], [{ headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' } }, 403], [{ headers: { 'content-type': 'application/json', origin: 'https://otro.example', host: 'localhost:3000' } }, 403], [{ method: 'DELETE' }, 405]]) {
        const { handler, escritos } = entorno(); const res = respuesta();
        await handler({ ...solicitud({ ...alumno, version: '123' }), ...cambio }, res);
        assert.equal(res.code, estado); assert.equal(escritos.length, 0);
    }
});
test('filtros inválidos se rechazan y consulta devuelve paginación', async () => {
    const { handler } = entorno();
    for (const query of [{ pagina: '-1' }, { activo: 'otro' }, { grupo: 'NaN' }, { recurso: 'usuarios' }]) {
        const res = respuesta(); await handler({ method: 'GET', query }, res); assert.equal(res.code, 400);
    }
    const res = respuesta(); await handler({ method: 'GET', query: { grupo: '2', activo: 'false', pagina: '3' } }, res);
    assert.equal(res.code, 200); assert.deepEqual(res.body.filtros, { buscar: '', grupo: 2, estado: false, pagina: 3 });
    assert.equal(res.headers['Cache-Control'], 'private, no-store');
});
test('grupos se crean con periodo y errores duplicados no exponen SQL', async () => {
    const { handler } = entorno(); const res = respuesta();
    await handler({ method: 'POST', query: { recurso: 'grupos' }, headers: { 'content-type': 'application/json' }, body: { nombre: '4A', periodo: '2026-2', activo: true } }, res);
    assert.equal(res.code, 201);
    const duplicado = crearAdminHandler(async () => ({ id_usuario: 1, rol: 'Administrativo' }), {
        esAdministradorActivo: async () => true, guardarGrupoAdmin: async () => { throw Object.assign(new Error('SQL secreto'), { code: '23505' }); }
    });
    const r = respuesta(); await duplicado({ method: 'POST', query: { recurso: 'grupos' }, headers: { 'content-type': 'application/json' }, body: { nombre: '4A', periodo: '2026-2', activo: true } }, r);
    assert.equal(r.code, 409); assert.ok(!JSON.stringify(r.body).includes('SQL secreto'));
});

test('periodos admiten dos semestres y rechazan texto libre antes de escribir', async () => {
    for (const periodo of ['2026-1', '2026-2', '2031-2']) {
        const datos = validarDatosAdmin({ nombre: '4A', periodo, activo: true }, 'grupos', false);
        assert.equal(datos.periodo, periodo);
    }
    for (const periodo of ['', 'Agosto–Diciembre 2026', '2026-3', '2026-0', '26-1', '0000-1', '2026-02', 'undefined-1']) {
        const { handler, escritos } = entorno(); const res = respuesta();
        await handler({ method: 'POST', query: { recurso: 'grupos' }, headers: { 'content-type': 'application/json' },
            body: { nombre: '4A', periodo, activo: true } }, res);
        assert.equal(res.code, 400, periodo);
        assert.equal(escritos.length, 0);
    }
});

test('bajas y reactivaciones envían solo estado y versión sin cambiar datos del registro', async () => {
    for (const recurso of ['alumnos', 'grupos']) {
        for (const activo of [false, true]) {
            const { handler, escritos } = entorno(); const res = respuesta();
            await handler({ ...solicitud({ activo, version: '123', nombre: 'No cambiar', id_grupo: 999, id_rol: 1 }, { recurso }), method: 'PATCH' }, res);
            assert.equal(res.code, 200);
            assert.deepEqual(escritos, [[1, recurso, 5, { activo, version: '123' }]]);
        }
    }
});

test('baja rechaza datos inválidos, permisos insuficientes, origen ajeno y versiones antiguas', async () => {
    for (const body of [{ activo: 'false', version: '123' }, { activo: false }, { activo: false, version: 'abc' }]) {
        const { handler, escritos } = entorno(); const res = respuesta();
        await handler({ ...solicitud(body), method: 'PATCH' }, res);
        assert.equal(res.code, 400); assert.equal(escritos.length, 0);
    }
    for (const opciones of [{ activo: false }, { sesion: { id_usuario: 2, rol: 'Alumno' } }, { sesion: { id_usuario: 3, rol: 'Docente' } }]) {
        const { handler, escritos } = entorno(opciones); const res = respuesta();
        await handler({ ...solicitud({ activo: false, version: '123' }), method: 'PATCH' }, res);
        assert.equal(res.code, 403); assert.equal(escritos.length, 0);
    }
    const cruzada = entorno(); const rc = respuesta();
    await cruzada.handler({ ...solicitud({ activo: false, version: '123' }), method: 'PATCH', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' } }, rc);
    assert.equal(rc.code, 403); assert.equal(cruzada.escritos.length, 0);
    const conflicto = entorno({ resultado: [] }); const res = respuesta();
    await conflicto.handler({ ...solicitud({ activo: false, version: '123' }), method: 'PATCH' }, res);
    assert.equal(res.code, 409);
});

test('SQL de baja solo actualiza activo y restringe versión, actor vigente y rol del alumno', async () => {
    for (const recurso of ['alumnos', 'grupos']) {
        let consulta, parametros;
        const sql = async (partes, ...valores) => { consulta = partes.join('?'); parametros = valores; return []; };
        await cambiarEstadoAdmin(1, recurso, 5, { activo: false, version: '123' }, sql);
        assert.match(consulta, /SET activo = \?\s+WHERE/);
        assert.match(consulta, /xmin::text = \?/);
        assert.match(consulta, /a\.activo AND ar\.nombre = 'Administrativo'/);
        assert.doesNotMatch(consulta, /DELETE|INSERT|SET nombre|SET id_grupo/i);
        if (recurso === 'alumnos') assert.match(consulta, /r\.nombre = 'Alumno'/);
        assert.deepEqual(parametros, [false, 5, '123', 1]);
    }
});

test('una sesión firmada pierde acceso tras la baja y se limpia su cookie', async () => {
    let activa = true;
    const deps = {
        verificarToken: async () => ({ id_usuario: 5, rol: 'Alumno' }),
        consultarCuenta: async () => activa ? { id_usuario: 5, rol: 'Alumno' } : null
    };
    const req = { headers: { cookie: 'session=token-de-prueba' } };
    assert.equal((await verificarAutenticacion(req, respuesta(), deps)).id_usuario, 5);
    activa = false;
    const res = respuesta();
    assert.equal(await verificarAutenticacion(req, res, deps), null);
    assert.equal(res.code, 401); assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
});

test('sesiones activas conservan acceso y cambios de rol exigen nueva sesión', async () => {
    const req = { headers: { cookie: 'session=token-de-prueba' } };
    for (const rol of ['Alumno', 'Docente', 'Administrativo']) {
        const sesion = { id_usuario: 5, rol };
        assert.deepEqual(await verificarAutenticacion(req, respuesta(), {
            verificarToken: async () => sesion, consultarCuenta: async () => sesion
        }), sesion);
    }
    const res = respuesta();
    assert.equal(await verificarAutenticacion(req, res, {
        verificarToken: async () => ({ id_usuario: 5, rol: 'Administrativo' }),
        consultarCuenta: async () => ({ id_usuario: 5, rol: 'Alumno' })
    }), null);
    assert.equal(res.code, 401);
});

test('sin token válido no consulta la cuenta y un fallo de base nunca autoriza', async () => {
    let consultas = 0;
    const deps = { verificarToken: async () => null, consultarCuenta: async () => { consultas++; } };
    assert.equal(await verificarAutenticacion({ headers: {} }, respuesta(), deps), null);
    assert.equal(await verificarAutenticacion({ headers: { cookie: 'session=invalido' } }, respuesta(), deps), null);
    assert.equal(consultas, 0);
    await assert.rejects(verificarAutenticacion({ headers: { cookie: 'session=valido' } }, respuesta(), {
        verificarToken: async () => ({ id_usuario: 5, rol: 'Alumno' }),
        consultarCuenta: async () => { throw new Error('Sin conexión'); }
    }), /Sin conexión/);
});
