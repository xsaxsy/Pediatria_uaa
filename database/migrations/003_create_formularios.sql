-- 1. Tabla de Secciones de la Guía
CREATE TABLE IF NOT EXISTS seccion (
    id_seccion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    orden INTEGER NOT NULL
);

-- 2. Tabla de Preguntas
CREATE TABLE IF NOT EXISTS pregunta (
    id_pregunta INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_seccion INTEGER NOT NULL,
    enunciado TEXT NOT NULL,
    tipo_respuesta VARCHAR(50) NOT NULL, -- text, date, radio, check, frequency, textarea
    obligatoria BOOLEAN NOT NULL DEFAULT TRUE,
    orden INTEGER NOT NULL,
    CONSTRAINT fk_pregunta_seccion FOREIGN KEY (id_seccion) REFERENCES seccion(id_seccion) ON DELETE CASCADE
);

-- 3. Tabla de Opciones de Respuesta
CREATE TABLE IF NOT EXISTS opcion_respuesta (
    id_opcion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pregunta INTEGER NOT NULL,
    texto TEXT NOT NULL,
    orden INTEGER NOT NULL,
    CONSTRAINT fk_opcion_pregunta FOREIGN KEY (id_pregunta) REFERENCES pregunta(id_pregunta) ON DELETE CASCADE
);

-- Alinea instalaciones con tablas parciales creadas antes de esta versión.
ALTER TABLE seccion
    ADD COLUMN IF NOT EXISTS nombre VARCHAR(150),
    ADD COLUMN IF NOT EXISTS orden INTEGER;
ALTER TABLE pregunta
    ADD COLUMN IF NOT EXISTS id_seccion INTEGER,
    ADD COLUMN IF NOT EXISTS enunciado TEXT,
    ADD COLUMN IF NOT EXISTS tipo_respuesta VARCHAR(50),
    ADD COLUMN IF NOT EXISTS obligatoria BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS orden INTEGER;
ALTER TABLE opcion_respuesta
    ADD COLUMN IF NOT EXISTS id_pregunta INTEGER,
    ADD COLUMN IF NOT EXISTS texto TEXT,
    ADD COLUMN IF NOT EXISTS orden INTEGER;

-- Claves estables para que la API reutilice secciones y preguntas en altas sucesivas.
CREATE UNIQUE INDEX IF NOT EXISTS uq_seccion_nombre
    ON seccion (nombre);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pregunta_seccion_enunciado
    ON pregunta (id_seccion, enunciado);

CREATE UNIQUE INDEX IF NOT EXISTS uq_opcion_pregunta_texto
    ON opcion_respuesta (id_pregunta, texto);
