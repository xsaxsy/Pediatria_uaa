-- 1. Tabla de Valoraciones / Expedientes
CREATE TABLE IF NOT EXISTS valoracion (
    id_valoracion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_paciente INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL, -- Alumno responsable de la captura
    fecha_valoracion DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'completado', -- API actual; futuros estados: borrador, validado
    nivel_riesgo VARCHAR(30) NULL, -- Bajo, Medio, Alto (Semáforo)
    observaciones_supervisor TEXT NULL, -- Retroalimentación docente en validación
    validado_por INTEGER NULL, -- Profesor/Supervisor que valida
    CONSTRAINT fk_val_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE RESTRICT,
    CONSTRAINT fk_val_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT fk_val_validador FOREIGN KEY (validado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- 2. Tabla de Consentimiento Informado
CREATE TABLE IF NOT EXISTS consentimiento (
    id_consentimiento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_valoracion INTEGER NOT NULL,
    id_tutor INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL,
    ruta_firma VARCHAR(255) NULL, -- Ruta o nombre del archivo de firma digital
    CONSTRAINT fk_con_valoracion FOREIGN KEY (id_valoracion) REFERENCES valoracion(id_valoracion) ON DELETE CASCADE,
    CONSTRAINT fk_con_tutor FOREIGN KEY (id_tutor) REFERENCES tutor(id_tutor) ON DELETE RESTRICT
);

-- 3. Tabla de Respuestas Capturadas
CREATE TABLE IF NOT EXISTS respuesta (
    id_respuesta INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_valoracion INTEGER NOT NULL,
    id_pregunta INTEGER NOT NULL,
    id_opcion INTEGER NULL,
    respuesta_texto TEXT NULL,
    respuesta_numero NUMERIC NULL, -- Frecuencias, tomas en 24 horas, edad de dentición, etc.
    CONSTRAINT fk_resp_valoracion FOREIGN KEY (id_valoracion) REFERENCES valoracion(id_valoracion) ON DELETE CASCADE,
    CONSTRAINT fk_resp_pregunta FOREIGN KEY (id_pregunta) REFERENCES pregunta(id_pregunta) ON DELETE RESTRICT,
    CONSTRAINT fk_resp_opcion FOREIGN KEY (id_opcion) REFERENCES opcion_respuesta(id_opcion) ON DELETE SET NULL
);
-- Representación utilizada por api/valoraciones.js:
-- select/multiple: una fila por opción seleccionada, con id_opcion.
-- text/date: respuesta_texto; number: respuesta_numero y su texto.
-- Las alternativas aceptan NULL porque no se usan todas simultáneamente.
-- Una pregunta de selección múltiple puede generar varias filas: no agregar
-- UNIQUE (id_valoracion, id_pregunta).
-- Un paciente puede tener varias valoraciones: id_paciente no es único.
-- Los campos ocultos/deshabilitados por edad no deben enviarse desde el cliente.
