import { json } from "../../auth/_lib"
import { requireOwner, type AccessEnv } from "../../../lib/access"
import { memberContentKey, normalizeMemberContentSlug } from "../../../lib/memberContent"

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

  let body: { slug?: string }
  try {
    body = await context.request.json()
  } catch {
    return json({ ok: false, error: "invalid_body" }, { status: 400 })
  }

  const normalizedSlug = normalizeMemberContentSlug(body.slug ?? "")
  if (!normalizedSlug) {
    return json({ ok: false, error: "missing_slug" }, { status: 400 })
  }

  await owner.kv.delete(memberContentKey(normalizedSlug))
  return json({ ok: true })
}
