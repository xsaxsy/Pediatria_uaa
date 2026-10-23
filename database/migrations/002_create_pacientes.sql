-- 1. Tabla de Pacientes
CREATE TABLE IF NOT EXISTS paciente (
    id_paciente INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    folio VARCHAR(50) NOT NULL UNIQUE, -- Folio automático
    nombre VARCHAR(150) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(20) NOT NULL,
    domicilio TEXT,
    zona VARCHAR(100) NOT NULL -- Campo para filtros de consulta y reportes
);

-- 2. Tabla de Tutores
CREATE TABLE IF NOT EXISTS tutor (
    id_tutor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    parentesco VARCHAR(50) NOT NULL, -- Madre, Padre, Tutor
    telefono VARCHAR(20)
);

-- 3. Tabla Asociativa Paciente-Tutor (Relación N:M)
CREATE TABLE IF NOT EXISTS paciente_tutor (
    id_paciente INTEGER NOT NULL,
    id_tutor INTEGER NOT NULL,
    tutor_principal BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id_paciente, id_tutor),
    CONSTRAINT fk_pt_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    CONSTRAINT fk_pt_tutor FOREIGN KEY (id_tutor) REFERENCES tutor(id_tutor) ON DELETE CASCADE
);