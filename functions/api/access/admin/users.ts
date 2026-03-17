import { readSession, json, type AuthEnv } from "../../auth/_lib"
import { getOwnerKey, getStoredUser, userKey } from "../../../lib/access"

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

  let body: { key?: string; blocked?: boolean; verified?: boolean }
  try {
    body = await context.request.json()
  } catch {
    return json({ ok: false, error: "invalid_body" }, { status: 400 })
  }

  const { key, blocked, verified } = body
  if (typeof key !== "string" || !key.trim()) {
    return json({ ok: false, error: "missing_key" }, { status: 400 })
  }

  if (typeof blocked !== "boolean") {
    return json({ ok: false, error: "missing_blocked" }, { status: 400 })
  }

  if (typeof verified !== "boolean") {
    return json({ ok: false, error: "missing_verified" }, { status: 400 })
  }

  // Prevent owner from blocking themselves
  if (key === userKey(user)) {
    return json({ ok: false, error: "cannot_block_self" }, { status: 400 })
  }

  const kvKey = `user:${key}`
  const existing = await getStoredUser(kv, key)
  if (!existing) {
    return json({ ok: false, error: "user_not_found" }, { status: 404 })
  }

  existing.blocked = blocked
  existing.verified = verified
  await kv.put(kvKey, JSON.stringify(existing))

  return json({ ok: true })
}
