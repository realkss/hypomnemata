const LICHESS_MASTERS_URL = "https://explorer.lichess.ovh/masters"
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
const INSTAGRAM_AUTH_URL = "https://www.instagram.com/oauth/authorize"
const INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token"
const INSTAGRAM_PROFILE_URL = "https://graph.instagram.com/me"
const SESSION_COOKIE_NAME = "__Host-hypomnemata_session"
const STATE_COOKIE_NAME = "__Host-hypomnemata_oauth_state"
const ACCESS_CONTROL_INDEX_PATH = "/static/access-control-index.json"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const STATE_MAX_AGE_SECONDS = 60 * 10
const encoder = new TextEncoder()
const decoder = new TextDecoder()
let accessControlIndexCache = null
let accessControlIndexCacheAt = 0

function json(body, init = {}) {
  const headers = new Headers(init.headers || {})

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8")
  }

  if (!headers.has("cache-control")) {
    headers.set("cache-control", "no-store")
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  })
}

function toArrayBuffer(bytes) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function toBase64(bytes) {
  let output = ""

  for (let i = 0; i < bytes.length; i++) {
    output += String.fromCharCode(bytes[i])
  }

  return btoa(output)
}

function fromBase64(value) {
  const decoded = atob(value)
  const bytes = new Uint8Array(decoded.length)

  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i)
  }

  return bytes
}

