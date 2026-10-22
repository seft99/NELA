# Preparación para producción en Vercel

## Estado seguro

El proyecto conserva dos destinos de ejecución:

- Desarrollo y vista previa existentes: Vinext/Sites sobre Cloudflare.
- Vercel: el script `npm run build` detecta `VERCEL=1` y ejecuta el compilador oficial de Next.js.

La tienda pública, el catálogo, el carrito y la validación de inventario pueden ejecutarse en Vercel. El panel `/admin/inventario` queda deliberadamente deshabilitado allí: las cabeceras `oai-authenticated-user-*` solo son confiables dentro de ChatGPT Sites. Aceptarlas directamente en Vercel permitiría suplantar la identidad del administrador.

Antes de habilitar el panel en Vercel se debe elegir e integrar un proveedor de identidad real, validar la sesión en el servidor y conservar la lista `INVENTORY_ADMIN_EMAILS` o `INVENTORY_ADMIN_USER_IDS` como una segunda comprobación. No basta con ocultar la ruta o confiar en cabeceras del navegador.

## Variables requeridas

Configura por ambiente en Vercel, sin guardar secretos en Git:

```dotenv
NEXT_PUBLIC_SITE_URL=https://nelajoyeria.vercel.app
NEXT_PUBLIC_SANITY_PROJECT_ID=0l7ykvj6
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_VERSION=2025-02-19
SANITY_API_WRITE_TOKEN=token-editor-solo-servidor
INVENTORY_ADMIN_EMAILS=correo-oficial-verificado@example.com
```

No configures productos demo en `production`. El token Editor no debe llevar el prefijo `NEXT_PUBLIC_`. Si el panel seguirá deshabilitado en el primer lanzamiento, omite el token de escritura y las listas administrativas en Vercel para reducir superficie de riesgo.

## Configuración del proyecto

1. Usa Node.js 22 o superior.
2. Conserva `pnpm-lock.yaml` como único lockfile versionado y usa `pnpm install --frozen-lockfile` en CI.
3. Framework preset: Next.js.
4. Build command: `npm run build` (o explícitamente `npm run build:vercel`).
5. No configures un directorio de salida manual.
6. Define las variables por separado para Preview y Production.
7. Comprueba que `NEXT_PUBLIC_SITE_URL` coincida con el dominio canónico final.

## Validación previa

```powershell
npm run typecheck
npm run lint
npm run test:inventory
npm run test:catalog
npm run test:cart
npm run test:migration
npm run build
npm run build:vercel
npm audit --omit=dev
```

Después del despliegue de prueba, verifica `/`, `/accesorios-plata`, una ficha válida de plata ley 925, una ficha inexistente, `/contacto`, carrito vacío y con varios productos, y que `/admin/inventario` informe que el panel no está habilitado. Comprueba también que `/skincare` y `/manillas-oro` redirijan al catálogo de plata ley 925. Revisa `robots.txt`, `sitemap.xml`, cabeceras de seguridad y enlaces de WhatsApp/Instagram.

## Requisitos todavía externos

- Dominio definitivo y DNS.
- Catálogo real publicado en `production`.
- Fotografías y datos comerciales verificados.
- Correo oficial.
- Políticas definitivas de envíos, cambios, pagos y tratamiento de datos.
- Proveedor de autenticación para el panel en Vercel.
- Si se requiere limitación distribuida de peticiones, un servicio compartido compatible con funciones serverless; la memoria del proceso no es suficiente.
