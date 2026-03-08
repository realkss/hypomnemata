import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const BASE_PATH = "/hypomnemata"
const NON_ENGLISH = ["ko", "fr", "de", "la", "ru"] as const
const ROOT_ENGLISH_PAGES = new Set(["keeper", "lexicon", "map"])
const LOCALIZED_TOP_LEVEL = new Set([
  "",
  "Topics/Physics",
  "Topics/Mathematics",
  "Topics/3D Graphics",
  "Topics/AI",
  "Literature",
  "Chess",
  "Baduk",
])

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

function joinUrl(...parts: string[]) {
  return parts.filter(Boolean).join("/").replace(/(?<!:)\/+/g, "/")
}

function hrefFor(lang: string, rest: string) {
  if (lang === "en") {
    if (rest === "") return `${BASE_PATH}/`
    if (ROOT_ENGLISH_PAGES.has(rest)) return joinUrl(BASE_PATH, rest)
    return joinUrl(BASE_PATH, "en", rest)
  }

  if (rest === "") return joinUrl(BASE_PATH, lang)
  if (ROOT_ENGLISH_PAGES.has(rest)) return joinUrl(BASE_PATH, rest)
  if (LOCALIZED_TOP_LEVEL.has(rest)) return joinUrl(BASE_PATH, lang, rest)
  return joinUrl(BASE_PATH, lang)
}

const LanguageSwitcher: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const { current, rest } = parseSlug(fileData.slug)
  const currentLanguage = LANGS.find((lang) => lang.code === current)?.label ?? "English"

  return (
    <details class="wiki-lang-switcher">
      <summary class="wiki-lang-button">Language: {currentLanguage}</summary>
      <nav class="wiki-lang-menu" aria-label="Language selector">
        {LANGS.map((lang) => (
          <a href={hrefFor(lang.code, rest)} class={current === lang.code ? "active" : ""}>
            {lang.label}
          </a>
        ))}
      </nav>
    </details>
  )
}

LanguageSwitcher.displayName = "LanguageSwitcher"

export default (() => LanguageSwitcher) satisfies QuartzComponentConstructor
