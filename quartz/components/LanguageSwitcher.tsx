import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { joinSegments } from "../util/path"

const BASE_PATH = "/hypomnemata"
const NON_ENGLISH = ["ko", "fr", "de", "la", "ru"] as const
const ROOT_SHARED_PAGES = new Set(["keeper", "lexicon", "map"])

const LANGS = [
  { code: "en", label: "English" },
  { code: "ko", label: "\uD55C\uAD6D\uC5B4" },
  { code: "fr", label: "Fran\u00E7ais" },
  { code: "de", label: "Deutsch" },
  { code: "la", label: "Latina" },
  { code: "ru", label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
]

function parseSlug(slug?: string) {
  const normalized = slug ?? "index"
  if (normalized === "index") {
    return { current: "en", rest: "" }
  }

  const parts = normalized.split("/").filter(Boolean)
  const first = parts[0]

  if (NON_ENGLISH.includes(first as (typeof NON_ENGLISH)[number])) {
    return { current: first, rest: parts.slice(1).join("/") }
  }

  if (first === "en") {
    return { current: "en", rest: parts.slice(1).join("/") }
  }

  return { current: "en", rest: normalized }
}

function candidateSlug(lang: string, rest: string) {
  if (lang === "en") {
    return rest === "" ? "index" : ROOT_SHARED_PAGES.has(rest) ? rest : `en/${rest}`
  }

  return rest === "" ? lang : ROOT_SHARED_PAGES.has(rest) ? rest : `${lang}/${rest}`
}

function hrefFromSlug(slug: string) {
  if (slug === "index") return `${BASE_PATH}/`
  return joinSegments(BASE_PATH, slug)
}

const LanguageSwitcher: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const { current, rest } = parseSlug(fileData.slug)
  const currentLanguage = LANGS.find((lang) => lang.code === current)?.label ?? "English"
  const available = new Set(allFiles.map((file) => file.slug).filter(Boolean))

  return (
    <details class="wiki-lang-switcher">
      <summary class="wiki-lang-button">Language: {currentLanguage}</summary>
      <nav class="wiki-lang-menu" aria-label="Language selector">
        {LANGS.map((lang) => {
          const exact = candidateSlug(lang.code, rest)
          const fallback = candidateSlug(lang.code, "")
          const target = available.has(exact) ? exact : fallback

          return (
            <a href={hrefFromSlug(target)} class={current === lang.code ? "active" : ""}>
              {lang.label}
            </a>
          )
        })}
      </nav>
    </details>
  )
}

LanguageSwitcher.displayName = "LanguageSwitcher"

export default (() => LanguageSwitcher) satisfies QuartzComponentConstructor
