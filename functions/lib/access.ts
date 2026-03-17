import { readSession, type AuthEnv, type AuthUser } from "../api/auth/_lib"

export type StoredUser = {
  key: string
  name: string
  provider: "google" | "instagram"
  email?: string
  username?: string
  picture?: string
  blocked: boolean
  verified: boolean
  createdAt: string
  lastSeenAt: string
}

export type AccessEnv = AuthEnv & {
  ACCESS_CONTROL_KV?: KVNamespace
}

export function userKey(user: AuthUser): string {
  return `${user.provider}:${user.sub}`
}

export async function getOwnerKey(kv: KVNamespace): Promise<string | null> {
  return kv.get("config:owner")
}

export async function getStoredUser(kv: KVNamespace, key: string): Promise<StoredUser | null> {
  return kv.get<StoredUser>(`user:${key}`, "json")
}

export async function listStoredUsers(kv: KVNamespace): Promise<StoredUser[]> {
  const userList = await kv.list({ prefix: "user:" })
  const userPromises = userList.keys.map(async (entry) => kv.get<StoredUser>(entry.name, "json"))
  const userResults = await Promise.all(userPromises)
  return userResults.filter((user): user is StoredUser => user !== null)
}

export async function recordStoredUserVisit(kv: KVNamespace, user: AuthUser): Promise<void> {
  const key = `user:${userKey(user)}`
  const now = new Date().toISOString()
  const existing = await kv.get<StoredUser>(key, "json")

  if (existing) {
    existing.lastSeenAt = now
    existing.name = user.name
    existing.provider = user.provider
    if (user.email) {
      existing.email = user.email
    }
    if (user.username) {
      existing.username = user.username
    }
    if (user.picture) {
      existing.picture = user.picture
    }
    if (typeof existing.verified !== "boolean") {
      existing.verified = false
    }
    await kv.put(key, JSON.stringify(existing))
    return
  }

  const nextUser: StoredUser = {
    key: userKey(user),
    name: user.name,
    provider: user.provider,
    email: user.email,
    username: user.username,
    picture: user.picture,
    blocked: false,
    verified: false,
    createdAt: now,
    lastSeenAt: now,
  }

  await kv.put(key, JSON.stringify(nextUser))
}

export async function requireOwner(
  request: Request,
  env: AccessEnv,
  options?: { bootstrap?: boolean },
):
  | { ok: true; kv: KVNamespace; user: AuthUser; key: string }
  | { ok: false; reason: "unauthenticated" | "kv_not_configured" | "forbidden" } {
  const user = await readSession(request, env)
  if (!user) {
    return { ok: false, reason: "unauthenticated" }
  }

  const kv = env.ACCESS_CONTROL_KV
  if (!kv) {
    return { ok: false, reason: "kv_not_configured" }
  }

  const key = userKey(user)
  let ownerKey = await getOwnerKey(kv)

  if (!ownerKey && options?.bootstrap) {
    await kv.put("config:owner", key)
    ownerKey = key
  }

  if (ownerKey !== key) {
    return { ok: false, reason: "forbidden" }
  }

  return { ok: true, kv, user, key }
}

export async function getMemberAccess(
  request: Request,
  env: AccessEnv,
): Promise<
  | {
      ok: true
      kv: KVNamespace
      user: AuthUser
      key: string
      isOwner: boolean
      storedUser: StoredUser | null
    }
  | { ok: false; reason: "unauthenticated" | "kv_not_configured" | "not_authorized" }
> {
  const user = await readSession(request, env)
  if (!user) {
    return { ok: false, reason: "unauthenticated" }
  }

  const kv = env.ACCESS_CONTROL_KV
  if (!kv) {
    return { ok: false, reason: "kv_not_configured" }
  }

  const key = userKey(user)
  const ownerKey = await getOwnerKey(kv)
  if (ownerKey === key) {
    return {
      ok: true,
      kv,
      user,
      key,
      isOwner: true,
      storedUser: await getStoredUser(kv, key),
    }
  }

  const storedUser = await getStoredUser(kv, key)
  if (!storedUser || storedUser.blocked || !storedUser.verified) {
    return { ok: false, reason: "not_authorized" }
  }

  return { ok: true, kv, user, key, isOwner: false, storedUser }
}
