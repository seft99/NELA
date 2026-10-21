# Auditoría técnica integral — 21 de octubre de 2026

## Alcance y resultado

Se revisaron la arquitectura App Router, catálogo, fichas, carrito y WhatsApp, inventario, APIs, autenticación, Sanity, SEO, accesibilidad, seguridad, dependencias y builds de Sites/Vinext y Vercel. No se ejecutaron migraciones reales, no se modificaron secretos, no se escribió en `production`, no se hizo push ni despliegue.

## Hallazgos priorizados

### Resueltos

- **Crítico — dependencias vulnerables:** `next` se actualizó de `16.3.4` a `16.4.2` y el override de `sharp` a `0.35.5`. `pnpm audit --prod` finalizó con cero vulnerabilidades conocidas.
- **Alto — build incompatible con Vercel:** `npm run build` detecta `VERCEL=1` y usa Next.js oficial; el flujo existente de Sites/Vinext se conserva. Ambos builds pasan.
- **Alto — suplantación del administrador en Vercel:** las cabeceras de identidad de ChatGPT Sites ya no se aceptan cuando `VERCEL=1`. El panel y su API fallan de forma cerrada hasta integrar autenticación real.
- **Medio — concurrencia de inventario:** las mutaciones de Sanity ahora usan la revisión leída (`ifRevisionID`) para evitar sobrescribir silenciosamente cambios simultáneos.
- **Medio — robustez de APIs:** se añadieron límites de tamaño, comprobación de JSON, respuestas `no-store`, `nosniff` y timeouts en Sanity.
- **Medio — tests inestables en Windows:** cada prueba Vite usa una caché temporal separada; ya no compite con el servidor local ni con `node_modules/.vite`.
- **Medio — SEO técnico:** robots excluye administración y APIs, el sitemap solo usa rutas públicas y no inventa fechas, las demos no se indexan como productos, y los productos reales pueden emitir `Product` JSON-LD. Se añadió información estructurada de la organización.
- **Medio — resiliencia y móvil:** se añadieron estados globales de carga/error y refuerzos contra desbordamiento de títulos, grillas y controles móviles.
- **Bajo — documentación y paquetes:** se eliminó el lockfile npm obsoleto, se declaró pnpm como gestor oficial y se corrigió la explicación antigua de “pedido copiado”.

### Pendientes que requieren decisión o información externa

- **Alto — autenticación administrativa en Vercel:** elegir e integrar un proveedor de identidad; hasta entonces el panel debe seguir deshabilitado allí.
- **Medio — confidencialidad de inventario:** un dataset público de Sanity permite consultar directamente los documentos publicados, incluidas cantidades internas. La UI las omite, pero eso no vuelve secreto el dato. Para confidencialidad real se necesita dataset privado y lectura exclusivamente del servidor, lo cual cambia la decisión vigente de usar datasets públicos.
- **Medio — limitación distribuida de peticiones:** una función serverless no debe usar contadores en memoria. Si el tráfico o abuso lo exige, hace falta un servicio compartido compatible con Vercel.
- **Contenido/comercio:** faltan dominio definitivo, correo oficial, productos y fotografías reales, políticas aprobadas de envíos/cambios/pagos/privacidad e identidad legal de la responsable.
- **Mantenimiento bajo:** hay componentes UI y dependencias de plantilla que no usa la tienda. No se eliminaron sin una prueba dedicada de árbol de dependencias para evitar regresiones.

## Integridad comprobada

- Los productos ocultos no salen de la consulta pública ni de sitemap; una URL inexistente u oculta termina en 404.
- La disponibilidad pública deriva de `stock`, `purchaseEnabled` y `visible`; el stock numérico se elimina de los objetos públicos.
- El checkout valida nuevamente el inventario en el servidor y mantiene nombre, referencia, categoría, variantes, cantidad, unitario, subtotal y URL pública en WhatsApp.
- La API administrativa vuelve a comprobar identidad y lista permitida en cada lectura/escritura, exige mismo origen y rechaza campos adicionales.
- La migración demo conserva destino explícito, dry run sin escrituras y bloqueo de `production`.

## Comandos verificados

Todos terminaron con código `0`:

```text
npm run typecheck
npm run lint
npm run test:inventory
npm run test:catalog
npm run test:cart
npm run test:migration
npm run build
npm run build:vercel
pnpm audit --prod
```

La auditoría de producción reportó `0` vulnerabilidades conocidas. El build Sites/Vinext y el build Next.js 16.4.2 para Vercel compilaron correctamente.

## Checklist previo a publicación

1. Cargar únicamente productos reales en `production` y revisar slugs, imágenes, precios, variantes y existencias.
2. Configurar `NEXT_PUBLIC_SITE_URL` con el dominio final y usar `NEXT_PUBLIC_SANITY_DATASET=production` solo en producción.
3. Configurar el token Editor únicamente si habrá escrituras del servidor; nunca con prefijo `NEXT_PUBLIC_`.
4. Definir autenticación administrativa para Vercel antes de habilitar el panel.
5. Completar correo oficial y políticas legales/comerciales.
6. Repetir toda la suite, revisar Preview de Vercel y hacer pruebas reales de WhatsApp en Android/iOS antes de promover a producción.
