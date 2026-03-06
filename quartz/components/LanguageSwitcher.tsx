import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const BASE_PATH = "/hypomnemata"

const LANGS = [
  { code: "index", label: "English", href: `${BASE_PATH}/` },
  { code: "ko", label: "한국어", href: `${BASE_PATH}/ko/` },
  { code: "fr", label: "Français", href: `${BASE_PATH}/fr/` },
  { code: "de", label: "Deutsch", href: `${BASE_PATH}/de/` },
  { code: "la", label: "Latina", href: `${BASE_PATH}/la/` },
  { code: "ru", label: "Русский", href: `${BASE_PATH}/ru/` },
]

const LanguageSwitcher: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const slug = fileData.slug ?? "index"

  let current = "index"
  if (slug === "index") {
    current = "index"
  } else {
    const first = slug.split("/")[0]
    if (["ko", "fr", "de", "la", "ru"].includes(first)) {
      current = first
    }
  }

  return (
    <div class="wiki-lang-switcher">
      <button class="wiki-lang-button" type="button">Languages ▾</button>
      <div class="wiki-lang-menu">
        {LANGS.map((lang) => (
          <a href={lang.href} class={current === lang.code ? "active" : ""}>
            {lang.label}
          </a>
        ))}
      </div>
    </div>
  )
}

LanguageSwitcher.displayName = "LanguageSwitcher"

export default (() => LanguageSwitcher) satisfies QuartzComponentConstructor