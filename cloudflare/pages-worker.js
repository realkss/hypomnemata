const LICHESS_MASTERS_URL = "https://explorer.lichess.ovh/masters"

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
    ...init,
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === "/api/chess/masters") {
      const token = env.LICHESS_API_TOKEN
      if (!token) {
        return json(
          {
            error: "LICHESS_API_TOKEN is not configured on this Cloudflare Pages project.",
          },
          { status: 500 },
        )
      }

      const targetUrl = new URL(LICHESS_MASTERS_URL)
      targetUrl.search = url.search

      const response = await fetch(targetUrl.toString(), {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
          "user-agent": "Hypomnemata Masters Proxy/1.0",
        },
      })

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          "access-control-allow-origin": "*",
          "cache-control": response.ok ? "public, max-age=300" : "no-store",
          "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
        },
      })
    }

    return env.ASSETS.fetch(request)
  },
}
