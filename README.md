# NELA Joyería

Sitio boutique en español para NELA Joyería. Está construido con Next.js (App Router), TypeScript estricto, Tailwind CSS 4 y el runtime de Sites/Vinext para Cloudflare.

## Estado actual

- Home editorial responsive.
- Tienda pública enfocada exclusivamente en Accesorios de Plata Ley 925.
- Búsqueda, filtro de disponibilidad y ordenamiento.
- Fichas de producto con galería y relacionados.
- Jerarquía pública para joyería: material, acabado y medidas únicamente cuando están verificados.
- Carrito lateral con cantidades, variantes, persistencia local y resumen en COP.
- Compra directa y checkout del carrito por WhatsApp, sin pagos ni confirmaciones automáticas.
- Estado seguro de catálogo no disponible cuando Sanity falta o no responde; nunca usa demos como fallback.
- Integración de catálogo Sanity mediante su API pública de lectura.
- Panel privado y restringido para inventario, disponibilidad y visibilidad.
- Studio de Sanity preparado como proyecto independiente en `studio/`.
- WhatsApp e Instagram oficiales configurados como únicos canales públicos de contacto.
- SEO base, sitemap, robots, metadatos Open Graph y página 404.

El paquete de inventario real se valida localmente antes de cualquier escritura. Las composiciones editoriales del diseño son independientes del catálogo y no se utilizan como sustituto de productos reales.

El modelo administrativo conserva los registros y categorías históricas para evitar pérdida de información y permitir migraciones controladas. La navegación, el catálogo y las fichas públicas solo exponen productos de `accesorios-plata`; las rutas antiguas de skincare y manillas de oro redirigen al catálogo vigente.

La migración del inventario real se documenta en `docs/migracion-inventario-production.md`. El código público no usa fixtures demo como fallback; esos datos permanecen aislados para pruebas y para el migrador histórico de `development`.

## Desarrollo local

Requisitos: Node.js 22.13 o superior.

```bash
npm install
npm run dev
```

El repositorio usa exclusivamente pnpm (`pnpm-lock.yaml`). Para una instalación reproducible de CI ejecuta `npm run install:ci`; no generes ni confirmes un `package-lock.json` adicional.

Abre la URL local que imprime el terminal. Para validar antes de publicar:

```bash
npm run typecheck
npm run build
```

## Configuración

1. Copia `.env.example` como `.env.local`.
2. Completa únicamente datos oficiales.
3. Reinicia el servidor local después de cambiar variables.

Variables importantes:

- `NEXT_PUBLIC_SITE_URL`: dominio público final (`https://nelajoyeria.vercel.app`), usado en metadatos, sitemap y enlaces de producto enviados por WhatsApp. Los dominios antiguos de ChatGPT Sites se rechazan para evitar redirecciones incorrectas.
- `NEXT_PUBLIC_BUSINESS_EMAIL`: reserva técnica para una futura dirección verificada; no se muestra públicamente.
- `NEXT_PUBLIC_SANITY_PROJECT_ID`: ID del proyecto Sanity.
- `NEXT_PUBLIC_SANITY_DATASET`: `development` para demos locales; `production` queda reservado para productos reales.
- `SANITY_MIGRATION_DATASET`: destino explícito y exclusivo del migrador real; debe ser `production`.
- `SANITY_API_VERSION`: versión estable para consultas.
- `SANITY_API_WRITE_TOKEN`: secreto del servidor para guardar inventario en Sanity. No debe usar el prefijo `NEXT_PUBLIC_` ni incluirse en commits.
- `INVENTORY_ADMIN_EMAILS`: correos de las cuentas ChatGPT autorizadas, separados por coma.
- `INVENTORY_ADMIN_USER_IDS`: alternativa o complemento de IDs de usuario autorizados, separados por coma.

El proyecto gratuito usa dos datasets públicos: `development` contiene únicamente demostraciones y `production` queda reservado para productos reales. Las lecturas públicas no requieren token. El único secreto de Sanity es el token Editor `SANITY_API_WRITE_TOKEN`, utilizado exclusivamente en el servidor para inventario, migraciones y assets. Las respuestas del sitio eliminan `stock` y `variantInventory`, aunque los campos publicados en un dataset público siguen siendo consultables directamente mediante la API de Sanity.

## Gestión privada de inventario

El panel está disponible en `/admin/inventario`. La propietaria inicia sesión con ChatGPT y el backend compara su correo o ID estable con las listas de autorización del entorno. Ocultar botones no se usa como control de seguridad: tanto la lectura administrativa como cada escritura vuelven a verificar la sesión y la lista permitida en el servidor.

