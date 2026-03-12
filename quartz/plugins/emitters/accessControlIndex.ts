import { FullSlug, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { AccessManifestEntry, getAccessManifestEntry } from "../../util/access"
import { write } from "./helpers"

export const AccessControlIndex: QuartzEmitterPlugin = () => {
  return {
    name: "AccessControlIndex",
    async *emit(ctx, content) {
      const restrictedPages = content
        .map(([, file]) => getAccessManifestEntry(file.data))
        .filter((entry): entry is AccessManifestEntry => entry !== null)
        .sort((left, right) => left.slug.localeCompare(right.slug))

      const slug = joinSegments("static", "access-control-index") as FullSlug
      yield write({
        ctx,
        content: JSON.stringify({
          pages: restrictedPages,
        }),
        slug,
        ext: ".json",
      })
    },
  }
}
