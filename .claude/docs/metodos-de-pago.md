# Métodos de pago

**Para qué:** registrar cómo se pagó, con los datos de cada método. Se usa en dos lugares:
- Cliente: detalle de la orden → **Reportar un pago** (`frontend/src/features/portal/pages/MiOrdenPage.tsx`).
- Admin: **Registrar abono** (`frontend/src/features/ventas/Modales.tsx`), desde Orden, Venta y Abonos.

**Pasos de la pantalla**
1. "Elige cómo pagar": Recomendados (Nequi, PSE), Tarjetas (crédito, débito), Otros (Daviplata, transferencia, efectivo).
   El cliente ve el efectivo deshabilitado.
2. Datos del método. Con tarjeta: vista de la tarjeta, número, titular, vencimiento, CVV, documento y cuotas (crédito).

| Opción | Datos | Referencia |
|---|---|---|
| Tarjeta crédito/débito | banco (auto por BIN), franquicia, últimos 4, titular, documento, cuotas | n.º de aprobación, opcional |
| Nequi / Daviplata | celular, titular | obligatoria |
| PSE | banco, titular, documento | CUS, obligatorio |
| Transferencia | banco | opcional |
| Efectivo | — | opcional |

**Qué se guarda de una tarjeta:** banco, franquicia, tipo, últimos 4, titular, documento, cuotas.
El número completo, el vencimiento y el CVV nunca salen del navegador (no hay pasarela todavía).

**Archivos**
- Web: `frontend/src/shared/components/pago/` (`reglas.ts`, `ElegirMetodo.tsx`, `DatosDelPago.tsx`, `opciones.tsx`).
- Detección: `frontend/src/shared/lib/tarjetas/` (franquicia, Luhn, vencimiento; `bins-colombia.ts` = BIN → banco).
- API: `backend/src/utils/pagos.ts` (mismas reglas; si cambias una, cambia la otra). Columna `detalle_pago jsonb` en `abonos` y `comprobante_pago`.

**Actualizar la tabla de bancos (BIN)**
1. Descargar `bin-list-data.csv` de https://github.com/venelinkochev/bin-list-data (CC-BY-4.0) a una carpeta aparte.
2. `node frontend/scripts/generar-bins.cjs <ruta-del-csv> frontend/src/shared/lib/tarjetas/bins-colombia.ts`

**Ejemplo:** 4093 55… → Nequi · Visa · Débito. 5123 92… → Davivienda · Mastercard · Crédito.
