import { NextRequest, NextResponse } from "next/server";
import { request as httpsRequest } from "https";

function testHttps(url: string): Promise<{ status: number; body: string; error?: string }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ status: 0, body: "", error: "timeout" }), 5000);
    try {
      const parsed = new URL(url);
      const req = httpsRequest(
        {
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            clearTimeout(timer);
            resolve({ status: res.statusCode || 0, body: data.slice(0, 500) });
          });
        }
      );
      req.on("error", (e) => {
        clearTimeout(timer);
        resolve({ status: 0, body: "", error: e.message });
      });
      req.end();
    } catch (e) {
      clearTimeout(timer);
      resolve({ status: 0, body: "", error: String(e) });
    }
  });
}

function testFetch(url: string): Promise<{ status: number; body: string; error?: string }> {
  return fetch(url, {
    headers: { "User-Agent": "yoink/1.0" },
    signal: AbortSignal.timeout(5000),
  })
    .then(async (r) => ({ status: r.status, body: (await r.text()).slice(0, 500) }))
    .catch((e) => ({ status: 0, body: "", error: e.cause?.code || e.message }));
}

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist") || "Cage The Elephant";
  const title = request.nextUrl.searchParams.get("title") || "Cigarette Daydreams";
  const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;

  const [httpsResult, fetchResult] = await Promise.all([
    testHttps(url),
    testFetch(url),
  ]);

  return NextResponse.json({
    url,
    https_module: httpsResult,
    node_fetch: fetchResult,
  });
}
