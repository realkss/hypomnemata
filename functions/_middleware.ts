import { readSession, type AuthEnv, type AuthUser } from "./api/auth/_lib"

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

type StoredRule = {
  allowedIdentifiers: string[]
}

type AccessManifestPage = {
  slug: string
  title: string
  access: "restricted" | "owner"
}

type Env = AuthEnv & {
  ACCESS_CONTROL_KV?: KVNamespace
  ASSETS: { fetch: (request: Request | string) => Promise<Response> }
}

function userKey(user: AuthUser): string {
  return `${user.provider}:${user.sub}`
}

function slugFromPath(pathname: string): string {
  // Remove leading slash and trailing slash
  let slug = pathname.replace(/^\/+/, "").replace(/\/+$/, "")
  // Remove trailing /index or .html
  slug = slug.replace(/\/index$/, "").replace(/\.html$/, "")
  // Root path -> "index"
  return slug || "index"
}

// Cache the access manifest per request context to avoid repeated fetches
let cachedManifest: AccessManifestPage[] | null = null
let cachedManifestTimestamp = 0
const MANIFEST_CACHE_MS = 60_000

async function getAccessManifest(env: Env, requestUrl: string): Promise<AccessManifestPage[]> {
  const now = Date.now()
  if (cachedManifest && now - cachedManifestTimestamp < MANIFEST_CACHE_MS) {
    return cachedManifest
  }

  try {
    const manifestUrl = new URL("/static/access-control-index.json", requestUrl)
    const response = await env.ASSETS.fetch(manifestUrl.toString())
    if (response.ok) {
      const data = (await response.json()) as { pages: AccessManifestPage[] }
      cachedManifest = data.pages ?? []
      cachedManifestTimestamp = now
      return cachedManifest
    }
  } catch {
    // ignore
  }

  return []
}

async function recordUser(kv: KVNamespace, user: AuthUser): Promise<void> {
  const key = `user:${userKey(user)}`
  const now = new Date().toISOString()
  const existing = await kv.get<StoredUser>(key, "json")

  if (existing) {
    // Update last seen and any changed profile fields
    existing.lastSeenAt = now
    existing.name = user.name
    if (user.email) existing.email = user.email
    if (user.username) existing.username = user.username
    if (user.picture) existing.picture = user.picture
    await kv.put(key, JSON.stringify(existing))
  } else {
    const newUser: StoredUser = {
      key: userKey(user),
      name: user.name,
      provider: user.provider,
      email: user.email,
      username: user.username,
      picture: user.picture,
      blocked: false,
      createdAt: now,
      lastSeenAt: now,
    }
    await kv.put(key, JSON.stringify(newUser))
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context
  const url = new URL(request.url)

  // Skip non-GET requests, API routes, and static assets
  if (request.method !== "GET") return next()
  if (url.pathname.startsWith("/api/")) return next()
  if (url.pathname.startsWith("/static/")) return next()
  if (url.pathname.match(/\.(css|js|json|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp|avif|mp4|webm)$/)) {
    return next()
  }

  const kv = env.ACCESS_CONTROL_KV
  if (!kv) return next()

  // Read session (non-blocking for public pages)
  const user = await readSession(request, env)

  // Record user visit in background
  if (user) {
    context.waitUntil(recordUser(kv, user))
  }

  // Check if the requested page is access-controlled
  const manifest = await getAccessManifest(env, request.url)
  const slug = slugFromPath(url.pathname)

  // Find matching manifest entry (try exact slug, then with /index suffix)
  const pageEntry =
    manifest.find((p) => p.slug === slug) ??
    manifest.find((p) => p.slug === `${slug}/index`)

  // Page is not in the access manifest — it's public
  if (!pageEntry) return next()

  // Page requires access control
  if (!user) {
    // Redirect to home with a hint to sign in
    return Response.redirect(new URL(`/?auth_required=${encodeURIComponent(url.pathname)}`, url.origin).toString(), 302)
  }

  const key = userKey(user)
  const ownerKey = await kv.get("config:owner")

  // Owner always has access
  if (ownerKey === key) return next()

  // Owner-only pages reject everyone else
  if (pageEntry.access === "owner") {
    return Response.redirect(new URL("/", url.origin).toString(), 302)
  }

  // Check if user is blocked
  const storedUser = await kv.get<StoredUser>(`user:${key}`, "json")
  if (storedUser?.blocked) {
    return Response.redirect(new URL("/", url.origin).toString(), 302)
  }

  // Check page-specific rules
  const rule = await kv.get<StoredRule>(`rule:${pageEntry.slug}`, "json")
  if (!rule) {
    // No rule configured — restricted page with no grants, deny
    return Response.redirect(new URL("/", url.origin).toString(), 302)
  }

  // Check if user's key, email, or username matches any allowed identifier
  const identifiers = new Set(rule.allowedIdentifiers)
  if (identifiers.has(key)) return next()
  if (user.email && identifiers.has(user.email)) return next()
  if (user.username && identifiers.has(`instagram:${user.username}`)) return next()

  // No match — deny
  return Response.redirect(new URL("/", url.origin).toString(), 302)
}