function toBase64Url(bytes) {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  return fromBase64(padded)
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(encoder.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

async function sign(secret, value) {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign("HMAC", key, toArrayBuffer(encoder.encode(value)))
  return toBase64Url(new Uint8Array(signature))
}

async function verify(secret, value, signature) {
  const key = await importHmacKey(secret)
  return crypto.subtle.verify(
    "HMAC",
    key,
    toArrayBuffer(fromBase64Url(signature)),
    toArrayBuffer(encoder.encode(value)),
  )
}

async function seal(secret, payload, maxAgeSeconds) {
  const envelope = {
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    payload,
  }
  const body = toBase64Url(encoder.encode(JSON.stringify(envelope)))
  const signature = await sign(secret, body)
  return `${body}.${signature}`
}

async function unseal(secret, value) {
  if (!value) {
    return null
  }

  const [body, signature] = value.split(".")
  if (!body || !signature) {
    return null
  }

  const valid = await verify(secret, body, signature)
  if (!valid) {
    return null
  }

  try {
    const envelope = JSON.parse(decoder.decode(fromBase64Url(body)))
    if (!envelope || envelope.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return envelope.payload
  } catch {
    return null
  }
}

function parseCookies(request) {
  const header = request.headers.get("cookie")
  if (!header) {
    return {}
  }

  return header.split(/;\s*/).reduce((acc, part) => {
    const separatorIndex = part.indexOf("=")
    if (separatorIndex === -1) {
      return acc
    }

    const key = part.slice(0, separatorIndex)
    const value = part.slice(separatorIndex + 1)
    acc[key] = decodeURIComponent(value)
    return acc
  }, {})
}

function serializeCookie(name, value, options) {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${options.maxAge}`,
  ]

  if (options.httpOnly !== false) {
    attributes.push("HttpOnly")
  }

  return attributes.join("; ")
}

function clearCookie(name) {
  return `${name}=; Path=/; SameSite=Lax; Secure; Max-Age=0; HttpOnly`
}

function getSecret(env) {
  return env.AUTH_SESSION_SECRET?.trim() || null
}

function getProviderAvailability(env) {
  const hasSecret = Boolean(getSecret(env))

  return {
    google:
      hasSecret &&
      Boolean(env.GOOGLE_CLIENT_ID?.trim()) &&
      Boolean(env.GOOGLE_CLIENT_SECRET?.trim()),
    instagram:
      hasSecret &&
      Boolean(env.INSTAGRAM_CLIENT_ID?.trim()) &&
      Boolean(env.INSTAGRAM_CLIENT_SECRET?.trim()),
  }
}

function getOrigin(request) {
  return new URL(request.url).origin
}

function getReturnTo(request, rawValue) {
  const fallback = "/"
  if (!rawValue) {
    return fallback
  }

  try {
    const requestUrl = new URL(request.url)
    const target = new URL(rawValue, requestUrl.origin)
    if (target.origin !== requestUrl.origin) {
      return fallback
    }

    return `${target.pathname}${target.search}${target.hash}` || fallback
  } catch {
    return fallback
  }
}

function redirect(location, cookies = []) {
  const headers = new Headers({
    location,
    "cache-control": "no-store",
  })

  for (const cookie of cookies) {
    headers.append("set-cookie", cookie)
  }

  return new Response(null, {
    status: 302,
    headers,
  })
}

function buildAuthResultUrl(request, returnTo, outcome) {
  const target = new URL(returnTo, getOrigin(request))
  target.searchParams.set("auth_provider", outcome.provider)

  if (outcome.auth) {
    target.searchParams.set("auth", outcome.auth)
  }

  if (outcome.auth_error) {
    target.searchParams.set("auth_error", outcome.auth_error)
  }

  return target.toString()
}

async function issueAuthStateCookie(env, payload) {
  const secret = getSecret(env)
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.")
  }

  const value = await seal(secret, payload, STATE_MAX_AGE_SECONDS)
  return serializeCookie(STATE_COOKIE_NAME, value, { maxAge: STATE_MAX_AGE_SECONDS })
}

async function readAuthState(request, env) {
  const secret = getSecret(env)
  if (!secret) {
    return null
  }

  const cookies = parseCookies(request)
  return unseal(secret, cookies[STATE_COOKIE_NAME])
}

async function issueSessionCookie(env, user) {
  const secret = getSecret(env)
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.")
  }

  const value = await seal(secret, user, SESSION_MAX_AGE_SECONDS)
  return serializeCookie(SESSION_COOKIE_NAME, value, { maxAge: SESSION_MAX_AGE_SECONDS })
}

async function readSession(request, env) {
  const secret = getSecret(env)
  if (!secret) {
    return null
  }

  const cookies = parseCookies(request)
  return unseal(secret, cookies[SESSION_COOKIE_NAME])
}

function clearAuthStateCookie() {
  return clearCookie(STATE_COOKIE_NAME)
}

function clearSessionCookie() {
  return clearCookie(SESSION_COOKIE_NAME)
}

function normalizeIdentifier(value) {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  if (normalized.startsWith("email:")) {
    const emailValue = normalized.slice("email:".length).trim()
    return emailValue || null
  }

  return normalized
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.length > 0)))
}

function getUserIdentityKeys(user) {
  const identifiers = []

  if (user?.email) {
    identifiers.push(normalizeIdentifier(user.email))
  }

  if (user?.username) {
    identifiers.push(normalizeIdentifier(`${user.provider}:${user.username}`))
  }

  if (user?.provider && user?.sub) {
    identifiers.push(normalizeIdentifier(`${user.provider}:sub:${user.sub}`))
  }

  return uniqueStrings(identifiers.filter(Boolean))
}

function getPrimaryUserKey(user) {
  return getUserIdentityKeys(user)[0] ?? null
}

function getOwnerIdentifiers(env) {
  const envValues = [
    env.ACCESS_OWNER_EMAIL,
    env.ACCESS_OWNER_IDENTIFIERS,
  ]

  return uniqueStrings(
    envValues
      .flatMap((value) => (typeof value === "string" ? value.split(",") : []))
      .map((value) => normalizeIdentifier(value))
      .filter(Boolean),
  )
}

function isOwnerUser(user, env) {
  if (!user) {
    return false
  }

  const ownerIdentifiers = new Set(getOwnerIdentifiers(env))
  if (ownerIdentifiers.size === 0) {
    return false
  }

  return getUserIdentityKeys(user).some((identifier) => ownerIdentifiers.has(identifier))
}

function getAccessControlKv(env) {
  return env.ACCESS_CONTROL_KV ?? null
}

async function readJsonBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function getStoredUser(env, key) {
  const kv = getAccessControlKv(env)
  if (!kv || !key) {
    return null
  }

  return (await kv.get(`user:${key}`, "json")) ?? null
}

async function registerKnownUser(env, user) {
  const kv = getAccessControlKv(env)
  const key = getPrimaryUserKey(user)
  if (!kv || !key) {
    return
  }

  const existing = (await getStoredUser(env, key)) ?? {}
  const now = new Date().toISOString()
  const next = {
    ...existing,
    key,
    identities: getUserIdentityKeys(user),
    provider: user.provider,
    sub: user.sub,
    name: user.name,
    email: user.email,
    username: user.username,
    picture: user.picture,
    blocked: Boolean(existing.blocked),
    verified: Boolean(existing.verified),
    createdAt: existing.createdAt ?? now,
    lastSeenAt: now,
  }

  await kv.put(`user:${key}`, JSON.stringify(next))
}

async function listKnownUsers(env) {
  const kv = getAccessControlKv(env)
  if (!kv) {
    return []
  }

  const listing = await kv.list({ prefix: "user:" })
  const users = await Promise.all(listing.keys.map((entry) => kv.get(entry.name, "json")))

  return users
    .filter(Boolean)
    .sort((left, right) => {
      const leftName = (left.name || left.key || "").toLowerCase()
      const rightName = (right.name || right.key || "").toLowerCase()
      return leftName.localeCompare(rightName)
    })
}

function normalizeAllowedIdentifiers(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return uniqueStrings(
    values
      .map((value) => normalizeIdentifier(value))
      .filter(Boolean),
  )
}

async function getStoredRule(env, slug) {
  const kv = getAccessControlKv(env)
  if (!kv || !slug) {
    return null
  }

  const rule = (await kv.get(`rule:${slug}`, "json")) ?? null
  if (!rule) {
    return null
  }

  return {
    slug,
    allowedIdentifiers: normalizeAllowedIdentifiers(rule.allowedIdentifiers),
    updatedAt: rule.updatedAt ?? null,
  }
}

async function putStoredRule(env, slug, allowedIdentifiers) {
  const kv = getAccessControlKv(env)
  if (!kv) {
    throw new Error("missing_kv")
  }

  await kv.put(
    `rule:${slug}`,
    JSON.stringify({
      slug,
      allowedIdentifiers: normalizeAllowedIdentifiers(allowedIdentifiers),
      updatedAt: new Date().toISOString(),
    }),
  )
}

async function updateStoredUserAccessState(env, key, blocked, verified) {
  const kv = getAccessControlKv(env)
  if (!kv) {
    throw new Error("missing_kv")
  }

  const existing = await getStoredUser(env, key)
  if (!existing) {
    return false
  }

  await kv.put(
    `user:${key}`,
    JSON.stringify({
      ...existing,
      blocked: Boolean(blocked),
      verified: Boolean(verified),
      updatedAt: new Date().toISOString(),
    }),
  )

  return true
}

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

function canonicalizePageSlug(pathname) {
  let normalizedPath = decodePathname(pathname)

  if (!normalizedPath || normalizedPath === "/") {
    return "index"
  }

  if (normalizedPath.endsWith("/")) {
    normalizedPath = `${normalizedPath}index`
  }

  normalizedPath = normalizedPath.replace(/^\/+/, "")
  if (!normalizedPath) {
    return "index"
  }

  if (normalizedPath.endsWith(".html")) {
    normalizedPath = normalizedPath.slice(0, -".html".length)
  } else {
    const lastSegment = normalizedPath.split("/").at(-1) ?? ""
    if (/\.[a-z0-9]+$/i.test(lastSegment)) {
      return null
    }
  }

  return normalizedPath || "index"
}

function canonicalizeAssetSlug(pathname) {
  let normalizedPath = decodePathname(pathname)

  if (!normalizedPath || normalizedPath === "/" || normalizedPath.endsWith("/")) {
    return null
  }

  normalizedPath = normalizedPath.replace(/^\/+/, "")
  return normalizedPath || null
}

function buildAccessChallengeUrl(request, reason) {
  const target = new URL("/", getOrigin(request))
  target.searchParams.set("auth_error", reason)
  target.searchParams.set("returnTo", `${new URL(request.url).pathname}${new URL(request.url).search}`)
  return target.toString()
}

async function loadAccessControlIndex(env) {
  const now = Date.now()
  if (accessControlIndexCache && now - accessControlIndexCacheAt < 5000) {
    return accessControlIndexCache
  }

  const request = new Request(`https://assets.local${ACCESS_CONTROL_INDEX_PATH}`)
  const response = await env.ASSETS.fetch(request)
  if (!response.ok) {
    accessControlIndexCache = { pages: [], assets: [] }
    accessControlIndexCacheAt = now
    return accessControlIndexCache
  }

  try {
    accessControlIndexCache = await response.json()
  } catch {
    accessControlIndexCache = { pages: [], assets: [] }
  }

  accessControlIndexCacheAt = now
  return accessControlIndexCache
}

async function getProtectedPage(request, env) {
  const slug = canonicalizePageSlug(new URL(request.url).pathname)
  if (!slug) {
    return null
  }

  const accessControlIndex = await loadAccessControlIndex(env)
  return accessControlIndex.pages.find((page) => page.slug === slug) ?? null
}

async function getProtectedAsset(request, env) {
  const slug = canonicalizeAssetSlug(new URL(request.url).pathname)
  if (!slug) {
    return null
  }

  const accessControlIndex = await loadAccessControlIndex(env)
  return accessControlIndex.assets.find((asset) => asset.slug === slug) ?? null
}

async function canAccessProtectedEntry(request, env, entry) {
  const user = await readSession(request, env)
  if (user) {
    await registerKnownUser(env, user)
  }

  if (isOwnerUser(user, env)) {
    return { allowed: true, user }
  }

  if (entry.access === "owner") {
    return { allowed: false, user, reason: user ? "not_authorized" : "auth_required" }
  }

  if (!user) {
    return { allowed: false, user: null, reason: "auth_required" }
  }

  const storedUser = await getStoredUser(env, getPrimaryUserKey(user))
  if (!storedUser || storedUser.blocked || !storedUser.verified) {
    return { allowed: false, user, reason: "not_authorized" }
  }

  const rule = await getStoredRule(env, entry.pageSlug ?? entry.slug)
  const allowedIdentifiers = new Set(rule?.allowedIdentifiers ?? [])
  const allowed = getUserIdentityKeys(user).some((identifier) => allowedIdentifiers.has(identifier))
  return {
    allowed,
    user,
    reason: allowed ? null : "not_authorized",
  }
}

function withNoStore(response) {
  const headers = new Headers(response.headers)
  headers.set("cache-control", "private, no-store")
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function requireOwner(request, env) {
  const user = await readSession(request, env)
  if (user) {
    await registerKnownUser(env, user)
  }

  if (!isOwnerUser(user, env)) {
    return {
      ok: false,
      user,
    }
  }

  return {
    ok: true,
    user,
  }
}

function failureRedirect(request, provider, returnTo, reason) {
  return redirect(
    buildAuthResultUrl(request, returnTo, {
      provider,
      auth_error: reason,
    }),
    [clearAuthStateCookie()],
  )
}

async function handleChessMasters(request, env) {
  const token = env.LICHESS_API_TOKEN
  if (!token) {
    return json(
      {
        error: "LICHESS_API_TOKEN is not configured on this Cloudflare Pages project.",
      },
      { status: 500 },
    )
  }

  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(LICHESS_MASTERS_URL)
  targetUrl.search = incomingUrl.search

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

async function handleAuthSession(request, env) {
  const user = await readSession(request, env)
  if (user) {
    await registerKnownUser(env, user)
  }

  return json({
    configured: getProviderAvailability(env),
    user,
    owner: isOwnerUser(user, env),
  })
}

function handleAuthLogout() {
  return json(
    {
      ok: true,
    },
    {
      headers: {
        "cache-control": "no-store",
        "content-type": "application/json; charset=utf-8",
        "set-cookie": clearSessionCookie(),
      },
    },
  )
}

async function handleGoogleStart(request, env) {
  const requestUrl = new URL(request.url)
  const returnTo = getReturnTo(request, requestUrl.searchParams.get("returnTo"))
  const configured = getProviderAvailability(env)

  if (!configured.google) {
    return redirect(
      buildAuthResultUrl(request, returnTo, {
        provider: "google",
        auth_error: "config_missing",
      }),
    )
  }

  const state = crypto.randomUUID()
  const redirectUri = `${getOrigin(request)}/api/auth/google/callback`
  const authUrl = new URL(GOOGLE_AUTH_URL)

  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "openid email profile")
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("include_granted_scopes", "true")
  authUrl.searchParams.set("prompt", "select_account")

  const stateCookie = await issueAuthStateCookie(env, {
    provider: "google",
    returnTo,
    state,
  })

  return redirect(authUrl.toString(), [stateCookie])
}

async function handleGoogleCallback(request, env) {
  const configured = getProviderAvailability(env)
  const requestUrl = new URL(request.url)
  const fallbackReturnTo = "/"

  if (!configured.google) {
    return failureRedirect(request, "google", fallbackReturnTo, "config_missing")
  }

  const oauthState = await readAuthState(request, env)
  const returnTo = oauthState?.returnTo ?? fallbackReturnTo

  if (!oauthState || oauthState.provider !== "google") {
    return failureRedirect(request, "google", returnTo, "state_mismatch")
  }

  const returnedState = requestUrl.searchParams.get("state")
  if (!returnedState || returnedState !== oauthState.state) {
    return failureRedirect(request, "google", returnTo, "state_mismatch")
  }

  const providerError = requestUrl.searchParams.get("error")
  if (providerError) {
    return failureRedirect(request, "google", returnTo, providerError)
  }

  const code = requestUrl.searchParams.get("code")
  if (!code) {
    return failureRedirect(request, "google", returnTo, "missing_code")
  }

  const redirectUri = `${getOrigin(request)}/api/auth/google/callback`
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  })

  if (!tokenResponse.ok) {
    return failureRedirect(request, "google", returnTo, "code_exchange_failed")
  }

  const tokenPayload = await tokenResponse.json()
  if (!tokenPayload.access_token) {
    return failureRedirect(request, "google", returnTo, "missing_access_token")
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      authorization: `Bearer ${tokenPayload.access_token}`,
    },
  })

  if (!profileResponse.ok) {
    return failureRedirect(request, "google", returnTo, "profile_fetch_failed")
  }

  const profile = await profileResponse.json()
  if (!profile.sub) {
    return failureRedirect(request, "google", returnTo, "profile_incomplete")
  }

  const user = {
    provider: "google",
    sub: profile.sub,
    name: profile.name || profile.email || "Google user",
    email: profile.email,
    picture: profile.picture,
  }

  await registerKnownUser(env, user)
  const sessionCookie = await issueSessionCookie(env, user)

  return redirect(
    buildAuthResultUrl(request, returnTo, {
      provider: "google",
      auth: "success",
    }),
    [clearAuthStateCookie(), sessionCookie],
  )
}

