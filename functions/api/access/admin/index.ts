import { readSession, json, type AuthEnv } from "../../auth/_lib"
import { getOwnerKey, listStoredUsers, userKey, type StoredUser } from "../../../lib/access"
import { listMemberContentEntries, type StoredMemberContent } from "../../../lib/memberContent"

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

async function getStoredRule(kv: KVNamespace, slug: string): Promise<StoredRule | null> {
  try {
    return await kv.get<StoredRule>(`rule:${slug}`, "json")
  } catch (error) {
    console.error(`Failed to parse access rule for ${slug}`, error)
    return null
  }
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
  let libraryEntries: StoredMemberContent[] = []
  const pages: Array<{
    slug: string
    title: string
    access: "restricted" | "owner"
    allowedIdentifiers: string[]
  }> = []

  if (kv) {
    users = await listStoredUsers(kv)
    libraryEntries = await listMemberContentEntries(kv)

    // Load rules for each page
    for (const page of manifestPages) {
      const rule = await getStoredRule(kv, page.slug)
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
      key,
      name: user.name,
      provider: user.provider,
      email: user.email,
      username: user.username,
    },
    users,
    pages,
    library: {
      entries: libraryEntries,
    },
  })
}
