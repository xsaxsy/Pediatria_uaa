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