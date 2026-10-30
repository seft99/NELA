# Preparación de NELA para Cloudflare Workers

> Estado: **REMOTE PREVIEW VALIDATED / PRODUCTION NOT DEPLOYED**. La rama compila,
> publica una preview aislada y la valida, pero no activa una versión productiva,
> no cambia DNS y no modifica el dataset `production` de Sanity.

## 1. Estrategia seleccionada

Se mantiene Next.js y se usa **vinext `1.0.0-beta.5`**, que ya formaba parte del
proyecto. La decisión se basó en:

- Cloudflare recomienda actualmente vinext para aplicaciones Next.js nuevas o
  existentes.
- `pnpm run check:cloudflare` obtuvo 95 % de compatibilidad: 17 capacidades
  soportadas, 2 parciales y 0 incompatibilidades.
- La salida se construyó y ejecutó localmente con el runtime de Workers.
- No exige una actualización mayor de Next.js/React ni una reescritura.
- Conserva el build nativo de Next.js usado por Vercel.

Las dos capacidades parciales reportadas son:

1. `next/font/google`: vinext sirve la fuente desde el CDN en vez de alojarla en
   el artefacto de build.
2. `next/image`: la configuración avanzada de `remotePatterns` es parcial. En
   Cloudflare las imágenes se entregan directamente desde el CDN de Sanity y
   los recursos estáticos, sin depender de una ruta `/_next/image` no soportada.

Se evaluó **OpenNext para Cloudflare** como alternativa. Es una opción madura y
conservadora para muchas aplicaciones existentes, pero introducirlo aquí
añadiría otro adaptador y configuración sin resolver una incompatibilidad real.
Vinext ya está integrado y su salida fue validada. La condición beta sigue
siendo un riesgo documentado: antes del corte de producción se debe repetir la
matriz de pruebas con la versión bloqueada y revisar sus notas de versión.

Documentación oficial consultada:

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/

## 2. Arquitectura auditada

### Versiones reales

| Componente | Versión |
| --- | --- |
| Next.js | `16.4.2` |
| React / React DOM | `19.2.6` |
| TypeScript | `5.9.3` |
| Node.js probado localmente | `24.19.0` |
| Node.js mínimo del proyecto | `>=22.13.0` |
| pnpm | `11.25.0` |
| vinext | `1.0.0-beta.5` |
| Vite | `8.0.13` |
| Wrangler | `4.151.0` |
| Cloudflare Vite plugin | `1.37.1` |

Se actualizó exclusivamente Wrangler de `4.92.0` a `4.151.0` para habilitar el
flujo oficial de **Workers Previews** (`wrangler preview`). No se actualizó
vinext: su versión estable actual exige una actualización conjunta de React,
React DOM y Vite, lo cual ampliaría innecesariamente el alcance y el riesgo de
esta migración.

### Renderizado y rutas

- La aplicación usa exclusivamente **App Router**.
- El layout raíz es dinámico; las páginas principales y el catálogo se sirven
  mediante SSR.
- Hay rutas dinámicas para `/accesorios-plata/[tipo]` y
  `/productos/[slug]`.
- Existen route handlers en `/api/catalog/validate` y
  `/api/admin/inventory`.
- No se encontraron Server Actions ni middleware.
- `robots.txt`, `sitemap.xml`, metadata dinámica, favicon y canonicales se
  mantienen.
- `NEXT_PUBLIC_SITE_URL` controla la URL base. Mientras Vercel siga siendo la
  producción, debe continuar apuntando a `https://nelajoyeria.vercel.app/`.

### Sanity, catálogo y caché

- Proyecto Sanity: `0l7ykvj6`.
- Dataset: `production`.
- Los productos se leen por GROQ mediante la API HTTP de Sanity.
- La lectura usa `cache: "no-store"` para no conservar precios o existencias
  obsoletos. `React.cache` deduplica la misma lectura dentro de un render, no
  entre solicitudes.
- Los IDs, slugs, categorías, SKU, precios, inventario, visibilidad, favoritos,
  recomendaciones e imágenes no se alteraron.
- Las imágenes continúan cargándose desde el CDN de Sanity o desde recursos
  estáticos. En el build Cloudflare no se observaron referencias a
  `/_next/image`.
- El carrito sigue en `localStorage` bajo `nela-cart`; la validación de stock y
  precio usa `/api/catalog/validate` con `Cache-Control: no-store`.
- Búsqueda predictiva, filtros, compra por WhatsApp y enlaces conservan su
  implementación actual.

