# Auditoría de privacidad y clasificación del catálogo

Fecha de revisión: 18 de octubre de 2026.

## Alcance técnico comprobado

- No hay formularios públicos, cuentas de clientes, pagos en línea, analítica ni píxeles publicitarios en el código revisado.
- El carrito se conserva en `localStorage` bajo la clave `nela-cart` y no se envía al servidor hasta que la persona decide continuar por WhatsApp.
- Los pedidos y consultas se coordinan en WhatsApp; Instagram es un enlace externo.
- El panel administrativo usa identidad de ChatGPT Sites y una lista cerrada de cuentas autorizadas.
- Sanity está preparado para catálogo e inventario, pero este entorno no contiene credenciales verificables de producción.
- No se agregó un banner de cookies porque no existe una herramienta opcional que bloquear. Si se añade analítica o publicidad, deberá implementarse consentimiento efectivo antes de cargarla.

## Datos pendientes para la política definitiva

- Identidad legal del responsable, identificación/NIT y domicilio.
- Correo oficial para consultas y reclamos.
- Persona o área que tramitará solicitudes.
- Plazos internos de conservación y eliminación.
- Proveedores definitivos, roles, ubicaciones, contratos y condiciones de transferencia o transmisión internacional.
- Procedimiento interno para documentar autorizaciones de mercadeo si esa finalidad llega a utilizarse.

## Clasificación de Accesorios de Plata

Se añadieron campos opcionales para público, tipo de joya, tallas de anillo, largos, tejido, motivo y piedra. Los filtros solo aparecen cuando hay valores disponibles.

Las 15 referencias locales son demostrativas. A petición de la responsable del proyecto se clasificaron por el tipo expresado explícitamente en sus nombres comerciales para probar el filtro:

1. Collar Bruma
2. Cadena Alba
3. Dije Rocío
4. Aretes Niebla
5. Pulsera Celeste
6. Anillo Nácar
7. Tobillera Luna
8. Ear Cuff Prisma
9. Collar Lirio
10. Cadena Horizonte
11. Dije Estrella
12. Aretes Gota
13. Pulsera Trama
14. Anillo Cuarzo
15. Collar Marea

Esta clasificación local no sustituye la revisión de las referencias reales en Sanity. Para cada producto real se debe confirmar, como mínimo, el tipo de joya. El público debe quedar vacío si no existe una clasificación comercial documentada. `Unisex` solo debe seleccionarse cuando NELA lo haya definido expresamente. Dijes y cadenas permanecen como tipos independientes; la inclusión de cadena en un dije no se presume.
