import { json } from "../../auth/_lib"
import { requireOwner, type AccessEnv } from "../../../lib/access"
import {
  getMemberContentEntry,
  memberContentKey,
  normalizeMemberContentSlug,
  type MemberContentStatus,
  type StoredMemberContent,
} from "../../../lib/memberContent"

type Env = AccessEnv

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const owner = await requireOwner(context.request, context.env)
  if (!owner.ok) {
    const status =
      owner.reason === "unauthenticated"
        ? 401
        : owner.reason === "forbidden"
          ? 403
          : 503
    return json({ ok: false, error: owner.reason }, { status })
  }

  let body: {
    slug?: string
    title?: string
    summary?: string
    body?: string
    status?: MemberContentStatus
  }
  try {
    body = await context.request.json()
  } catch {
    return json({ ok: false, error: "invalid_body" }, { status: 400 })
  }

  const normalizedSlug = normalizeMemberContentSlug(body.slug ?? "")
  if (!normalizedSlug) {
    return json({ ok: false, error: "missing_slug" }, { status: 400 })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!title) {
    return json({ ok: false, error: "missing_title" }, { status: 400 })
  }

  const contentBody = typeof body.body === "string" ? body.body.trim() : ""
  if (!contentBody) {
    return json({ ok: false, error: "missing_body" }, { status: 400 })
  }

  const status = body.status
  if (status !== "draft" && status !== "published") {
    return json({ ok: false, error: "invalid_status" }, { status: 400 })
  }

  const summary = typeof body.summary === "string" ? body.summary.trim() : ""
  const now = new Date().toISOString()
  const existing = await getMemberContentEntry(owner.kv, normalizedSlug)

  const nextEntry: StoredMemberContent = {
    slug: normalizedSlug,
    title,
    summary,
    body: contentBody,
    status,
    authorKey: existing?.authorKey ?? owner.key,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt:
      status === "published" ? existing?.publishedAt ?? now : undefined,
  }

  await owner.kv.put(memberContentKey(normalizedSlug), JSON.stringify(nextEntry))

  return json({
    ok: true,
    entry: nextEntry,
  })
}
