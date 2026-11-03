declare namespace Cloudflare {
  interface Env {
    ASSETS: Fetcher;
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CLOUDFLARE_ACCESS_AUDIENCE?: string;
    CLOUDFLARE_ACCESS_TEAM_DOMAIN?: string;
    INVENTORY_ADMIN_EMAILS?: string;
    NELA_CLOUDFLARE_ACCESS_ENABLED?: string;
    SANITY_API_WRITE_TOKEN?: string;
  }
}