No se configuraron KV, D1, R2, Durable Objects ni Cloudflare Images porque la
aplicación no los necesita para mantener su comportamiento actual.

## 3. Archivos de Cloudflare

### Nuevos

- `wrangler.jsonc`: entrada del Worker, fecha/flags de compatibilidad y binding
  de assets; desactiva la ruta productiva `workers.dev`, habilita URLs temporales
  e incluye el bloque `previews` requerido para entornos aislados.
- `scripts/run-cloudflare.mjs`: ejecutor multiplataforma que aísla el modo
  Cloudflare independiente.
- `scripts/verify-cloudflare-preview.mjs`: smoke test remoto reutilizable para
  rutas públicas, producto real, SEO, 404 y límites administrativos.
- `.dev.vars.example`: plantilla sin secretos.
- `CLOUDFLARE_DEPLOYMENT.md`: esta guía.

### Modificados

- `package.json`: scripts dedicados a Cloudflare; scripts actuales conservados.
- `vite.config.ts`: modo independiente de Cloudflare sin bindings específicos
  de ChatGPT Sites. El entorno administrado existente conserva sus mocks y el
  opt-in de autenticación.
- `cloudflare-env.d.ts`: binding `ASSETS` y tipos opcionales ya existentes.
- `.env.example`: documentación del control de confianza de cabeceras.
- `.gitignore`: ignora `.dev.vars*` y conserva únicamente el ejemplo.
- `app/chatgpt-auth.ts`: las cabeceras de identidad sólo se confían mediante un
  opt-in explícito en un entorno administrado.
- `app/admin/inventario/page.tsx`: texto neutral respecto del proveedor.
- `scripts/inventory-tests.mjs`: pruebas del nuevo límite de confianza.

### Scripts

```bash
pnpm run check:cloudflare
pnpm run dev:cloudflare
pnpm run build:cloudflare
pnpm run preview:cloudflare
pnpm run preview:cloudflare:remote
pnpm run deploy:cloudflare
pnpm run verify:cloudflare
pnpm run verify:cloudflare:preview -- https://<preview>.workers.dev
pnpm run cf-typegen
```

`preview:cloudflare` sirve el artefacto localmente. Cuando exista una sesión de
Cloudflare autorizada, `preview:cloudflare:remote` publicará una versión aislada
con URL temporal mediante Workers Previews; no crea una versión activa de
producción. `deploy:cloudflare` está bloqueado por defecto y sólo acepta un
despliegue de producción si se añade explícitamente `--confirm-production`.
La preview remota se creó sin activar producción. La ruta productiva
`nela-joyeria.nela-joyeria.workers.dev` permanece deshabilitada; sólo la URL
aislada de preview está disponible.

`verify:cloudflare` es un preflight local sin publicación: ejecuta
compatibilidad, tipos, lint, pruebas funcionales contra el dataset configurado,
build de regresión Vercel, build Cloudflare, búsqueda de valores privados
incrustados en los artefactos y un upload `--dry-run`. Debe terminar
correctamente justo antes de crear una preview remota y antes del corte de
producción.

Los flujos existentes permanecen disponibles:

```bash
pnpm run dev
pnpm run build:vercel
pnpm run start:next
```

## 4. Variables y secretos

Configure los nombres siguientes en Cloudflare sin copiar archivos locales ni
exponer valores en Git.

| Variable | Tipo | Requerida | Uso |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | pública, build y runtime | sí | Debe identificar `0l7ykvj6`. |
| `NEXT_PUBLIC_SANITY_DATASET` | pública, build y runtime | sí | Debe ser `production`. |
| `SANITY_API_VERSION` | runtime | recomendable | Actualmente `2025-02-19`. |
| `NEXT_PUBLIC_SITE_URL` | pública, build y runtime | sí | Canonical de producción. No use `workers.dev` mientras sea sólo preview. |
| `NELA_TRUST_CHATGPT_AUTH_HEADERS` | runtime | no | Omitir o usar `0` en Cloudflare público. |
| `INVENTORY_ADMIN_EMAILS` | secreto/runtime | no en preview | Sólo sirve si existe autenticación verificada. |
| `INVENTORY_ADMIN_USER_IDS` | secreto/runtime | no en preview | Igual que el anterior. |
| `SANITY_API_WRITE_TOKEN` | secreto/runtime | no para catálogo | Sólo panel administrativo; no debe configurarse en una preview pública sin autenticación. |

