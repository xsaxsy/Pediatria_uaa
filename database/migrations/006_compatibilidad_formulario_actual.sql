-- Ejecutar solo con aprobación de la responsable de base de datos.
-- Aplicar después de 001–005, también si ya se ejecutaron anteriormente.
-- El formulario actual guarda detalles condicionales como preguntas adicionales.
-- No necesita columnas nuevas para higiene, alimentación, dentición o menarquia.
-- La API registra explícitamente obligatoria = FALSE y estado = 'completado'.
-- Estos defaults mantienen coherentes las inserciones que omitan esos campos.
-- No se actualizan filas existentes ni se eliminan preguntas/opciones históricas.
BEGIN;
ALTER TABLE pregunta ALTER COLUMN obligatoria SET DEFAULT FALSE;
ALTER TABLE valoracion ALTER COLUMN estado SET DEFAULT 'completado';
COMMIT;
