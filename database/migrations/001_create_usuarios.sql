-- Tabla de roles
CREATE TABLE IF NOT EXISTS rol (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- Tabla de grupos académicos
CREATE TABLE IF NOT EXISTS grupo (
    id_grupo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    periodo VARCHAR(30) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_grupo_nombre_periodo
        UNIQUE (nombre, periodo)
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol INTEGER NOT NULL,
    id_grupo INTEGER NULL,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES rol(id_rol)
        ON DELETE RESTRICT,

    CONSTRAINT fk_usuario_grupo
        FOREIGN KEY (id_grupo)
        REFERENCES grupo(id_grupo)
        ON DELETE RESTRICT
);

-- Índices para las relaciones
CREATE INDEX IF NOT EXISTS idx_usuario_id_rol
    ON usuario(id_rol);

CREATE INDEX IF NOT EXISTS idx_usuario_id_grupo
    ON usuario(id_grupo);