Las variables `SANITY_MIGRATION_DATASET`,
`NELA_SANITY_MIGRATION_TEST_API_BASE_URL` y
`NELA_PRODUCTION_MIGRATION_TEST_API_BASE_URL` pertenecen a utilidades locales de
migración/prueba. No son necesarias para el Worker y no deben añadirse al
deployment.

### Límite de seguridad del panel administrativo

ChatGPT Sites protege las cabeceras `oai-authenticated-user-*`; un Worker
público no. Por eso el modo Cloudflare deja deshabilitado el panel de
inventario de forma segura. No defina `NELA_TRUST_CHATGPT_AUTH_HEADERS=1` en un
host público. Antes de habilitar el panel se debe implementar y verificar una
autenticación propia o un proxy de confianza. El catálogo público sigue siendo
completamente funcional y de sólo lectura.

## 5. Desarrollo, build y preview local

Desde la raíz del repositorio:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check:cloudflare
pnpm run typecheck
pnpm run lint
pnpm run test:catalog
pnpm run test:cart
pnpm run test:inventory
pnpm run build:vercel
pnpm run build:cloudflare
pnpm run verify:cloudflare
pnpm run preview:cloudflare
```

La preview local queda normalmente en `http://127.0.0.1:8787`. Para pasar
argumentos a Wrangler use, por ejemplo, `pnpm run preview:cloudflare --port
8788`; no incluya un `--` aislado adicional.

Wrangler puede copiar variables locales al directorio generado
`dist/server/.dev.vars`. `dist/` y `.dev.vars*` están ignorados: nunca comparta
ni suba ese artefacto.

## 6. Crear una preview remota futura

### Opción A: preview inmediata desde esta rama

Esta es la ruta recomendada para la primera prueba. Requiere Wrangler `4.135.0`
o superior y una sesión autorizada de Cloudflare:

```bash
pnpm run preview:cloudflare:remote
```

Wrangler construye la aplicación y crea una **Workers Preview** con URL temporal
aislada. Puede crear la primera preview de un Worker nuevo sin publicar una
versión de producción. La preview no sustituye la versión activa. Sus variables
y secretos no se heredan de producción y deben configurarse en Previews Base o
en la preview concreta antes de validar el catálogo real.

Las variables públicas de NELA ya están declaradas tanto para producción como
para previews en `wrangler.jsonc`. No se declara ningún token de escritura ni
identidad administrativa. Antes de cada preview remota o deploy, el ejecutor
vuelve a escanear el artefacto y detiene el upload si encuentra un valor privado
incrustado.

Preview validada el 29 de octubre de 2026:

```text
https://cloudflare-migration-prep-nela-joyeria.nela-joyeria.workers.dev
```

Verificación reproducible:

```bash
pnpm run verify:cloudflare:preview -- https://cloudflare-migration-prep-nela-joyeria.nela-joyeria.workers.dev
```

El verificador aprobó 17 comprobaciones: inicio, catálogo, cinco categorías,
contacto, preguntas frecuentes, privacidad, producto real, robots, sitemap,
404, panel administrativo restringido, API administrativa 401 y cabecera
`X-Robots-Tag: noindex`.

### Opción B: preview continua con Workers Builds

Estas acciones son deliberadamente manuales y no fueron ejecutadas:

1. Suba esta rama a un remoto sólo después de revisar el diff. No mezcle ni
   empuje a `main` todavía.
2. En Cloudflare Dashboard abra **Workers & Pages → Create application → Import
   a repository** y conecte el repositorio existente.
3. Seleccione una rama de preview, por ejemplo
   `cloudflare-migration-prep`; no seleccione `main` como rama productiva.
4. Configure Node `24` (o cualquier versión compatible `>=22.13.0`) y pnpm
   `11.25.0`.
5. Use la raíz del repositorio como directorio de trabajo.
6. Comando de build:

   ```bash
   pnpm install --frozen-lockfile && pnpm run build:cloudflare
   ```

7. Comando de deploy del artefacto ya construido:

   ```bash
   pnpm exec wrangler deploy --config dist/server/wrangler.json
   ```

8. Configure las variables públicas tanto para el build como para el runtime.
   Añada secretos sólo desde el Dashboard/secret store, nunca al repositorio.
9. Mantenga `NEXT_PUBLIC_SITE_URL` con el dominio de producción vigente durante
   la preview. No convierta `workers.dev` en canonical ni lo indexe como copia.
