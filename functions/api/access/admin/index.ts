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

type AccessManifestPage = {
  slug: string
  title: string
  access: "restricted" | "owner"
}

type StoredRule = {
  allowedIdentifiers: string[]
}

type Env = AuthEnv & {
  ACCESS_CONTROL_KV?: KVNamespace
  ASSETS: { fetch: (request: Request | string) => Promise<Response> }
}

function userKey(user: AuthUser): string {
  return `${user.provider}:${user.sub}`
}

async function getOwnerKey(kv: KVNamespace): Promise<string | null> {
  return kv.get("config:owner")
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await readSession(context.request, context.env)
  if (!user) {
    return json({ ok: false, error: "unauthenticated" }, { status: 401 })
  }

  const kv = context.env.ACCESS_CONTROL_KV
  const kvConfigured = Boolean(kv)

  const key = userKey(user)

  // Bootstrap: if no owner is set, the first authenticated user on this endpoint becomes owner
  if (kv) {
    let ownerKey = await getOwnerKey(kv)
    if (!ownerKey) {
      await kv.put("config:owner", key)
      ownerKey = key
    }

    // Only the owner can access this endpoint
    if (ownerKey !== key) {
      return json({ ok: false, error: "forbidden" }, { status: 403 })
    }
  }

  // Load the build-time access manifest
  let manifestPages: AccessManifestPage[] = []
  try {
    const manifestUrl = new URL("/static/access-control-index.json", context.request.url)
    const manifestResponse = await context.env.ASSETS.fetch(manifestUrl.toString())
    if (manifestResponse.ok) {
      const manifest = (await manifestResponse.json()) as { pages: AccessManifestPage[] }
      manifestPages = manifest.pages ?? []
    }
  } catch {
    // manifest not available — show empty pages list
  }

  // Load rules and users from KV
  let users: StoredUser[] = []
  const pages: Array<{
    slug: string
    title: string
    access: "restricted" | "owner"
    allowedIdentifiers: string[]
  }> = []

  if (kv) {
    // List all users
    const userList = await kv.list({ prefix: "user:" })
    const userPromises = userList.keys.map(async (entry) => {
      const value = await kv.get<StoredUser>(entry.name, "json")
      return value
    })
    const userResults = await Promise.all(userPromises)
    users = userResults.filter((u): u is StoredUser => u !== null)

    // Load rules for each page
    for (const page of manifestPages) {
      const rule = await kv.get<StoredRule>(`rule:${page.slug}`, "json")
      pages.push({
        slug: page.slug,
        title: page.title,
        access: page.access,
        allowedIdentifiers: rule?.allowedIdentifiers ?? [],
      })
    }
  } else {
    // No KV — just return manifest pages with empty rules
    for (const page of manifestPages) {
      pages.push({
        slug: page.slug,
        title: page.title,
        access: page.access,
        allowedIdentifiers: [],
      })
    }
  }

  return json({
    ok: true,
    storage: { configured: kvConfigured },
    currentUser: {
      name: user.name,
      provider: user.provider,
      email: user.email,
      username: user.username,
    },
    users,
    pages,
  })
}
