type Provider = "google" | "instagram"

export type AuthUser = {
  provider: Provider
  sub: string
  name: string
  email?: string
  username?: string
  picture?: string
}

export type AuthEnv = {
  AUTH_SESSION_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  INSTAGRAM_CLIENT_ID?: string
  INSTAGRAM_CLIENT_SECRET?: string
}

type SignedEnvelope<T> = {
  exp: number
  payload: T
}

type AuthState = {
  provider: Provider
  returnTo: string
  state: string
}

const SESSION_COOKIE_NAME = "__Host-hypomnemata_session"
const STATE_COOKIE_NAME = "__Host-hypomnemata_oauth_state"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const STATE_MAX_AGE_SECONDS = 60 * 10
const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function toBase64(bytes: Uint8Array): string {
  let output = ""

  for (let i = 0; i < bytes.length; i++) {
    output += String.fromCharCode(bytes[i])
  }

  return btoa(output)
}

function fromBase64(value: string): Uint8Array {
  const decoded = atob(value)
  const bytes = new Uint8Array(decoded.length)

  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i)
  }

  return bytes
}

function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  return fromBase64(padded)
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(encoder.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

async function sign(secret: string, value: string): Promise<string> {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign("HMAC", key, toArrayBuffer(encoder.encode(value)))
  return toBase64Url(new Uint8Array(signature))
}

async function verify(secret: string, value: string, signature: string): Promise<boolean> {
  const key = await importHmacKey(secret)
  return crypto.subtle.verify(
    "HMAC",
    key,
    toArrayBuffer(fromBase64Url(signature)),
    toArrayBuffer(encoder.encode(value)),
  )
}

async function seal<T>(secret: string, payload: T, maxAgeSeconds: number): Promise<string> {
  const envelope: SignedEnvelope<T> = {
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    payload,
  }
  const body = toBase64Url(encoder.encode(JSON.stringify(envelope)))
  const signature = await sign(secret, body)
  return `${body}.${signature}`
}

async function unseal<T>(secret: string, value?: string | null): Promise<T | null> {
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
    const envelope = JSON.parse(decoder.decode(fromBase64Url(body))) as SignedEnvelope<T> | null
    if (!envelope || envelope.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return envelope.payload
  } catch {
    return null
  }
}

function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.get("cookie")
  if (!header) {
    return {}
  }

  return header.split(/;\s*/).reduce<Record<string, string>>((acc, part) => {
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

function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAge: number
    httpOnly?: boolean
  },
): string {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${options.maxAge}`,
  ]

  if (options.httpOnly ?? true) {
    attributes.push("HttpOnly")
  }

  return attributes.join("; ")
}

function clearCookie(name: string) {
  return `${name}=; Path=/; SameSite=Lax; Secure; Max-Age=0; HttpOnly`
}

function getSecret(env: AuthEnv): string | null {
  return env.AUTH_SESSION_SECRET?.trim() || null
}

export function getProviderAvailability(env: AuthEnv) {
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

export function getOrigin(request: Request) {
  return new URL(request.url).origin
}

export function getReturnTo(request: Request, rawValue: string | null) {
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

export function json(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)

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

export function redirect(location: string, cookies: string[] = []) {
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

export function buildAuthResultUrl(
  request: Request,
  returnTo: string,
  outcome: {
    provider: Provider
    auth?: "success"
    auth_error?: string
  },
) {
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

export async function issueAuthStateCookie(env: AuthEnv, payload: AuthState) {
  const secret = getSecret(env)
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.")
  }

  const value = await seal(secret, payload, STATE_MAX_AGE_SECONDS)
  return serializeCookie(STATE_COOKIE_NAME, value, { maxAge: STATE_MAX_AGE_SECONDS })
}

export async function readAuthState(request: Request, env: AuthEnv) {
  const secret = getSecret(env)
  if (!secret) {
    return null
  }

  const cookies = parseCookies(request)
  return unseal<AuthState>(secret, cookies[STATE_COOKIE_NAME])
}

export async function issueSessionCookie(env: AuthEnv, user: AuthUser) {
  const secret = getSecret(env)
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.")
  }

  const value = await seal(secret, user, SESSION_MAX_AGE_SECONDS)
  return serializeCookie(SESSION_COOKIE_NAME, value, { maxAge: SESSION_MAX_AGE_SECONDS })
}

export async function readSession(request: Request, env: AuthEnv) {
  const secret = getSecret(env)
  if (!secret) {
    return null
  }

  const cookies = parseCookies(request)
  return unseal<AuthUser>(secret, cookies[SESSION_COOKIE_NAME])
}

export function clearAuthStateCookie() {
  return clearCookie(STATE_COOKIE_NAME)
}

export function clearSessionCookie() {
  return clearCookie(SESSION_COOKIE_NAME)
}
