-- Conserva el titular disponible el día de la migración para las cotizaciones anteriores.
BEGIN;
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS razon_social varchar(180),
                    ADD COLUMN IF NOT EXISTS nit_empresa varchar(11);
ALTER TABLE cliente DROP CONSTRAINT IF EXISTS ck_cliente_empresa;
ALTER TABLE cliente ADD CONSTRAINT ck_cliente_empresa CHECK (
    (razon_social IS NULL AND nit_empresa IS NULL) OR
    (razon_social IS NOT NULL AND trim(razon_social) <> '' AND nit_empresa IS NOT NULL AND nit_empresa ~ '^[0-9]{9}(-[0-9])?$')
  );
ALTER TABLE cotizacion ADD COLUMN IF NOT EXISTS titular_nombre varchar(201),
  ADD COLUMN IF NOT EXISTS titular_documento varchar(50),
  ADD COLUMN IF NOT EXISTS titular_tipo_documento varchar(10);
UPDATE cotizacion q SET titular_nombre = trim(c.nombres || ' ' || c.apellidos),
  titular_documento = c.documento_identidad, titular_tipo_documento = c.tipo_documento
  FROM cliente c WHERE q.cliente_id = c.id AND q.titular_nombre IS NULL;
ALTER TABLE cotizacion ALTER COLUMN titular_nombre SET NOT NULL,
  ALTER COLUMN titular_documento SET NOT NULL, ALTER COLUMN titular_tipo_documento SET NOT NULL;
DROP TRIGGER IF EXISTS guardar_titular_cotizacion ON cotizacion;
CREATE OR REPLACE FUNCTION fn_titular_cotizacion() RETURNS trigger AS $$
BEGIN
  SELECT coalesce(c.razon_social, trim(c.nombres || ' ' || c.apellidos)),
         coalesce(c.nit_empresa, c.documento_identidad),
         CASE WHEN c.razon_social IS NULL THEN c.tipo_documento ELSE 'NIT' END
    INTO STRICT NEW.titular_nombre, NEW.titular_documento, NEW.titular_tipo_documento
    FROM cliente c WHERE c.id = NEW.cliente_id FOR SHARE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guardar_titular_cotizacion BEFORE INSERT ON cotizacion
FOR EACH ROW EXECUTE FUNCTION fn_titular_cotizacion();
COMMIT;
