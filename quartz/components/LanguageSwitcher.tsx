import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const BASE_PATH = "/hypomnemata"

const LANGS = [
  { code: "index", label: "English", href: `${BASE_PATH}/` },
  { code: "ko", label: "\uD55C\uAD6D\uC5B4", href: `${BASE_PATH}/ko/` },
  { code: "fr", label: "Fran\u00E7ais", href: `${BASE_PATH}/fr/` },
  { code: "de", label: "Deutsch", href: `${BASE_PATH}/de/` },
  { code: "la", label: "Latina", href: `${BASE_PATH}/la/` },
  { code: "ru", label: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", href: `${BASE_PATH}/ru/` },
]

const LanguageSwitcher: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const slug = fileData.slug ?? "index"

  let current = "index"
  if (slug !== "index") {
    const first = slug.split("/")[0]
    if (["ko", "fr", "de", "la", "ru"].includes(first)) {
      current = first
    }
  }

  const currentLanguage = LANGS.find((lang) => lang.code === current)?.label ?? "English"

  return (
    <details class="wiki-lang-switcher">
      <summary class="wiki-lang-button">Language: {currentLanguage}</summary>
      <nav class="wiki-lang-menu" aria-label="Language selector">
        {LANGS.map((lang) => (
          <a href={lang.href} class={current === lang.code ? "active" : ""}>
            {lang.label}
          </a>
        ))}
      </nav>
    </details>
  )
}

LanguageSwitcher.displayName = "LanguageSwitcher"

export default (() => LanguageSwitcher) satisfies QuartzComponentConstructor