10. Compruebe la URL `workers.dev` con la matriz del apartado siguiente antes
    de añadir un dominio personalizado.

### Activación de producción (deliberadamente bloqueada)

Después de aprobar la preview, medir CPU y confirmar variables, el comando
local de producción requiere una confirmación explícita:

```bash
pnpm run deploy:cloudflare -- --confirm-production
```

No ejecute este comando mientras Vercel siga siendo la producción aprobada o
antes de autorizar expresamente el cambio. La protección evita que un simple
`pnpm run deploy:cloudflare` publique accidentalmente.

## 7. Lista de verificación para una preview remota

1. Abrir `/`, `/accesorios-plata` y las cinco categorías.
2. Abrir por URL directa varios `/productos/[slug]` y recargar el navegador.
3. Confirmar 404, `robots.txt`, `sitemap.xml`, canonicales, metadata, Open Graph
   y favicon.
4. Verificar que todos los productos, precios, SKU, stock e imágenes coinciden
   con Sanity `production`.
5. Probar búsqueda predictiva, búsqueda del catálogo, categorías, tallas,
   precio, disponibilidad, orden, estados vacíos y contador.
6. Probar carrito, persistencia, cantidades, límites de stock y totales.
7. Inspeccionar los enlaces de WhatsApp e Instagram sin enviar mensajes de
   prueba a clientes.
8. Validar navegación, scroll y diseño en 320, 360, 375, 393, 430, 440, 768,
   1024, 1280, 1440 y 1920 px.
9. Revisar Workers Logs/Observability en una versión productiva controlada antes
   del corte. Cloudflare no ofrece Workers Logs, Wrangler tail ni Logpush para
   Preview URLs; una preview aislada sólo permite medir tiempo de pared HTTP.
10. Confirmar que `/admin/inventario` y `/api/admin/inventory` no conceden
    acceso sin autenticación verificada.

## 8. Límites del plan gratuito y riesgos

Los límites oficiales observados al preparar esta rama incluyen:

- 100.000 solicitudes Worker por día.
- 10 ms de CPU por invocación en Workers Free.
- 128 MB de memoria por isolate.
- 50 subrequests por invocación.
- Worker comprimido/no comprimido dentro de los límites actuales; el dry-run
  generado midió aproximadamente 1.268 KiB de upload y 351 KiB gzip.
- 108 assets en el manifest, muy por debajo de 20.000.
- Los assets estáticos servidos por Workers Assets no consumen la cuota de
  solicitudes Worker según el modelo actual, pero las rutas SSR sí.

El plan gratuito **parece plausible, pero no está demostrado para producción**.
Una compilación o una prueba local no mide la CPU facturada de un Worker real.
Las rutas dinámicas consultan Sanity y el layout raíz carga el catálogo completo
para carrito/búsqueda. Los tiempos locales observados fueron aproximadamente
478–976 ms de pared, dominados por red/SSR; no equivalen a CPU.

Antes de un corte de tráfico es obligatorio medir CPU real en una versión
productiva controlada con observabilidad, porque Cloudflare no expone esos logs
para Preview URLs. Si una ruta supera 10 ms, las opciones, en este orden, son:

1. reducir serialización/cómputo repetido conservando frescura de precio/stock;
2. separar datos estrictamente globales del catálogo completo;
3. usar caché corto sólo para contenido no sensible a inventario y revalidar
   explícitamente;
4. evaluar Workers Paid únicamente con autorización, sin ocultar su costo.

No se añadió caché indefinido, porque podría mostrar stock o precios obsoletos.
También aplican las cuotas externas de la API/CDN de Sanity.

## 9. Dominio, convivencia con Vercel y rollback

- La configuración de Vercel no se eliminó y `pnpm run build:vercel` continúa
  funcionando.
- Una preview `workers.dev` puede coexistir con la web pública actual.
- No cambie DNS ni el custom domain hasta completar pruebas, observabilidad y
  aprobación.
- En el corte futuro, actualice `NEXT_PUBLIC_SITE_URL` al dominio definitivo,
  reconstruya, valide canonicales y luego añada el dominio al Worker.
- Rollback: retire o revierta la ruta DNS al deployment Vercel existente. No
  borre el proyecto Vercel hasta que Cloudflare haya sido estable durante el
  periodo acordado.

## 10. Evidencia de validación local

