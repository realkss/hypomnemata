import { cp, mkdir, readdir, stat } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const ROOT = process.cwd()
const SOURCE = process.env.OBSIDIAN_PUBLIC_DIR ?? "C:/Users/silen/Documents/Obsidian Vault/public"
const DEST = path.join(ROOT, "content", "en")
const SKIP_NAMES = new Set([".obsidian", ".trash"])
const SKIP_ROOT_FILES = new Set(["index.md"])

async function copyEntry(sourcePath: string, destPath: string, isRoot = false) {
  const name = path.basename(sourcePath)
  if (SKIP_NAMES.has(name)) return
  const info = await stat(sourcePath)

  if (info.isDirectory()) {
    await mkdir(destPath, { recursive: true })
    const entries = await readdir(sourcePath)
    for (const entry of entries) {
      await copyEntry(path.join(sourcePath, entry), path.join(destPath, entry), false)
    }
    return
  }

  if (isRoot && SKIP_ROOT_FILES.has(name)) return
  await mkdir(path.dirname(destPath), { recursive: true })
  await cp(sourcePath, destPath, { force: true })
}

async function main() {
  const entries = await readdir(SOURCE)
  for (const entry of entries) {
    await copyEntry(path.join(SOURCE, entry), path.join(DEST, entry), true)
  }
  console.log(`Synced Obsidian public from ${SOURCE} -> ${DEST}`)
  console.log("Note: this is a safe one-way sync into the English content tree. For true two-way editing, point Obsidian at content/en directly.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})