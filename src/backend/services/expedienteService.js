import { listarExpedientes, consultarValoracion, modificarValoracion, eliminarValoracion } from "../repositories/expedienteRepository.js";
import { validarFiltros, validarId, validarVersion, validarEdicion } from "../validators/expedienteValidator.js";

export function crearExpedienteService(repository = { listarExpedientes, consultarValoracion, modificarValoracion, eliminarValoracion }) {
    return {
        async cambiar(idUsuario, query, body, metodo, rol = "Alumno") {
            if (!["Alumno", "Docente"].includes(rol)) throw Object.assign(new Error("Acceso no permitido."), { status: 403 });
            const id = validarId(query.id);
            const version = validarVersion(body);
            const actual = await repository.consultarValoracion(idUsuario, id, undefined, rol);
            if (!actual) throw Object.assign(new Error("Valoración no encontrada."), { status: 404 });
            if (actual.version !== version) throw Object.assign(new Error("La valoración cambió. Recarga el detalle antes de continuar."), { status: 409 });
            const resultado = metodo === "DELETE"
                ? await repository.eliminarValoracion(idUsuario, id, version, undefined, rol)
                : await repository.modificarValoracion(idUsuario, id, validarEdicion(body, actual), undefined, rol);
            if (!resultado) throw Object.assign(new Error("La valoración cambió o ya no está disponible. Recarga la consulta."), { status: 409 });
            return { message: metodo === "DELETE" ? "Valoración eliminada." : "Cambios guardados." };
        },
        async consultar(idUsuario, query = {}, rol = "Alumno") {
            if (!["Alumno", "Docente"].includes(rol)) throw Object.assign(new Error("Acceso no permitido."), { status: 403 });
            if (query.id !== undefined) {
                const id = validarId(query.id);
                const expediente = await repository.consultarValoracion(idUsuario, id, undefined, rol);
                if (!expediente) {
                    const error = new Error("Valoración no encontrada.");
                    error.status = 404;
                    throw error;
                }
                return { expediente };
            }
            const filtros = validarFiltros(query, rol);
            const datos = await repository.listarExpedientes(idUsuario, filtros, undefined, rol);
            return { ...datos, pagina: filtros.pagina, limite: filtros.limite };
        }
    };
}

export const expedienteService = crearExpedienteService();