async function handleInstagramStart(request, env) {
  const requestUrl = new URL(request.url)
  const returnTo = getReturnTo(request, requestUrl.searchParams.get("returnTo"))
  const configured = getProviderAvailability(env)

  if (!configured.instagram) {
    return redirect(
      buildAuthResultUrl(request, returnTo, {
        provider: "instagram",
        auth_error: "config_missing",
      }),
    )
  }

  const state = crypto.randomUUID()
  const redirectUri = `${getOrigin(request)}/api/auth/instagram/callback`
  const authUrl = new URL(INSTAGRAM_AUTH_URL)

  authUrl.searchParams.set("client_id", env.INSTAGRAM_CLIENT_ID)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("scope", "instagram_business_basic")
  authUrl.searchParams.set("state", state)

  const stateCookie = await issueAuthStateCookie(env, {
    provider: "instagram",
    returnTo,
    state,
  })

  return redirect(authUrl.toString(), [stateCookie])
}

async function handleInstagramCallback(request, env) {
  const configured = getProviderAvailability(env)
  const requestUrl = new URL(request.url)
  const fallbackReturnTo = "/"

  if (!configured.instagram) {
    return failureRedirect(request, "instagram", fallbackReturnTo, "config_missing")
  }

  const oauthState = await readAuthState(request, env)
  const returnTo = oauthState?.returnTo ?? fallbackReturnTo

  if (!oauthState || oauthState.provider !== "instagram") {
    return failureRedirect(request, "instagram", returnTo, "state_mismatch")
  }

  const returnedState = requestUrl.searchParams.get("state")
  if (!returnedState || returnedState !== oauthState.state) {
    return failureRedirect(request, "instagram", returnTo, "state_mismatch")
  }

  const providerError = requestUrl.searchParams.get("error")
  if (providerError) {
    return failureRedirect(request, "instagram", returnTo, providerError)
  }

  const code = requestUrl.searchParams.get("code")
  if (!code) {
    return failureRedirect(request, "instagram", returnTo, "missing_code")
  }

  const redirectUri = `${getOrigin(request)}/api/auth/instagram/callback`
  const tokenBody = new FormData()
  tokenBody.set("client_id", env.INSTAGRAM_CLIENT_ID)
  tokenBody.set("client_secret", env.INSTAGRAM_CLIENT_SECRET)
  tokenBody.set("grant_type", "authorization_code")
  tokenBody.set("redirect_uri", redirectUri)
  tokenBody.set("code", code)

  const tokenResponse = await fetch(INSTAGRAM_TOKEN_URL, {
    method: "POST",
    body: tokenBody,
  })

  if (!tokenResponse.ok) {
    return failureRedirect(request, "instagram", returnTo, "code_exchange_failed")
  }

  const tokenPayload = await tokenResponse.json()
  if (!tokenPayload.access_token) {
    return failureRedirect(request, "instagram", returnTo, "missing_access_token")
  }

  const profileUrl = new URL(INSTAGRAM_PROFILE_URL)
  profileUrl.searchParams.set("fields", "id,username")
  profileUrl.searchParams.set("access_token", tokenPayload.access_token)

  const profileResponse = await fetch(profileUrl.toString())
  if (!profileResponse.ok) {
    return failureRedirect(request, "instagram", returnTo, "profile_fetch_failed")
  }

  const profile = await profileResponse.json()
  if (!profile.id || !profile.username) {
    return failureRedirect(request, "instagram", returnTo, "profile_incomplete")
  }

  const user = {
    provider: "instagram",
    sub: profile.id,
    name: `@${profile.username}`,
    username: profile.username,
  }

  await registerKnownUser(env, user)
  const sessionCookie = await issueSessionCookie(env, user)

  return redirect(
    buildAuthResultUrl(request, returnTo, {
      provider: "instagram",
      auth: "success",
    }),
    [clearAuthStateCookie(), sessionCookie],
  )
}

