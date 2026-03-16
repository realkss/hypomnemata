import { readSession, json, type AuthEnv, type AuthUser } from "../../auth/_lib"

type StoredUser = {
  key: string
  name: string
  provider: "google" | "instagram"
  email?: string
  username?: string
  picture?: string
  blocked: boolean
  createdAt: string
  lastSeenAt: string
}

type Env = AuthEnv & {
  ACCESS_CONTROL_KV?: KVNamespace
}

function userKey(user: AuthUser): string {
  return `${user.provider}:${user.sub}`
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

  const ownerKey = await kv.get("config:owner")
  if (ownerKey !== userKey(user)) {
    return json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  let body: { key?: string; blocked?: boolean }
  try {
    body = await context.request.json()
  } catch {
    return json({ ok: false, error: "invalid_body" }, { status: 400 })
  }

  const { key, blocked } = body
  if (typeof key !== "string" || !key.trim()) {
    return json({ ok: false, error: "missing_key" }, { status: 400 })
  }

  if (typeof blocked !== "boolean") {
    return json({ ok: false, error: "missing_blocked" }, { status: 400 })
  }

  // Prevent owner from blocking themselves
  if (key === userKey(user)) {
    return json({ ok: false, error: "cannot_block_self" }, { status: 400 })
  }

  const kvKey = `user:${key}`
  const existing = await kv.get<StoredUser>(kvKey, "json")
  if (!existing) {
    return json({ ok: false, error: "user_not_found" }, { status: 404 })
  }

  existing.blocked = blocked
  await kv.put(kvKey, JSON.stringify(existing))

  return json({ ok: true })
}
