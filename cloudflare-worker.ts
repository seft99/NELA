import handler from "vinext/server/fetch-handler";

const WORKERS_DEV_SUFFIX = ".workers.dev";

export default {
  async fetch(request, env, ctx) {
    const response = await handler.fetch(request, env, ctx);

    if (!new URL(request.url).hostname.endsWith(WORKERS_DEV_SUFFIX)) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
} satisfies ExportedHandler<Cloudflare.Env>;