async function handleAccessAdminState(request, env) {
  const owner = await requireOwner(request, env)
  if (!owner.ok) {
    return json({ error: "forbidden" }, { status: 403 })
  }

  const accessControlIndex = await loadAccessControlIndex(env)
  const pages = await Promise.all(
    accessControlIndex.pages.map(async (page) => {
      const rule = await getStoredRule(env, page.slug)
      return {
        ...page,
        allowedIdentifiers: page.access === "restricted" ? (rule?.allowedIdentifiers ?? []) : [],
      }
    }),
  )

  return json({
    ok: true,
    storage: {
      configured: Boolean(getAccessControlKv(env)),
    },
    currentUser: {
      name: owner.user.name,
      provider: owner.user.provider,
      email: owner.user.email,
      username: owner.user.username,
    },
    users: await listKnownUsers(env),
    pages,
  })
}

async function handleAccessAdminRules(request, env) {
  const owner = await requireOwner(request, env)
  if (!owner.ok) {
    return json({ error: "forbidden" }, { status: 403 })
  }

  if (!getAccessControlKv(env)) {
    return json({ error: "storage_unavailable" }, { status: 503 })
  }

  const body = await readJsonBody(request)
  const slug = typeof body?.slug === "string" ? body.slug : null
  if (!slug) {
    return json({ error: "invalid_slug" }, { status: 400 })
  }

  const accessControlIndex = await loadAccessControlIndex(env)
  const page = accessControlIndex.pages.find((entry) => entry.slug === slug)
  if (!page || page.access !== "restricted") {
    return json({ error: "unknown_page" }, { status: 404 })
  }

  await putStoredRule(env, slug, body?.allowedIdentifiers)
  return json({ ok: true })
}

