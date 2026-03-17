import path from "path"
import { FilePath, FullSlug, joinSegments, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { glob } from "../../util/glob"
import {
  AccessManifest,
  AccessManifestAsset,
  AccessManifestEntry,
  getAccessManifestEntry,
} from "../../util/access"
import { write } from "./helpers"

export const AccessControlIndex: QuartzEmitterPlugin = () => {
  return {
    name: "AccessControlIndex",
    async *emit(ctx, content) {
      const restrictedPages = content
        .map(([, file]) => getAccessManifestEntry(file.data))
        .filter((entry): entry is AccessManifestEntry => entry !== null)
        .sort((left, right) => left.slug.localeCompare(right.slug))

      const restrictedAssetRoots = content
        .map(([, file]) => {
          const entry = getAccessManifestEntry(file.data)
          const relativePath = file.data.relativePath

          if (!entry || !relativePath || path.posix.basename(relativePath) !== "index.md") {
            return null
          }

          const directory = path.posix.dirname(relativePath)
          return {
            directory: directory === "." ? "" : directory,
            pageSlug: entry.slug,
            access: entry.access,
          }
        })
        .filter(
          (
            root,
          ): root is {
            directory: string
            pageSlug: FullSlug
            access: AccessManifestEntry["access"]
          } => root !== null,
        )
        .sort((left, right) => right.directory.length - left.directory.length)

      const restrictedAssets: AccessManifestAsset[] = []
      if (restrictedAssetRoots.length > 0) {
        const assetPaths = await glob("**", ctx.argv.directory, [
          "**/*.md",
          ...ctx.cfg.configuration.ignorePatterns,
        ])

        for (const assetPath of assetPaths) {
          const inheritedRoot = restrictedAssetRoots.find((root) => {
            if (root.directory === "") {
              return true
            }

            return assetPath.startsWith(`${root.directory}/`)
          })

          if (!inheritedRoot) {
            continue
          }

          restrictedAssets.push({
            slug: slugifyFilePath(assetPath as FilePath),
            pageSlug: inheritedRoot.pageSlug,
            access: inheritedRoot.access,
          })
        }

        restrictedAssets.sort((left, right) => left.slug.localeCompare(right.slug))
      }

      const slug = joinSegments("static", "access-control-index") as FullSlug
      const manifest: AccessManifest = {
        pages: restrictedPages,
        assets: restrictedAssets,
      }

      yield write({
        ctx,
        content: JSON.stringify(manifest),
        slug,
        ext: ".json",
      })
    },
  }
}
