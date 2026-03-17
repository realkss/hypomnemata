export type MemberContentStatus = "draft" | "published"

export type StoredMemberContent = {
  slug: string
  title: string
  summary: string
  body: string
  status: MemberContentStatus
  authorKey: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

function compareDatesDescending(left?: string, right?: string): number {
  const leftTime = left ? Date.parse(left) : 0
  const rightTime = right ? Date.parse(right) : 0
  return rightTime - leftTime
}

export function memberContentKey(slug: string): string {
  return `member-content:${slug}`
}

export function normalizeMemberContentSlug(rawValue: string): string | null {
  const normalized = rawValue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")

  if (!normalized) {
    return null
  }

  return normalized.slice(0, 80)
}

export async function getMemberContentEntry(
  kv: KVNamespace,
  slug: string,
): Promise<StoredMemberContent | null> {
  return kv.get<StoredMemberContent>(memberContentKey(slug), "json")
}

export async function listMemberContentEntries(kv: KVNamespace): Promise<StoredMemberContent[]> {
  const listing = await kv.list({ prefix: "member-content:" })
  const entries = await Promise.all(
    listing.keys.map(async (entry) => kv.get<StoredMemberContent>(entry.name, "json")),
  )

  return entries
    .filter((entry): entry is StoredMemberContent => entry !== null)
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === "published" ? -1 : 1
      }

      return compareDatesDescending(left.updatedAt, right.updatedAt)
    })
}

export function listPublishedMemberContent(entries: StoredMemberContent[]): StoredMemberContent[] {
  return entries
    .filter((entry) => entry.status === "published")
    .sort((left, right) => {
      const publishOrder = compareDatesDescending(left.publishedAt, right.publishedAt)
      if (publishOrder !== 0) {
        return publishOrder
      }

      return compareDatesDescending(left.updatedAt, right.updatedAt)
    })
}
