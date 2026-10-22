# Migración del inventario real a Sanity production

El inventario real se importa únicamente desde `imports/nela-production/products.production.json`. La carpeta `imports/` está ignorada por Git y contiene los 44 productos, el manifiesto y las 49 imágenes físicas validadas.

## Variables

Configura localmente, sin confirmar el archivo en Git:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=0l7ykvj6
SANITY_MIGRATION_DATASET=production
SANITY_API_VERSION=2025-02-19
```

El dry run y el verificador no requieren token. Solamente el comando `apply` lee `SANITY_API_WRITE_TOKEN`, que debe ser un token Editor guardado exclusivamente en `.env.local` o en el entorno seguro del servidor.

## Flujo seguro

1. Ejecuta `npm run sanity:migrate:production:dry`.
2. Revisa Project ID, dataset, cantidades, conflictos, documentos y assets planificados.
3. No continúes si aparece algún conflicto o una validación del paquete falla.
4. La escritura real requiere autorización expresa del propietario.
5. Tras recibirla, ejecuta `npm run sanity:migrate:production:apply`.
6. Comprueba el resultado con `npm run sanity:migrate:production:verify`.

El migrador rechaza cualquier destino distinto de `production`, exige `--confirm-production` para la escritura, crea documentos publicados mediante IDs deterministas y no sobrescribe documentos existentes. Las imágenes se deduplican por hash y las dos cadenas Venecia reutilizan el mismo asset.

## Activación del catálogo real

Después de una importación y verificación correctas, configura en el entorno público:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=0l7ykvj6
NEXT_PUBLIC_SANITY_DATASET=production
```

La aplicación no utiliza el catálogo demo como fallback. Si Sanity no está disponible, presenta un estado temporalmente no disponible y no publica productos ficticios.
