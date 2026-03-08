import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

type TranslationStatus = "original" | "ai-translated" | "reviewed"

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ko: "Korean",
  fr: "French",
  de: "German",
  la: "Latin",
  ru: "Russian",
}

function inferLang(fileData: QuartzComponentProps["fileData"]) {
  const explicit = typeof fileData.frontmatter?.lang === "string" ? fileData.frontmatter.lang : undefined
  if (explicit) return explicit

  const slug = fileData.slug ?? ""
  const first = slug.split("/")[0]
  if (first in LANGUAGE_LABELS) return first
  return "en"
}

function buildLabel(lang: string, status?: string, sourceLanguage?: string) {
  const target = LANGUAGE_LABELS[lang] ?? lang.toUpperCase()
  const source = LANGUAGE_LABELS[sourceLanguage ?? "en"] ?? (sourceLanguage ?? "English")
  const normalized = (status as TranslationStatus | undefined) ?? (lang === "en" ? "original" : undefined)

  switch (normalized) {
    case "original":
      return `Written directly in ${target}`
    case "ai-translated":
      return `Translated from ${source} with AI`
    case "reviewed":
      return `Translated from ${source} with AI, reviewed and edited by hand`
    default:
      return lang === "en" ? "Written in English" : `Written directly in ${target}`
  }
}

const TranslationBadge = ({ fileData, displayClass }: QuartzComponentProps) => {
  const lang = inferLang(fileData)
  const status = typeof fileData.frontmatter?.translationStatus === "string"
    ? fileData.frontmatter.translationStatus
    : undefined
  const sourceLanguage = typeof fileData.frontmatter?.sourceLanguage === "string"
    ? fileData.frontmatter.sourceLanguage
    : undefined

  const label = buildLabel(lang, status, sourceLanguage)

  return <p class={classNames(displayClass, "translation-badge")}>{label}</p>
}

TranslationBadge.css = `
.translation-badge {
  margin: 0.35rem 0 0;
  color: var(--gray);
  font-size: 0.82rem;
  font-style: italic;
  letter-spacing: 0.01em;
}

:root[saved-theme="dark"] .translation-badge {
  color: color-mix(in srgb, var(--darkgray) 82%, var(--secondary) 18%);
}
`

TranslationBadge.displayName = "TranslationBadge"

export default (() => TranslationBadge) satisfies QuartzComponentConstructor

