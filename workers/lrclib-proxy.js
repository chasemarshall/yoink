// Cloudflare Worker — proxies requests to lrclib.net
// Deploy: npx wrangler deploy workers/lrclib-proxy.js --name lrclib-proxy
// Then set LRCLIB_PROXY_URL=https://lrclib-proxy.<your-subdomain>.workers.dev in Railway

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL(`https://lrclib.net${url.pathname}${url.search}`);

    const res = await fetch(target.toString(), {
      headers: { "User-Agent": "yoink/1.0 (https://yoinkify.lol)" },
    });

    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  },
};
