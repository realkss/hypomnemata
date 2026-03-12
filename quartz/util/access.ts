import { FullSlug } from "./path"
import { QuartzPluginData } from "../plugins/vfile"

export type AccessLevel = "public" | "restricted" | "owner"

export type AccessManifestEntry = {
  slug: FullSlug
  title: string
  access: Exclude<AccessLevel, "public">
}

function normalizeAccessValue(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export function getAccessLevel(frontmatter?: QuartzPluginData["frontmatter"] | null): AccessLevel {
  const normalized = normalizeAccessValue(frontmatter?.access)

  if (normalized === "owner" || normalized === "admin") {
    return "owner"
  }

  if (
    normalized === "restricted" ||
    normalized === "private" ||
    normalized === "members" ||
    normalized === "shared"
  ) {
    return "restricted"
  }

  return "public"
}

export function isAccessControlled(frontmatter?: QuartzPluginData["frontmatter"] | null): boolean {
  return getAccessLevel(frontmatter) !== "public"
}

export function isPublicFileData(file: QuartzPluginData): boolean {
  return !isAccessControlled(file.frontmatter)
}

export function filterPublicFiles<T extends QuartzPluginData>(files: T[]): T[] {
  return files.filter((file) => isPublicFileData(file))
}

export function getAccessManifestEntry(file: QuartzPluginData): AccessManifestEntry | null {
  const access = getAccessLevel(file.frontmatter)
  if (access === "public" || !file.slug) {
    return null
  }

  return {
    slug: file.slug as FullSlug,
    title: file.frontmatter?.title ?? file.slug,
    access,
  }
}
