-- Compatibilidad e idempotencia para instalaciones que ya tenían tablas
-- parciales de una versión anterior. Ejecutar después de las migraciones 002–004.

-- Pacientes y tutores: API de altas.
ALTER TABLE paciente
    ADD COLUMN IF NOT EXISTS folio VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nombre VARCHAR(150),
    ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
    ADD COLUMN IF NOT EXISTS sexo VARCHAR(20),
    ADD COLUMN IF NOT EXISTS domicilio TEXT,
    ADD COLUMN IF NOT EXISTS zona VARCHAR(100);

ALTER TABLE paciente ALTER COLUMN zona DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_paciente_folio ON paciente (folio);

ALTER TABLE tutor
    ADD COLUMN IF NOT EXISTS nombre VARCHAR(150),
    ADD COLUMN IF NOT EXISTS parentesco VARCHAR(50),
    ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

ALTER TABLE paciente_tutor
    ADD COLUMN IF NOT EXISTS id_paciente INTEGER,
    ADD COLUMN IF NOT EXISTS id_tutor INTEGER,
    ADD COLUMN IF NOT EXISTS tutor_principal BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_paciente_tutor_relacion
    ON paciente_tutor (id_paciente, id_tutor);

-- Valoraciones: agrega las columnas que CREATE TABLE IF NOT EXISTS no añade
-- cuando la tabla viene de una instalación anterior.
ALTER TABLE valoracion
    ADD COLUMN IF NOT EXISTS id_paciente INTEGER,
    ADD COLUMN IF NOT EXISTS id_usuario INTEGER,
    ADD COLUMN IF NOT EXISTS fecha_valoracion DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'completado',
    ADD COLUMN IF NOT EXISTS nivel_riesgo VARCHAR(30),
    ADD COLUMN IF NOT EXISTS observaciones_supervisor TEXT,
    ADD COLUMN IF NOT EXISTS validado_por INTEGER;

ALTER TABLE valoracion ALTER COLUMN fecha_valoracion SET DEFAULT CURRENT_DATE;
ALTER TABLE valoracion ALTER COLUMN fecha_valoracion SET NOT NULL;
ALTER TABLE valoracion ALTER COLUMN estado SET DEFAULT 'completado';
ALTER TABLE valoracion ALTER COLUMN estado SET NOT NULL;

-- En esquemas anteriores estos campos podían ser obligatorios aunque la API
-- nueva ya almacena la información normalizada en paciente/respuesta.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'valoracion' AND column_name = 'paciente_nombre') THEN
        ALTER TABLE valoracion ALTER COLUMN paciente_nombre DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'valoracion' AND column_name = 'datos') THEN
        ALTER TABLE valoracion ALTER COLUMN datos DROP NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_val_paciente') THEN
        ALTER TABLE valoracion ADD CONSTRAINT fk_val_paciente
            FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_val_usuario') THEN
        ALTER TABLE valoracion ADD CONSTRAINT fk_val_usuario
            FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_val_validador') THEN
        ALTER TABLE valoracion ADD CONSTRAINT fk_val_validador
            FOREIGN KEY (validado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
    END IF;
END $$;

-- Formularios: estos índices son requeridos por los ON CONFLICT de la API.
CREATE UNIQUE INDEX IF NOT EXISTS uq_seccion_nombre ON seccion (nombre);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pregunta_seccion_enunciado
    ON pregunta (id_seccion, enunciado);
CREATE UNIQUE INDEX IF NOT EXISTS uq_opcion_pregunta_texto
    ON opcion_respuesta (id_pregunta, texto);

-- Respuestas de la valoración. Los campos alternativos deben aceptar NULL:
-- cada respuesta usa texto, número u opción seleccionada según su tipo.
ALTER TABLE respuesta
    ADD COLUMN IF NOT EXISTS id_valoracion INTEGER,
    ADD COLUMN IF NOT EXISTS id_pregunta INTEGER,
    ADD COLUMN IF NOT EXISTS id_opcion INTEGER,
    ADD COLUMN IF NOT EXISTS respuesta_texto TEXT,
    ADD COLUMN IF NOT EXISTS respuesta_numero NUMERIC;

ALTER TABLE respuesta ALTER COLUMN id_opcion DROP NOT NULL;
ALTER TABLE respuesta ALTER COLUMN respuesta_texto DROP NOT NULL;
ALTER TABLE respuesta ALTER COLUMN respuesta_numero DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_resp_valoracion') THEN
        ALTER TABLE respuesta ADD CONSTRAINT fk_resp_valoracion
            FOREIGN KEY (id_valoracion) REFERENCES valoracion(id_valoracion) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_resp_pregunta') THEN
        ALTER TABLE respuesta ADD CONSTRAINT fk_resp_pregunta
            FOREIGN KEY (id_pregunta) REFERENCES pregunta(id_pregunta) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_resp_opcion') THEN
        ALTER TABLE respuesta ADD CONSTRAINT fk_resp_opcion
            FOREIGN KEY (id_opcion) REFERENCES opcion_respuesta(id_opcion) ON DELETE SET NULL;
    END IF;
END $$;
