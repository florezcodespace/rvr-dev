# Datos de tarjeta en pagos

**Para qué:** el portal registra pagos, pero todavía no cobra (no hay pasarela; se agregará después).

**Decisión (actualizada 2026-10-29):** el formulario pide lo mismo que una pasarela (número completo,
titular, vencimiento, CVV, documento) para validar y detectar el banco, pero solo se envía y se guarda:
banco, franquicia, tipo, últimos 4 dígitos, titular, documento y cuotas.

**Por qué:** guardar el número completo o el CVV obliga a cumplir PCI y es un riesgo si se filtra la base.
Cuando llegue la pasarela (Wompi, ePayco…), ella recibe los datos completos y RvR sigue guardando solo esto.

**Ejemplo:** Davivienda · Mastercard crédito •••• 0000 · Carlos Pérez · CC 80123456 · 6 cuotas.
