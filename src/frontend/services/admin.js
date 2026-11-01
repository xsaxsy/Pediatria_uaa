// Módulo exclusivo del administrador; conserva sesión y menú del dashboard compartido.
const panel = document.querySelector('#admin-panel');
const formulario = document.querySelector('#admin-form');
const filtros = document.querySelector('#admin-filtros');
const mensaje = document.querySelector('#admin-message');
const mensajeForm = document.querySelector('#admin-form-message');
let recurso = 'alumnos';
let grupos = [];
let registros = [];
let pagina = 1;
let total = 0;
let editando = null;
let secuencia = 0;
let guardando = false;

async function peticion(params, opciones = {}) {
    const respuesta = await fetch(`/api/administracion?${new URLSearchParams(params)}`, { credentials: 'same-origin', ...opciones });
    if (respuesta.status === 401) { window.location.replace('/'); throw new Error('Tu sesión expiró.'); }
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.success) throw new Error(datos.message || 'No se pudo completar la operación.');
    return datos;
}
function opcion(select, valor, etiqueta) {
    const item = document.createElement('option'); item.value = valor; item.textContent = etiqueta; select.append(item);
}
function formatearPeriodo(periodo) {
    const partes = /^([1-9]\d{3})-([12])$/.exec(periodo ?? '');
    if (!partes) return periodo || 'Sin periodo';
    return `${partes[2] === '1' ? 'Enero–Junio' : 'Agosto–Diciembre'} ${partes[1]}`;
}
function prepararPeriodo(periodo) {
    const partes = /^([1-9]\d{3})-([12])$/.exec(periodo ?? '');
    const actual = new Date().getFullYear();
    const anios = new Set(Array.from({ length: 11 }, (_, i) => actual - 5 + i));
    // Conserva la selección de registros históricos fuera del rango habitual.
    if (partes) anios.add(Number(partes[1]));
    const select = formulario.elements.anio;
    select.replaceChildren(); opcion(select, '', 'Selecciona un año');
    [...anios].sort((a, b) => a - b).forEach(anio => opcion(select, anio, anio));
    select.value = partes?.[1] ?? '';
    formulario.elements.semestre.value = partes?.[2] ?? '';
}
function actualizarGrupos() {
    const selectFiltro = filtros.elements.grupo;
    const anterior = selectFiltro.value;
    selectFiltro.replaceChildren(); opcion(selectFiltro, '', 'Todos los grupos');
    for (const g of grupos) opcion(selectFiltro, g.id_grupo, `${g.nombre} · ${formatearPeriodo(g.periodo)}${g.activo ? '' : ' (inactivo)'}`);
    selectFiltro.value = anterior;
}
function cerrarEditor() {
    formulario.hidden = true; formulario.reset(); editando = null; mensajeForm.textContent = '';
    mensajeForm.classList.remove('admin-error');
    document.querySelector('#admin-listado').hidden = false;
    document.querySelector('#admin-nuevo').hidden = false;
    document.querySelector('#admin-description').hidden = false;
}
function explicarEstado() {
    const activo = formulario.elements.activo.value === 'true';
    document.querySelector('#admin-status-help').textContent = recurso === 'alumnos'
        ? activo ? 'El alumno podrá iniciar sesión con su correo y contraseña.' : 'El alumno no podrá iniciar sesión. Su cuenta y sus registros se conservarán.'
        : activo ? 'Podrás asignar alumnos a este grupo.' : 'No se podrán asignar nuevos alumnos. Los integrantes actuales conservarán su grupo y el acceso a sus cuentas.';
}
function abrirEditor(registro = null) {
    if (guardando) return;
    formulario.reset(); editando = registro; mensajeForm.textContent = '';
    mensajeForm.classList.remove('admin-error'); mensaje.textContent = '';
    const alumno = recurso === 'alumnos';
    formulario.querySelectorAll('[data-campo]').forEach(e => {
        const visible = e.dataset.campo === 'alumno' ? alumno : e.dataset.campo === 'grupo' ? !alumno : alumno && !registro;
        e.hidden = !visible;
        e.querySelectorAll('input, select').forEach(control => { control.disabled = !visible; });
    });
    formulario.elements.correo.required = alumno;
    formulario.elements.password.required = alumno && !registro;
    formulario.elements.semestre.required = !alumno;
    formulario.elements.anio.required = !alumno;
    formulario.elements.nombre.maxLength = alumno ? 150 : 100;
    formulario.elements.nombre.value = registro?.nombre ?? '';
    formulario.elements.activo.value = String(registro?.activo ?? true);
    formulario.elements.correo.value = registro?.correo ?? '';
    prepararPeriodo(registro?.periodo);
    const select = formulario.elements.id_grupo;
    select.replaceChildren(); opcion(select, '', 'Sin grupo');
    for (const g of grupos.filter(g => g.activo || g.id_grupo === registro?.id_grupo)) opcion(select, g.id_grupo, `${g.nombre} · ${formatearPeriodo(g.periodo)}${g.activo ? '' : ' (inactivo)'}`);
    select.value = registro?.id_grupo ?? '';
    document.querySelector('#admin-identity-title').textContent = alumno ? 'Datos del alumno' : 'Datos del grupo';
    document.querySelector('#admin-name-label').textContent = alumno ? 'Nombre completo *' : 'Nombre del grupo *';
    formulario.elements.nombre.placeholder = alumno ? 'Ej. Ana López García' : 'Ej. 4A';
    document.querySelector('#admin-status-title').textContent = alumno ? 'Acceso a la cuenta' : 'Disponibilidad del grupo';
    document.querySelector('#admin-group-help').textContent = grupos.some(g => g.activo)
        ? 'Elige el grupo y revisa su periodo. Puedes dejar al alumno sin grupo y asignarlo después.'
        : 'No hay grupos activos disponibles. Puedes guardar al alumno sin grupo o crear un grupo activo en la sección Grupos.';
    document.querySelector('#admin-editor-description').textContent = registro
        ? `Estás editando: ${registro.nombre}${alumno ? '' : ` · ${formatearPeriodo(registro.periodo)}`}. Revisa los campos antes de guardar.`
        : alumno ? 'Completa los datos de la cuenta y selecciona su grupo, si ya lo conoces.'
            : 'Asigna un nombre al grupo, elige su periodo y define si estará disponible para recibir alumnos.';
    document.querySelector('#admin-editor-title').textContent = `${registro ? 'Editar' : alumno ? 'Registrar' : 'Crear'} ${alumno ? 'alumno' : 'grupo'}`;
    document.querySelector('#admin-guardar').textContent = registro ? 'Guardar cambios' : alumno ? 'Registrar alumno' : 'Crear grupo';
    document.querySelector('#admin-listado').hidden = true;
    document.querySelector('#admin-nuevo').hidden = true;
    document.querySelector('#admin-description').hidden = true;
    explicarEstado();
    formulario.hidden = false; formulario.elements.nombre.focus({ preventScroll: true }); formulario.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function boton(texto, accion) { const b = document.createElement('button'); b.type = 'button'; b.textContent = texto; b.addEventListener('click', accion); return b; }
function confirmarEstado(registro, activar, tipo = recurso) {
    const alumno = tipo === 'alumnos';
    const etiqueta = alumno ? `${registro.nombre} (${registro.correo})` : `${registro.nombre} · ${formatearPeriodo(registro.periodo)}`;
    const efecto = alumno
        ? activar ? 'El alumno podrá iniciar sesión nuevamente con su cuenta.' : 'El alumno no podrá iniciar sesión ni continuar operando con una sesión abierta. Sus valoraciones y su grupo se conservarán.'
        : activar ? 'El grupo volverá a estar disponible para asignar alumnos.' : 'El grupo dejará de recibir nuevas asignaciones. Sus integrantes conservarán sus cuentas y su grupo.';
    const dialogo = document.querySelector('#admin-confirmacion');
    document.querySelector('#admin-confirmacion-title').textContent = `${activar ? 'Reactivar' : 'Dar de baja'}: ${etiqueta}`;
    document.querySelector('#admin-confirmacion-detail').textContent = efecto;
    document.querySelector('#admin-confirmacion-aceptar').textContent = activar ? 'Sí, reactivar' : 'Sí, dar de baja';
    dialogo.returnValue = 'cancelar';
    return new Promise(resolve => {
        dialogo.addEventListener('close', () => resolve(dialogo.returnValue === 'confirmar'), { once: true });
        dialogo.showModal();
    });
}
async function cambiarEstado(registro) {
    if (guardando) return;
    const recursoActual = recurso;
    const vistaActual = secuencia;
    const alumno = recursoActual === 'alumnos';
    const activar = !registro.activo;
    if (!await confirmarEstado(registro, activar, recursoActual) || secuencia !== vistaActual) return;
    guardando = true;
    const botones = [...document.querySelectorAll('#admin-tabla button')];
    botones.forEach(b => { b.disabled = true; });
    mensaje.classList.remove('admin-error'); mensaje.textContent = activar ? 'Reactivando…' : 'Aplicando baja…';
    try {
        await peticion({ recurso: recursoActual, id: registro.id_usuario ?? registro.id_grupo }, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: activar, version: registro.version })
        });
        if (secuencia === vistaActual && !panel.hidden && await cargar()) {
            mensaje.textContent = `${alumno ? 'Alumno' : 'Grupo'} ${activar ? 'reactivado' : 'dado de baja'} correctamente. ${alumno && !activar ? 'Puedes encontrarlo con el filtro Estado de la cuenta: Inactivo.' : 'Se conservan sus registros y relaciones.'}`;
        }
    } catch (error) {
        if (secuencia === vistaActual && !panel.hidden) {
            mensaje.classList.add('admin-error'); mensaje.textContent = error.message;
            mensaje.append(' ', boton('Actualizar lista', cargar));
        }
    } finally {
        guardando = false; botones.forEach(b => { b.disabled = false; });
    }
}
function dibujarTabla() {
    const alumno = recurso === 'alumnos';
    const tabla = document.createElement('table'); tabla.className = 'expedientes-table';
    const caption = tabla.createCaption(); caption.textContent = alumno ? 'Resultados de alumnos' : `${registros.length} ${registros.length === 1 ? 'grupo registrado' : 'grupos registrados'}`;
    const cabeza = tabla.createTHead().insertRow();
    for (const titulo of alumno ? ['Nombre', 'Correo', 'Estado', 'Grupo', 'Acciones'] : ['Grupo', 'Periodo', 'Estado', 'Alumnos', 'Acciones']) {
        const th = document.createElement('th'); th.scope = 'col'; th.textContent = titulo; cabeza.append(th);
    }
    const cuerpo = tabla.createTBody();
    for (const registro of registros) {
        const fila = cuerpo.insertRow();
        const valores = alumno ? [registro.nombre, registro.correo, registro.activo ? 'Activo' : 'Inactivo', registro.grupo ? `${registro.grupo} · ${formatearPeriodo(registro.periodo)}` : 'Sin grupo']
            : [registro.nombre, formatearPeriodo(registro.periodo), registro.activo ? 'Activo' : 'Inactivo', registro.alumnos];
        valores.forEach((valor, indice) => {
            const celda = fila.insertCell();
            if (indice === 2) {
                const estado = document.createElement('span');
                estado.className = `admin-badge ${registro.activo ? 'admin-badge-active' : 'admin-badge-inactive'}`;
                estado.textContent = valor; celda.append(estado);
            } else celda.textContent = valor;
        });
        const acciones = fila.insertCell();
        const editar = boton(alumno ? 'Editar alumno' : 'Editar grupo', () => abrirEditor(registro));
        editar.setAttribute('aria-label', `Editar ${alumno ? 'alumno' : 'grupo'}: ${registro.nombre}`);
        acciones.append(editar);
        const estado = boton(registro.activo ? 'Dar de baja' : 'Reactivar', () => cambiarEstado(registro));
        estado.className = registro.activo ? 'admin-baja' : 'admin-reactivar';
        estado.setAttribute('aria-label', `${registro.activo ? 'Dar de baja' : 'Reactivar'} ${alumno ? 'alumno' : 'grupo'}: ${registro.nombre}`);
        acciones.append(estado);
        if (!alumno) acciones.append(boton('Ver alumnos', () => {
            filtros.elements.buscar.value = ''; filtros.elements.activo.value = '';
            filtros.elements.grupo.value = registro.id_grupo; window.location.hash = '#cuentas';
        }));
    }
    if (!registros.length) {
        const celda = cuerpo.insertRow().insertCell(); celda.colSpan = 5; celda.className = 'admin-empty';
        celda.textContent = alumno ? 'No se encontraron alumnos. Revisa los filtros o pulsa Limpiar filtros para consultar todas las cuentas.'
            : 'Todavía no hay grupos registrados. Pulsa Crear grupo para agregar el primero.';
    }
    document.querySelector('#admin-tabla').replaceChildren(tabla);
    document.querySelector('#admin-paginacion').hidden = !alumno;
    document.querySelector('#admin-pagina').textContent = `${total} ${total === 1 ? 'alumno' : 'alumnos'} · Página ${pagina} de ${Math.max(1, Math.ceil(total / 20))}`;
    document.querySelector('#admin-anterior').disabled = pagina <= 1;
    document.querySelector('#admin-siguiente').disabled = pagina * 20 >= total;
}
async function cargar() {
    const turno = ++secuencia;
    mensaje.classList.remove('admin-error'); mensaje.textContent = 'Cargando…';
    document.querySelector('#admin-nuevo').disabled = true;
    document.querySelector('#admin-tabla').replaceChildren();
    document.querySelector('#admin-paginacion').hidden = true;
    try {
        const lista = await peticion({ recurso: 'grupos' });
        if (turno !== secuencia) return;
        grupos = lista.registros; actualizarGrupos();
        const datos = recurso === 'alumnos' ? await peticion({ recurso, pagina, ...Object.fromEntries(new FormData(filtros)) }) : lista;
        if (turno !== secuencia) return;
        if (recurso === 'alumnos' && pagina > Math.max(1, Math.ceil(datos.total / 20))) {
            pagina = Math.max(1, Math.ceil(datos.total / 20));
            return cargar();
        }
        registros = datos.registros; total = datos.total ?? registros.length;
        dibujarTabla(); mensaje.textContent = '';
        return true;
    } catch (error) {
        if (turno === secuencia) { mensaje.classList.add('admin-error'); mensaje.textContent = error.message; mensaje.append(' ', boton('Reintentar', cargar)); }
    } finally { if (turno === secuencia) document.querySelector('#admin-nuevo').disabled = false; }
}
function navegar() {
    const dialogo = document.querySelector('#admin-confirmacion');
    if (dialogo.open) dialogo.close('cancelar');
    const hash = window.location.hash;
    const enLista = ['#cuentas', '#grupos'].includes(hash);
    const ayuda = hash === '#ayuda';
    recurso = hash === '#grupos' ? 'grupos' : 'alumnos';
    ++secuencia; cerrarEditor(); pagina = 1;
    panel.hidden = !enLista; document.querySelector('#admin-ayuda').hidden = !ayuda;
    document.querySelectorAll('.welcome-card, main > .section-content:not(#admin-panel):not(#admin-ayuda)').forEach(e => { e.hidden = enLista || ayuda; });
    const titulo = ayuda ? 'Ayuda y orientación' : enLista ? recurso === 'alumnos' ? 'Cuentas de alumnos' : 'Grupos' : 'Panel administrativo';
    document.querySelector('.topbar h1').textContent = titulo; document.querySelector('#admin-title').textContent = titulo;
    document.querySelector('#admin-nuevo').textContent = recurso === 'alumnos' ? 'Registrar alumno' : 'Crear grupo';
    document.querySelector('#admin-description').textContent = recurso === 'alumnos'
        ? 'Busca una cuenta para editar sus datos, cambiar su grupo o administrar su acceso.'
        : 'Organiza tus grupos por semestre y año. En Ver alumnos puedes consultar los integrantes de cada grupo.';
    filtros.hidden = recurso !== 'alumnos';
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        const activo = a.getAttribute('href') === (enLista || ayuda ? hash : '/dashboard-admin');
        a.classList.toggle('active', activo); if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (enLista) cargar();
}
formulario.addEventListener('submit', async e => {
    e.preventDefault(); if (guardando) return;
    const recursoGuardado = recurso;
    const edicion = editando;
    const datos = Object.fromEntries(new FormData(formulario));
    datos.activo = datos.activo === 'true';
    if (recurso === 'alumnos') datos.id_grupo = datos.id_grupo ? Number(datos.id_grupo) : null;
    else {
        datos.periodo = `${datos.anio}-${datos.semestre}`;
        delete datos.anio;
        delete datos.semestre;
    }
    if (edicion) datos.version = edicion.version;
    if (edicion && edicion.activo !== datos.activo && !await confirmarEstado(edicion, datos.activo, recursoGuardado)) return;
    guardando = true;
    formulario.querySelectorAll('button').forEach(b => { b.disabled = true; });
    mensajeForm.classList.remove('admin-error'); mensajeForm.textContent = 'Guardando…';
    const botonGuardar = document.querySelector('#admin-guardar');
    const textoGuardar = botonGuardar.textContent;
    botonGuardar.textContent = 'Guardando…';
    try {
        await peticion({ recurso: recursoGuardado, ...(edicion ? { id: edicion.id_usuario ?? edicion.id_grupo } : {}) }, {
            method: edicion ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
        });
        cerrarEditor();
        if (!panel.hidden) { await cargar(); if (!mensaje.textContent) mensaje.textContent = edicion ? 'Los cambios se guardaron correctamente.' : recursoGuardado === 'alumnos' ? 'Alumno registrado correctamente.' : 'Grupo creado correctamente.'; }
    } catch (error) { mensajeForm.classList.add('admin-error'); mensajeForm.textContent = error.message; }
    finally { guardando = false; formulario.querySelectorAll('button').forEach(b => { b.disabled = false; }); botonGuardar.textContent = textoGuardar; }
});
formulario.elements.activo.addEventListener('change', explicarEstado);
document.querySelector('#admin-nuevo').addEventListener('click', () => abrirEditor());
document.querySelector('#admin-cancelar').addEventListener('click', () => { cerrarEditor(); document.querySelector('#admin-nuevo').focus(); });
filtros.addEventListener('submit', e => { e.preventDefault(); cerrarEditor(); pagina = 1; cargar(); });
filtros.addEventListener('reset', () => { cerrarEditor(); pagina = 1; setTimeout(cargar, 0); });
document.querySelector('#admin-anterior').addEventListener('click', () => { cerrarEditor(); pagina--; cargar(); });
document.querySelector('#admin-siguiente').addEventListener('click', () => { cerrarEditor(); pagina++; cargar(); });
window.addEventListener('hashchange', navegar);
navegar();
