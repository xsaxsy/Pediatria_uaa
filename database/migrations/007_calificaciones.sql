-- Ejecutar después de las migraciones 001 a 006 en la base correspondiente.
-- Una evaluación por valoración; NULL significa que aún no se ha calificado.
-- Los permisos de alumno y docente se comprueban en la aplicación, que usa
-- una sola conexión de base de datos; esta migración no crea roles SQL.
ALTER TABLE valoracion ADD COLUMN IF NOT EXISTS calificacion NUMERIC;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
        WHERE conname = 'valoracion_calificacion_rango' AND conrelid = 'valoracion'::regclass) THEN
        ALTER TABLE valoracion ADD CONSTRAINT valoracion_calificacion_rango
            CHECK (calificacion IS NULL OR (calificacion >= 0 AND calificacion <= 10));
    END IF;
END; $$;