async function handleAccessAdminUsers(request, env) {
  const owner = await requireOwner(request, env)
  if (!owner.ok) {
    return json({ error: "forbidden" }, { status: 403 })
  }

  if (!getAccessControlKv(env)) {
    return json({ error: "storage_unavailable" }, { status: 503 })
  }

  const body = await readJsonBody(request)
  const key = normalizeIdentifier(body?.key)
  if (!key || typeof body?.blocked !== "boolean" || typeof body?.verified !== "boolean") {
    return json({ error: "invalid_user_update" }, { status: 400 })
  }

  const updated = await updateStoredUserAccessState(env, key, body.blocked, body.verified)
  if (!updated) {
    return json({ error: "unknown_user" }, { status: 404 })
  }

  return json({ ok: true })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === "/api/chess/masters") {
      return handleChessMasters(request, env)
    }

    if (url.pathname === "/api/auth/session" && request.method === "GET") {
      return handleAuthSession(request, env)
    }

    if (
      url.pathname === "/api/auth/logout" &&
      (request.method === "GET" || request.method === "POST")
    ) {
      return handleAuthLogout()
    }

    if (url.pathname === "/api/auth/google/start" && request.method === "GET") {
      return handleGoogleStart(request, env)
    }

    if (url.pathname === "/api/auth/google/callback" && request.method === "GET") {
      return handleGoogleCallback(request, env)
    }

    if (url.pathname === "/api/auth/instagram/start" && request.method === "GET") {
      return handleInstagramStart(request, env)
    }

    if (url.pathname === "/api/auth/instagram/callback" && request.method === "GET") {
      return handleInstagramCallback(request, env)
    }

    if (url.pathname === "/api/access/admin" && request.method === "GET") {
      return handleAccessAdminState(request, env)
    }

    if (url.pathname === "/api/access/admin/rules" && request.method === "POST") {
      return handleAccessAdminRules(request, env)
    }

    if (url.pathname === "/api/access/admin/users" && request.method === "POST") {
      return handleAccessAdminUsers(request, env)
    }

    if (url.pathname === ACCESS_CONTROL_INDEX_PATH) {
      return new Response("Not found", {
        status: 404,
        headers: {
          "cache-control": "no-store",
        },
      })
    }

    if (request.method === "GET" || request.method === "HEAD") {
      const protectedPage = await getProtectedPage(request, env)
      if (protectedPage) {
        const access = await canAccessProtectedEntry(request, env, protectedPage)
        if (!access.allowed) {
          return redirect(buildAccessChallengeUrl(request, access.reason ?? "not_authorized"))
        }

        return withNoStore(await env.ASSETS.fetch(request))
      }

      const protectedAsset = await getProtectedAsset(request, env)
      if (protectedAsset) {
        const access = await canAccessProtectedEntry(request, env, protectedAsset)
        if (!access.allowed) {
          return redirect(buildAccessChallengeUrl(request, access.reason ?? "not_authorized"))
        }

        return withNoStore(await env.ASSETS.fetch(request))
      }
    }

    return env.ASSETS.fetch(request)
  },
}
