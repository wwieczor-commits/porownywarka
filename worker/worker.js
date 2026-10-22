// Pośrednik dla aplikacji Versus (Cloudflare Workers).
// Trzyma klucz API Anthropic w ukryciu i przepuszcza tylko zapytania w kształcie,
// jakiego używa aplikacja. Klucz ustawiasz jako sekret ANTHROPIC_API_KEY.
//
// Zmienne (Settings → Variables w panelu Cloudflare):
//   ANTHROPIC_API_KEY  – sekret, Twój klucz z platform.claude.com (wymagany)
//   ALLOWED_ORIGINS    – strony, które mogą korzystać z pośrednika, po przecinku
//                        (domyślnie https://wwieczor-commits.github.io)
//   LIMIT_PER_HOUR     – ile zapytań na godzinę może wysłać jeden adres IP (domyślnie 30)

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-5-5";
const MAX_BODY = 4 * 1024 * 1024; // zrzut ekranu + tekst strony mieszczą się z zapasem
const WEB_FETCH = { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3, max_content_tokens: 20000 };

// Licznik zapytań na adres IP. Żyje w pamięci jednej instancji, więc to hamulec,
// a nie twarda blokada. Prawdziwym zabezpieczeniem jest limit wydatków w konsoli Anthropic.
const hits = new Map();

export default {
  async fetch(req, env) {
    const allowed = (env.ALLOWED_ORIGINS || "https://wwieczor-commits.github.io")
      .split(",").map(s => s.trim()).filter(Boolean);
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };
    const fail = (status, message) =>
      new Response(JSON.stringify({ type: "error", error: { type: "proxy_error", message } }), {
        status, headers: { ...cors, "content-type": "application/json" }
      });

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return fail(405, "Tylko POST.");
    if (!allowed.includes(origin)) return fail(403, "Ta strona nie może korzystać z pośrednika.");
    if (!env.ANTHROPIC_API_KEY) return fail(500, "Brak sekretu ANTHROPIC_API_KEY.");

    const ip = req.headers.get("CF-Connecting-IP") || "?";
    const limit = Number(env.LIMIT_PER_HOUR) || 30;
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < 3600_000);
    if (recent.length >= limit) return fail(429, "Za dużo zapytań. Spróbuj za godzinę.");
    recent.push(now);
    hits.set(ip, recent);

    const raw = await req.text();
    if (raw.length > MAX_BODY) return fail(413, "Za duże zapytanie.");
    let body;
    try { body = JSON.parse(raw); } catch { return fail(400, "Niepoprawny JSON."); }

    // Przepuszczamy tylko to, czego używa aplikacja: jedno pytanie i ewentualnie
    // dokończenie po pause_turn. Model, limit tokenów i narzędzia ustawia serwer.
    const msgs = body.messages;
    if (!Array.isArray(msgs) || msgs.length < 1 || msgs.length > 2 || msgs[0]?.role !== "user"
        || (msgs[1] && msgs[1].role !== "assistant")) {
      return fail(400, "Niepoprawna treść zapytania.");
    }
    const clean = {
      model: MODEL,
      max_tokens: 16000,
      fallbacks: "default",
      messages: msgs
    };
    if (Array.isArray(body.tools) && body.tools.length) clean.tools = [WEB_FETCH];

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2026-10-21",
        "anthropic-beta": "server-side-fallback-2026-07-01"
      },
      body: JSON.stringify(clean)
    });
    return new Response(res.body, {
      status: res.status,
      headers: { ...cors, "content-type": res.headers.get("content-type") || "application/json" }
    });
  }
};
