# Separación de catálogos y migración demo a Sanity

La aplicación NELA usa el proyecto Sanity `0l7ykvj6` con dos datasets públicos claramente separados:

- `development`: únicamente productos e imágenes de demostración.
- `production`: únicamente productos reales. Debe permanecer vacío hasta recibir el catálogo definitivo.

La integración no crea otra aplicación y no elimina `data/demo-products.ts`.

## Estado comprobado

- `production` existe, es consultable públicamente y contiene `0` documentos.
- `development` todavía no existe; la API pública responde `Dataset not found`.
- Fuente demo: `expandedDemoProducts`, 45 productos (15 por categoría).
- Identidad estable: el `_id` de Sanity conserva el `id` demo.
- Duplicados: se comprueban `_id`, `slug.current` y `legacyId`.
- Escritura idempotente: usa `createIfNotExists`; una segunda ejecución respeta documentos existentes.
- Imágenes: calcula SHA-1, reutiliza assets coincidentes y solo carga archivos ausentes.
- Modo predeterminado: `dry run`. Solo `--apply` escribe en Sanity.

## Crear el dataset público development

La sesión local de Sanity CLI debe estar autenticada. Desde `studio/`:

```powershell
npm exec -- sanity login
npm exec -- sanity dataset create development --visibility public --project-id 0l7ykvj6
```

La versión local del CLI utiliza el comando singular `dataset`. También puedes crearlo desde [sanity.io/manage](https://www.sanity.io/manage): abre el proyecto NELA, entra en **Datasets**, crea `development` y selecciona visibilidad **Public**.

Comprueba ambos datasets sin modificar contenido:

```powershell
npm exec -- sanity dataset list --project-id 0l7ykvj6
npm exec -- sanity dataset visibility get development --project-id 0l7ykvj6
npm exec -- sanity dataset visibility get production --project-id 0l7ykvj6
```

## Protección de production

El migrador toma el destino exclusivamente de `NEXT_PUBLIC_SANITY_DATASET`; no contiene un fallback a `production`.

Antes de consultar o escribir en Sanity imprime una confirmación visible con Project ID, dataset, cantidad de productos y modo. Si el destino es `production` y la fuente contiene al menos un producto con `isDemo: true`, termina con error. Esta protección se aplica incluso al dry run y no dispone de un parámetro para ignorarla.

## Token único

Crea un único project token llamado `NELA inventory and migration`, con rol **Editor**, y guárdalo como `SANITY_API_WRITE_TOKEN`.

El catálogo lee los datasets públicos sin token. El token Editor solo se utiliza en el servidor para las mutaciones del panel, la carga de imágenes y la importación. Nunca uses el prefijo `NEXT_PUBLIC_`, no lo confirmes en Git y no lo envíes por chat.

Como ambos datasets son públicos, sus documentos publicados pueden consultarse directamente mediante la API de Sanity. La interfaz de NELA sigue omitiendo `stock` y `variantInventory` en sus respuestas públicas, pero esos campos no deben considerarse secretos mientras permanezcan en un dataset público.

## Variables locales

La raíz del proyecto ya está configurada localmente para `development`. La plantilla es:

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID=0l7ykvj6
NEXT_PUBLIC_SANITY_DATASET=development
SANITY_API_VERSION=2025-02-19
SANITY_API_WRITE_TOKEN=TOKEN_EDITOR
```

El Studio usa `studio/.env.local`:

```dotenv
SANITY_STUDIO_PROJECT_ID=0l7ykvj6
SANITY_STUDIO_DATASET=development
```

Para trabajar posteriormente con productos reales, cambia el dataset a `production` únicamente en un entorno dedicado al catálogo definitivo. No cambies el destino para ejecutar este migrador demo: la protección lo rechazará.

## Primer dry run contra development

Después de crear `development`, desde la carpeta de la aplicación:

```powershell
npm run sanity:migrate:dry
```

El encabezado debe indicar:

```text
Project ID: 0l7ykvj6
Dataset: development
Cantidad de productos: 45
Modo: DRY RUN (sin escrituras)
```

El comando consulta duplicados y muestra documentos e imágenes planificados, pero no carga assets ni crea documentos. Revisa el encabezado antes de considerar cualquier importación real.

## Importación real

No se ha ejecutado. Solo después de revisar el dry run y confirmar de nuevo que el destino es `development`, configura el token Editor y ejecuta:

```powershell
npm run sanity:migrate:apply
```

No existe una opción de reemplazo forzado. Un conflicto de slug o `legacyId` detiene la operación antes de crear productos, y `production` rechaza siempre productos demo.
