import { readFile, writeFile, mkdir, access } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import matter from "gray-matter"
import { globby } from "globby"

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, "content")
const DEFAULT_TARGETS = ["ko", "fr", "de", "la", "ru"]
const MODEL = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4.1-mini"

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ko: "Korean",
  fr: "French",
  de: "German",
  la: "Latin",
  ru: "Russian",
}

function parseArgs() {
  const args = new Set(process.argv.slice(2))
  const targetsArg = process.argv.find((arg) => arg.startsWith("--targets="))
  const targets = targetsArg
    ? targetsArg.replace("--targets=", "").split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_TARGETS

  return {
    force: args.has("--force"),
    dryRun: args.has("--dry-run"),
    targets,
  }
}

function getSourceFiles() {
  return globby([
    "content/index.md",
    "content/keeper.md",
    "content/en/**/*.md",
    "content/ko/Baduk/**/*.md",
  ], { cwd: ROOT, absolute: true })
}

function detectSourceLanguage(sourceFile: string, markdown: string) {
  const parsed = matter(markdown)
  const explicit = typeof parsed.data.sourceLanguage === "string"
    ? parsed.data.sourceLanguage
    : typeof parsed.data.lang === "string"
      ? parsed.data.lang
      : undefined
  if (explicit) return explicit

  const rel = path.relative(CONTENT_DIR, sourceFile).replace(/\\/g, "/")
  const first = rel.split("/")[0]
  return first in LANGUAGE_NAMES ? first : "en"
}

function destinationFor(sourceFile: string, sourceLang: string, targetLang: string) {
  const rel = path.relative(CONTENT_DIR, sourceFile)
  if (rel === "index.md") return path.join(CONTENT_DIR, targetLang, "index.md")
  if (rel === "keeper.md") return path.join(CONTENT_DIR, targetLang, "keeper.md")
  if (rel.startsWith(`${sourceLang}${path.sep}`)) {
    return path.join(CONTENT_DIR, targetLang, rel.slice(sourceLang.length + 1))
  }
  throw new Error(`Unsupported source path: ${sourceFile}`)
}

function translatedFromValue(sourceFile: string) {
  return path.relative(CONTENT_DIR, sourceFile).replace(/\\/g, "/")
}

async function exists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function translateMarkdown(markdown: string, sourceLang: string, targetLang: string, translatedFrom: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to your environment before running translations.")
  }

  const targetName = LANGUAGE_NAMES[targetLang] ?? targetLang
  const sourceName = LANGUAGE_NAMES[sourceLang] ?? sourceLang

  const system = [
    "You translate Markdown files for a static knowledge website.",
    "Return only valid Markdown with frontmatter.",
    "Preserve structure, headings, code fences, math, HTML blocks, and links.",
    "Translate prose naturally into the target language.",
    "Do not add commentary outside the Markdown file.",
  ].join(" ")

  const user = [
    `Translate this Markdown from ${sourceName} to ${targetName}.`,
    `Set frontmatter fields: lang: ${targetLang}, sourceLanguage: ${sourceLang}, translatedFrom: ${translatedFrom}, translationStatus: ai-translated.`,
    "If frontmatter already exists, preserve existing keys and update title/description text where appropriate.",
    "Preserve internal links and file paths exactly unless they are visible prose.",
    "Return only the translated Markdown file.",
    "--- BEGIN FILE ---",
    markdown,
    "--- END FILE ---",
  ].join("\n\n")

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "system", content: [{ type: "input_text", text: system }] },
        { role: "user", content: [{ type: "input_text", text: user }] },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${text}`)
  }

  const json = await response.json() as { output_text?: string }
  const output = json.output_text?.trim()
  if (!output) {
    throw new Error("OpenAI API returned no output_text.")
  }

  return output.endsWith("\n") ? output : `${output}\n`
}

function ensureMetadata(markdown: string, sourceFile: string, sourceLang: string, lang: string) {
  const parsed = matter(markdown)
  parsed.data.lang = parsed.data.lang ?? lang
  parsed.data.sourceLanguage = parsed.data.sourceLanguage ?? sourceLang
  parsed.data.translatedFrom = parsed.data.translatedFrom ?? translatedFromValue(sourceFile)
  parsed.data.translationStatus = parsed.data.translationStatus ?? "ai-translated"
  return matter.stringify(parsed.content, parsed.data)
}

async function main() {
  const { force, dryRun, targets } = parseArgs()
  const sourceFiles = await getSourceFiles()

  for (const sourceFile of sourceFiles) {
    const markdown = await readFile(sourceFile, "utf8")
    const translatedFrom = translatedFromValue(sourceFile)
    const sourceLang = detectSourceLanguage(sourceFile, markdown)

    for (const lang of targets) {
      if (lang === sourceLang) continue

      const dest = destinationFor(sourceFile, sourceLang, lang)
      const alreadyExists = await exists(dest)
      if (alreadyExists && !force) {
        console.log(`skip ${lang}: ${translatedFrom}`)
        continue
      }

      console.log(`${dryRun ? "plan" : "translate"} ${translatedFrom} -> ${path.relative(ROOT, dest)}`)
      if (dryRun) continue

      const translated = await translateMarkdown(markdown, sourceLang, lang, translatedFrom)
      const withMetadata = ensureMetadata(translated, sourceFile, sourceLang, lang)
      await mkdir(path.dirname(dest), { recursive: true })
      await writeFile(dest, withMetadata, "utf8")
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