La guía reproducible para validar cuentas autorizadas, rechazos y cambios persistentes está en [`docs/pruebas-panel-inventario.md`](docs/pruebas-panel-inventario.md).

Desde el panel se puede:

- Buscar por nombre o referencia y filtrar por categoría.
- Aumentar, disminuir o escribir existencias exactas, también por variante configurada.
- Pausar o reactivar compras sin ocultar el producto.
- Ocultar o restaurar el producto público sin borrarlo.

No existen controles ni endpoints para crear o eliminar productos, cambiar precios, descripciones, imágenes, categorías, referencias o ajustes del sitio. La validación rechaza campos adicionales, números negativos, decimales, variantes duplicadas y variantes inexistentes. Las peticiones de escritura también exigen el mismo origen del sitio.

### Configuración inicial del panel

1. Configura el proyecto `0l7ykvj6` y el dataset apropiado: `development` para pruebas o `production` para el catálogo real.
2. Crea un único token Editor para `SANITY_API_WRITE_TOKEN` y guárdalo como secreto del servidor.
3. Añade el correo oficial de la propietaria a `INVENTORY_ADMIN_EMAILS` o su ID estable a `INVENTORY_ADMIN_USER_IDS`.
4. Reinicia el entorno local o vuelve a desplegar una única vez para aplicar los secretos. A partir de allí, los cambios de inventario no requieren despliegues.

Si faltan la cuenta autorizada o la conexión de escritura, el panel falla de forma cerrada: no concede acceso ni simula guardados. El proyecto reutiliza Sanity y la autenticación del hosting, por lo que no añade una segunda base de datos, otro CMS ni una dependencia de pago. El costo real sigue sujeto al plan y consumo de la cuenta Sanity existente.

El modelo mantiene tres propiedades independientes: `stock`, `purchaseEnabled` y `visible`. Un producto solo puede comprarse si tiene existencias, las compras están habilitadas y permanece visible. Para productos con inventario por variante, el stock total se recalcula desde sus líneas y no puede editarse por separado.

El catálogo consulta Sanity sin caché persistente, de modo que una actualización guardada se refleja en la siguiente solicitud pública sin que la propietaria toque código o active un despliegue. Antes de agregar, comprar directamente o generar un pedido de carrito, una ruta pública de solo validación comprueba el inventario vigente; nunca devuelve credenciales ni permite escribir. Abrir WhatsApp no descuenta inventario porque sigue siendo una consulta, no una venta confirmada.

## Carrito y pedidos por WhatsApp

El carrito se administra con `CartProvider` (`context/cart-context.tsx`) y se guarda en `localStorage` bajo la clave `nela-cart`. El contenido persistido utiliza un esquema versionado y se valida antes de restaurarse. Al cargar la página, cada línea se reconcilia con el catálogo vigente: el precio se actualiza y los productos eliminados, no disponibles o con opciones obsoletas se señalan y bloquean el envío del pedido.

El número oficial de destino (`573156951945`) y el perfil de Instagram (`@nela_joyeria`) se centralizan en `config/site.ts`. Todos los botones de asesoría, compra directa y checkout reutilizan esa configuración. Si el número deja de ser válido, los enlaces de WhatsApp se deshabilitan para evitar destinos rotos.

Los subtotales se calculan con los precios numéricos vigentes del catálogo y se formatean en pesos colombianos. El envío permanece como “Por confirmar”. `lib/cart/whatsapp-checkout.ts` genera el mensaje con nombres, cantidades, variantes, referencias y valores reales. Abrir WhatsApp no envía el mensaje, no vacía el carrito y no confirma la compra: el cliente todavía debe pulsar Enviar en WhatsApp.

Cada producto del mensaje incluye su URL pública de detalle, construida desde `NEXT_PUBLIC_SITE_URL`. Direcciones locales o privadas se omiten automáticamente para no enviar enlaces de desarrollo a los clientes. Las fichas exponen metadatos Open Graph con título, descripción, imagen y URL pública para permitir vistas previas cuando WhatsApp las genere.

“Comprar ahora” genera un mensaje únicamente con el producto, la cantidad y las opciones elegidas, sin añadirlo al carrito ni modificar líneas existentes. En las tarjetas utiliza una unidad; si hay opciones obligatorias, lleva primero a la ficha del producto.

El carrito abre siempre el enlace de WhatsApp con el pedido completo precargado. Antes de abrirlo, el servidor vuelve a comprobar productos, variantes y existencias; no existe un flujo alterno de “pedido copiado”.

### Variantes de producto

