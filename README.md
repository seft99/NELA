# NELA Joyería

Sitio boutique en español para NELA Joyería. Está construido con Next.js (App Router), TypeScript estricto, Tailwind CSS 4 y el runtime de Sites/Vinext para Cloudflare.

## Estado actual

- Home editorial responsive.
- Colecciones: Skincare, Accesorios de Plata y Manillas de Oro.
- Búsqueda, filtro de disponibilidad y ordenamiento.
- Fichas de producto con galería y relacionados.
- Modo demo seguro cuando Sanity no está configurado.
- Integración de catálogo Sanity mediante su API pública de lectura.
- Studio de Sanity preparado como proyecto independiente en `studio/`.
- WhatsApp, Instagram y correo se ocultan o deshabilitan hasta recibir datos reales.
- SEO base, sitemap, robots, metadatos Open Graph y página 404.

Las imágenes editoriales y productos actuales están marcados como contenido de demostración. No representan inventario real, materiales ni características oficiales.

## Desarrollo local

Requisitos: Node.js 22.13 o superior.

```bash
npm install
npm run dev
```

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

- `NEXT_PUBLIC_SITE_URL`: dominio público final, usado en metadatos, sitemap y enlaces de producto.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: número internacional sin `+`, espacios ni guiones.
- `NEXT_PUBLIC_INSTAGRAM_URL`: URL real del perfil.
- `NEXT_PUBLIC_BUSINESS_EMAIL`: correo real de atención.
- `NEXT_PUBLIC_SANITY_PROJECT_ID`: ID del proyecto Sanity.
- `NEXT_PUBLIC_SANITY_DATASET`: normalmente `production`.
- `SANITY_API_VERSION`: versión estable para consultas.

El sitio nunca usa un token privado de Sanity en el navegador. Para un dataset público de lectura no se necesita token. Si el proyecto requiere contenido privado, habrá que adaptar la lectura al servidor y configurar un secreto en el entorno de despliegue.

## Catálogo demo y Sanity

La abstracción de datos vive en `lib/products/index.ts`:

- Sin las variables de Sanity, usa `data/demo-products.ts`.
- Con proyecto y dataset configurados, consulta solo documentos publicados con `visible == true`.
- Si Sanity está configurado pero no responde, el sitio muestra un estado vacío; no mezcla silenciosamente productos demo con inventario real.

### Iniciar Sanity Studio

```bash
cd studio
npm install
```

Copia `studio/.env.example` como `studio/.env`, configura el proyecto y ejecuta:

```bash
npm run dev
```

El esquema `Producto` permite administrar nombre, slug, categoría, descripciones, precio COP, múltiples imágenes con texto alternativo, destacado, disponibilidad, visibilidad y orden.

Para crear el proyecto inicial, usa la CLI oficial de Sanity y sustituye `REEMPLAZAR_PROJECT_ID` en `studio/sanity.config.ts` mediante la variable de entorno. El Studio se despliega de forma independiente con `npm run deploy`.

## Publicación de cambios de contenido

La versión actual se ejecuta en un Worker compatible con Cloudflare y puede consultar el catálogo publicado. Si se migra a `output: "export"`, cada cambio de Sanity requerirá un nuevo build. En ese caso, configura un webhook de Sanity hacia el proveedor de despliegue; nunca coloques secretos de despliegue en el código o en el navegador.

## Personalización

- Colores y tokens: `app/globals.css`, sección `:root`.
- Datos generales y canales: `config/site.ts`.
- Navegación: `config/navigation.ts`.
- Datos demo: `data/demo-products.ts`.
- Logo oficial: `public/images/branding/nela-logo.png`.
- Imágenes editoriales: `public/images/editorial/`.

Para reemplazar imágenes, conserva nombres estables o actualiza las rutas en `data/demo-products.ts`. Añade textos alternativos descriptivos para cada fotografía real.

## Antes del lanzamiento comercial

Falta recibir y configurar:

- Fotografías e información real de cada producto.
- Precios confirmados e inventario real.
- Número oficial de WhatsApp.
- Perfil real de Instagram y correo comercial.
- Dominio definitivo.
- Proyecto/dataset de Sanity y productos publicados.
- Historia oficial de la marca.
- Políticas validadas de envíos, cambios, pagos y privacidad.

No se incluyeron pagos, carrito, cuentas, reseñas, garantías, purezas de metales ni afirmaciones no suministradas.
