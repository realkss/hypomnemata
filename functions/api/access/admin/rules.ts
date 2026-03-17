import { readSession, json, type AuthEnv } from "../../auth/_lib"
import { getOwnerKey, userKey } from "../../../lib/access"

type Env = AuthEnv & {
  ACCESS_CONTROL_KV?: KVNamespace
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await readSession(context.request, context.env)
  if (!user) {
    return json({ ok: false, error: "unauthenticated" }, { status: 401 })
  }

  const kv = context.env.ACCESS_CONTROL_KV
  if (!kv) {
    return json({ ok: false, error: "kv_not_configured" }, { status: 503 })
  }

  const ownerKey = await getOwnerKey(kv)
  if (ownerKey !== userKey(user)) {
    return json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  let body: { slug?: string; allowedIdentifiers?: string[] }
  try {
    body = await context.request.json()
  } catch {
    return json({ ok: false, error: "invalid_body" }, { status: 400 })
  }

  const { slug, allowedIdentifiers } = body
  if (typeof slug !== "string" || !slug.trim()) {
    return json({ ok: false, error: "missing_slug" }, { status: 400 })
  }

  if (!Array.isArray(allowedIdentifiers)) {
    return json({ ok: false, error: "missing_allowed_identifiers" }, { status: 400 })
  }

  const sanitized = allowedIdentifiers
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter((id) => id.length > 0)

  await kv.put(`rule:${slug.trim()}`, JSON.stringify({ allowedIdentifiers: sanitized }))

  return json({ ok: true })
}
