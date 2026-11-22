-- Datos por método de pago en los comprobantes y PSE como método nuevo.
-- Para una base ya montada (montar-base.bat ya trae estos cambios).
-- Se puede correr varias veces.
ALTER TABLE comprobante_pago ADD COLUMN IF NOT EXISTS detalle_pago jsonb;

ALTER TABLE comprobante_pago DROP CONSTRAINT IF EXISTS ck_comprobante_metodo;
ALTER TABLE comprobante_pago ADD CONSTRAINT ck_comprobante_metodo CHECK (metodo_pago IN
  ('Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'PSE', 'Tarjeta'));

ALTER TABLE abonos DROP CONSTRAINT IF EXISTS ck_abono_metodo;
ALTER TABLE abonos ADD CONSTRAINT ck_abono_metodo CHECK (metodo_pago IN
  ('Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'PSE', 'Tarjeta'));

-- 2026-10-29 · Los abonos que registra RvR también guardan los datos del método.
ALTER TABLE abonos ADD COLUMN IF NOT EXISTS detalle_pago jsonb;
