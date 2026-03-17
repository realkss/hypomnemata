import { readSession, type AuthEnv } from "./api/auth/_lib"
import { getOwnerKey, getStoredUser, recordStoredUserVisit, userKey } from "./lib/access"

type StoredRule = {
  allowedIdentifiers: string[]
}

type AccessManifestPage = {
  slug: string
  title: string
  access: "restricted" | "owner"
}

type AccessManifestAsset = {
  slug: string
  pageSlug: string
  access: "restricted" | "owner"
}

type AccessManifest = {
  pages: AccessManifestPage[]
  assets: AccessManifestAsset[]
}

type ProtectedRequestEntry = {
  accessKey: string
  access: "restricted" | "owner"
}

type Env = AuthEnv & {
  ACCESS_CONTROL_KV?: KVNamespace
  ASSETS: { fetch: (request: Request | string) => Promise<Response> }
}

function decodePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

function pageSlugFromPath(pathname: string): string {
  let slug = decodePathname(pathname)

  if (!slug || slug === "/") {
    return "index"
  }

  if (slug.endsWith("/")) {
    slug = `${slug}index`
  }

  slug = slug.replace(/^\/+/, "")

  if (slug.endsWith(".html")) {
    slug = slug.slice(0, -".html".length)
  }

  return slug || "index"
}

function assetSlugFromPath(pathname: string): string | null {
  let slug = decodePathname(pathname)

  if (!slug || slug === "/" || slug.endsWith("/")) {
    return null
  }

  slug = slug.replace(/^\/+/, "")
  return slug || null
}

function getProtectedRequestEntry(
  manifest: AccessManifest,
  pathname: string,
): ProtectedRequestEntry | null {
  const pageSlug = pageSlugFromPath(pathname)
  const pageEntry =
    manifest.pages.find((page) => page.slug === pageSlug) ??
    manifest.pages.find((page) => page.slug === `${pageSlug}/index`)

  if (pageEntry) {
    return {
      accessKey: pageEntry.slug,
      access: pageEntry.access,
    }
  }

  const assetSlug = assetSlugFromPath(pathname)
  if (!assetSlug) {
    return null
  }

  const assetEntry = manifest.assets.find((asset) => asset.slug === assetSlug)
  if (!assetEntry) {
    return null
  }

  return {
    accessKey: assetEntry.pageSlug,
    access: assetEntry.access,
  }
}

let cachedManifest: AccessManifest | null = null
let cachedManifestTimestamp = 0
const MANIFEST_CACHE_MS = 60_000

async function getAccessManifest(env: Env, requestUrl: string): Promise<AccessManifest> {
  const now = Date.now()
  if (cachedManifest && now - cachedManifestTimestamp < MANIFEST_CACHE_MS) {
    return cachedManifest
  }

  try {
    const manifestUrl = new URL("/static/access-control-index.json", requestUrl)
    const response = await env.ASSETS.fetch(manifestUrl.toString())
    if (response.ok) {
      const data = (await response.json()) as AccessManifest
      cachedManifest = {
        pages: data.pages ?? [],
        assets: data.assets ?? [],
      }
      cachedManifestTimestamp = now
      return cachedManifest
    }
  } catch {
    // ignore
  }

  return {
    pages: [],
    assets: [],
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context
  const url = new URL(request.url)

  if (request.method !== "GET" && request.method !== "HEAD") return next()
  if (url.pathname.startsWith("/api/")) return next()
  if (url.pathname.startsWith("/static/")) return next()

  const kv = env.ACCESS_CONTROL_KV
  if (!kv) return next()

  const user = await readSession(request, env)
  if (user) {
    context.waitUntil(recordStoredUserVisit(kv, user))
  }

  const manifest = await getAccessManifest(env, request.url)
  const protectedEntry = getProtectedRequestEntry(manifest, url.pathname)

  if (!protectedEntry) return next()

  if (!user) {
    const redirectUrl = new URL("/", url.origin)
    redirectUrl.searchParams.set("auth_error", "auth_required")
    redirectUrl.searchParams.set("returnTo", `${url.pathname}${url.search}${url.hash}`)
    return Response.redirect(redirectUrl.toString(), 302)
  }

  const key = userKey(user)
  const ownerKey = await getOwnerKey(kv)

  if (ownerKey === key) return next()

  if (protectedEntry.access === "owner") {
    const redirectUrl = new URL("/", url.origin)
    redirectUrl.searchParams.set("auth_error", "not_authorized")
    redirectUrl.searchParams.set("returnTo", `${url.pathname}${url.search}${url.hash}`)
    return Response.redirect(redirectUrl.toString(), 302)
  }

  const storedUser = await getStoredUser(kv, key)
  if (storedUser?.blocked) {
    const redirectUrl = new URL("/", url.origin)
    redirectUrl.searchParams.set("auth_error", "not_authorized")
    redirectUrl.searchParams.set("returnTo", `${url.pathname}${url.search}${url.hash}`)
    return Response.redirect(redirectUrl.toString(), 302)
  }

  const rule = await kv.get<StoredRule>(`rule:${protectedEntry.accessKey}`, "json")
  if (!rule) {
    const redirectUrl = new URL("/", url.origin)
    redirectUrl.searchParams.set("auth_error", "not_authorized")
    redirectUrl.searchParams.set("returnTo", `${url.pathname}${url.search}${url.hash}`)
    return Response.redirect(redirectUrl.toString(), 302)
  }

  const identifiers = new Set(rule.allowedIdentifiers)
  if (identifiers.has(key)) return next()
  if (user.email && identifiers.has(user.email)) return next()
  if (user.username && identifiers.has(`instagram:${user.username}`)) return next()

  const redirectUrl = new URL("/", url.origin)
  redirectUrl.searchParams.set("auth_error", "not_authorized")
  redirectUrl.searchParams.set("returnTo", `${url.pathname}${url.search}${url.hash}`)
  return Response.redirect(redirectUrl.toString(), 302)
}