| Prueba | Estado | Evidencia / limitación |
| --- | --- | --- |
| Árbol Git y rama aislada | PASS | Trabajo en `cloudflare-migration-prep`; `main` no se modificó. |
| Instalación reproducible | PASS | `pnpm install --frozen-lockfile`; lockfile verificado por políticas de supply chain. |
| `pnpm run check:cloudflare` | PASS | 95 %, 17 soportadas, 2 parciales, 0 incompatibles. |
| TypeScript | PASS | `pnpm run typecheck`. |
| ESLint | PASS | `pnpm run lint`. |
| Tests de catálogo | PASS | Suite existente ejecutada; la validación Worker usó Sanity production. |
| Tests de carrito | PASS | Suite existente ejecutada. |
| Tests de inventario/auth | PASS | Incluye rechazo por defecto y opt-in administrado. |
| Build Vercel/Next.js | PASS | `VERCEL=1 pnpm run build:vercel`. |
| Build vinext/Cloudflare | PASS | `pnpm run build:cloudflare`. |
| Wrangler dry-run | PASS | Artefacto generado, 120 módulos runtime, 108 assets. No desplegó. |
| Workers Preview remota | PASS | Preview aislada creada y accesible; producción `workers.dev` deshabilitada. |
| Protección de producción | PASS | `pnpm run deploy:cloudflare` se niega a publicar sin `--confirm-production`. |
| Escaneo de valores privados | PASS | Dos valores privados locales revisados; ninguno quedó incrustado en módulos/assets del upload. |
| Preview runtime Workers local | PASS | Wrangler local sirvió la aplicación. |
| Rutas principales | PASS | Verificación remota: inicio, catálogo, cinco categorías, información, robots y sitemap: HTTP 200. |
| Ruta inexistente | PASS | HTTP 404. |
| Producto dinámico | PASS | Acceso directo a un slug real: HTTP 200. |
| Sanity production | PASS | Lectura pública sin token: 44 productos, 44 visibles, 1 sin stock; IDs, SKU, slugs, precios, stock e imágenes válidos. |
| Imágenes | PASS | Imagen real de Sanity respondió 200 `image/png`; sin referencias `/_next/image`. |
| API de validación | PASS | Respuesta `no-store`; producto falso rechazado. |
| API administrativa | PASS | Respuesta 401 sin identidad confiable. |
| Búsqueda predictiva | PASS | Consulta `lazo` mostró imagen, categoría, precio y ruta reales. |
| Filtros/contador | PASS | Búsqueda `lazo`, limpieza y filtro Anillos actualizan URL y resultados. |
| Ordenamiento | PASS PARCIAL | El control abre en la preview; no se recorrieron todas las opciones. |
| Carrito y stock | PASS | Producto real añadido; persistencia visual, total y límite de stock verificados. |
| WhatsApp/Instagram externos | NOT TESTED | No se abrió ni envió comunicación externa; lógica cubierta por suite existente/inspección. |
| Detalle de producto | PASS | Galería, SKU, stock, atributos, cantidad, acciones, tabs y relacionados renderizan. |
| Render remoto 393 px | PASS | Captura de la preview: fuentes, imágenes Sanity, hero y colecciones cargaron sin recursos rotos. |
| Render remoto 1440 px | PASS | Captura de la preview: composición, imágenes y controles renderizaron correctamente. |
| Resto de anchos solicitados | NOT TESTED | No se capturó cada ancho en navegador real durante esta preparación. |
| iOS Safari / Android Chrome reales | NOT TESTED | No había dispositivos físicos conectados. |
| Rendimiento HTTP remoto | PASS | 17 comprobaciones; tiempo de pared medio aproximado de 412 ms. No equivale a CPU. |
| CPU Free real | NOT TESTED | Preview URLs no admiten Workers Logs, Wrangler tail ni Logpush; requiere una versión productiva controlada y autorización explícita. |

## 11. Estado de preparación

**REMOTE PREVIEW VALIDATED / READY FOR EXPLICIT PRODUCTION AUTHORIZATION**

La salida compatible con Workers compila, conserva Sanity `production`, mantiene
Vercel operativo, pasa el preflight integral y superó la validación remota de la
preview. No se configuraron secretos de escritura ni identidad administrativa.
Para continuar se requiere autorización explícita para una versión productiva
controlada, medir CPU real con observabilidad y, después, decidir el corte de
dominio/DNS. También queda elegir una autenticación verificada antes de habilitar
el panel administrativo en Cloudflare. Ninguno de esos puntos exige modificar el
catálogo público ni los datos de Sanity.