En Sanity, añade las variantes en el campo `variants` del producto. Cada variante tiene nombre, indicador de selección obligatoria y una o más opciones. El carrito usa las claves estables de Sanity para distinguir líneas: el mismo producto y las mismas opciones suman cantidades; opciones diferentes crean líneas separadas. En datos locales se puede usar la misma estructura opcional:

```ts
variants: [
  {
    id: "talla",
    name: "Talla",
    required: true,
    options: [{ id: "s", label: "S" }],
  },
]
```

Los estilos del panel, botones y selectores están en `app/globals.css`, bajo las secciones `Product detail` y `Cart`.

### Información pública y administrativa

Las tarjetas muestran únicamente imagen, nombre, precio, estado agotado y acciones de compra. La ficha usa `lib/products/public-details.ts` para presentar solo los campos compatibles con la categoría y con contenido no vacío. Los mismos campos relevantes se incluyen en WhatsApp junto con la referencia comercial y las opciones seleccionadas.

Sanity separa “Información para clientes” de “Administración interna”. El inventario numérico, destacado, visibilidad y orden permanecen en el grupo interno y no se muestran en tarjetas ni fichas públicas. Materiales y acabados deben dejarse vacíos hasta contar con información verificada.

## Catálogo real y Sanity

La abstracción de datos vive en `lib/products/index.ts`:

- Sin una configuración completa de Sanity, el sitio muestra el catálogo temporalmente no disponible.
- Con proyecto y dataset configurados, el servidor consulta únicamente productos publicados, visibles y con `isDemo != true`.
- Si Sanity no responde, el sitio no mezcla silenciosamente fixtures con inventario real.
- `data/demo-products.ts` permanece aislado para pruebas automatizadas y para el migrador histórico que solo puede escribir en `development`.

La migración idempotente del catálogo demo, su `dry run` y la configuración de privacidad están documentadas en [`docs/migracion-sanity.md`](docs/migracion-sanity.md).

### Iniciar Sanity Studio

```bash
cd studio
npm install
```

Copia `studio/.env.example` como `studio/.env.local`, configura el proyecto y dataset, y ejecuta:

```bash
npm run dev
```

El esquema `Producto` conserva nombre, slug, categoría, descripciones, precio COP, clasificación de filtros, múltiples imágenes con texto alternativo, variantes, inventario, compra habilitada, visibilidad, destacados, orden y metadatos de migración. La disponibilidad pública se deriva de `stock`, `purchaseEnabled` y `visible`; no se duplica como un campo editable. La propietaria usa el panel restringido del sitio; el Studio completo queda reservado al desarrollador.

Para crear el proyecto inicial, usa la CLI oficial de Sanity y sustituye `REEMPLAZAR_PROJECT_ID` en `studio/sanity.config.ts` mediante la variable de entorno. El Studio se despliega de forma independiente con `npm run deploy`.

## Publicación de cambios de contenido

La versión actual se ejecuta en un Worker compatible con Cloudflare y puede consultar el catálogo publicado. Si se migra a `output: "export"`, cada cambio de Sanity requerirá un nuevo build. En ese caso, configura un webhook de Sanity hacia el proveedor de despliegue; nunca coloques secretos de despliegue en el código o en el navegador.

Para Vercel, `npm run build` selecciona automáticamente el compilador oficial de Next.js cuando `VERCEL=1`. La tienda pública queda preparada, pero el panel administrativo permanece cerrado hasta conectar un proveedor de identidad confiable compatible con Vercel. Consulta [`docs/produccion-vercel.md`](docs/produccion-vercel.md).

## Personalización

- Colores y tokens: `app/globals.css`, sección `:root`.
- Datos generales y canales: `config/site.ts`.
- Navegación: `config/navigation.ts`.
- Fixtures exclusivos de pruebas: `data/demo-products.ts`.
- Logo oficial transparente: `public/images/branding/nela-logo-transparent.png`.
- Imágenes editoriales: `public/images/editorial/`.

Las imágenes de producto reales se administran desde Sanity y conservan textos alternativos validados durante la migración.

## Antes del lanzamiento comercial

Antes del lanzamiento debe autorizarse la migración real, ejecutar el verificador de `production`, configurar `NEXT_PUBLIC_SANITY_DATASET=production` en Vercel y completar una revisión funcional del catálogo publicado.
- Proyecto/dataset de Sanity y productos publicados.
- Historia oficial de la marca.
- Políticas validadas de envíos, cambios, pagos y privacidad.

No se incluyeron pagos, cuentas, reseñas, garantías, purezas de metales ni afirmaciones no suministradas. Los pedidos se coordinan manualmente por WhatsApp y no quedan registrados en un backend.
