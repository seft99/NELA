# Pruebas del panel privado de inventario

El panel se encuentra en `/admin/inventario`. La página y la API comprueban la identidad de ChatGPT en el servidor; la lista autorizada nunca se decide en el navegador.

## Requisitos reales

Para probar guardados persistentes se necesitan estos datos del proyecto Sanity de NELA:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: identificador del proyecto.
- `NEXT_PUBLIC_SANITY_DATASET`: `development` para las pruebas; `production` queda reservado para productos reales.
- `SANITY_API_WRITE_TOKEN`: único secreto de Sanity, con rol Editor para el panel y las migraciones.

Los tokens se configuran como secretos del hosting y nunca deben enviarse por chat, guardarse en Git ni usar el prefijo `NEXT_PUBLIC_`.

La producción también requiere una de estas listas del servidor:

- `INVENTORY_ADMIN_EMAILS`: correos autorizados separados por coma.
- `INVENTORY_ADMIN_USER_IDS`: identificadores estables autorizados separados por coma.

## Prueba local de permisos

El entorno local de Sites usa el usuario simulado `seedy@sites.test`. Desde la raíz del proyecto, copia el archivo de ejemplo:

```powershell
Copy-Item .env.example .env.local
```

Edita `.env.local` —que Git ignora— y completa:

```dotenv
INVENTORY_ADMIN_EMAILS=seedy@sites.test
NEXT_PUBLIC_SANITY_PROJECT_ID=0l7ykvj6
NEXT_PUBLIC_SANITY_DATASET=development
SANITY_API_WRITE_TOKEN=TOKEN_REAL
```

Después inicia el sitio:

```powershell
npm run dev
```

Abre `http://127.0.0.1:5173/admin/inventario`.

Para comprobar el rechazo, cambia temporalmente en `.env.local` el correo por uno distinto. El servidor se reinicia al guardar; si no lo hace, detenlo y ejecuta de nuevo `npm run dev`:

```dotenv
INVENTORY_ADMIN_EMAILS=no-autorizado@example.com
```

La página debe mostrar “Esta cuenta no administra el inventario” y `GET /api/admin/inventory` debe responder `403`. Sin identidad, la API responde `401`.

## Prueba funcional del panel

Con la cuenta autorizada y Sanity configurado:

1. Busca un producto por nombre o referencia.
2. Cambia el stock a un entero positivo y guarda. Debe aparecer la confirmación y conservarse después de recargar.
3. Intenta introducir un valor negativo. La interfaz lo limita a cero y la API rechaza valores negativos enviados manualmente.
4. Deja el stock en cero. La tienda debe mostrar “Agotado” y desactivar “Agregar al carrito” y “Comprar ahora”.
5. Restaura stock, desactiva “Compra habilitada” y guarda. El producto puede seguir visible, pero no debe poder comprarse.
6. Desactiva “Visible en el catálogo” y guarda. El producto debe desaparecer de listados, búsqueda, destacados y su URL pública debe devolver 404.
7. Reactiva la visibilidad. La compra seguirá dependiendo del stock y de “Compra habilitada”.
8. En un producto con variantes, cambia una variante y confirma que el total se recalcula y persiste.
9. Añade un producto al carrito, cambia su estado desde el panel y vuelve al carrito. Antes de abrir WhatsApp debe bloquearse el pedido y explicar el problema.

Abrir o enviar un mensaje de WhatsApp no descuenta existencias. La propietaria actualiza el stock únicamente después de confirmar una venta real.

## Verificación técnica

Ejecuta:

```powershell
npm run typecheck
npm run lint
npm run test:catalog
npm run test:cart
npm run test:inventory
npm run test:migration
npm run build
```

Las respuestas administrativas incluyen `Cache-Control: private, no-store`; las escrituras requieren sesión autorizada, mismo origen, JSON válido y únicamente aceptan `stock`, `purchaseEnabled`, `visible` e inventario de variantes.
