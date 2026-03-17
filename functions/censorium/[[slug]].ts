import { toHtml } from "hast-util-to-html"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { type AuthEnv } from "../api/auth/_lib"
import { getMemberAccess } from "../lib/access"
import {
  getMemberContentEntry,
  listMemberContentEntries,
  listPublishedMemberContent,
  type StoredMemberContent,
} from "../lib/memberContent"

type Env = AuthEnv & {
  ACCESS_CONTROL_KV?: KVNamespace
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function formatDate(value?: string): string {
  if (!value) {
    return "Unpublished"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unpublished"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function buildRedirect(requestUrl: URL, reason: "auth_required" | "member_verification_required") {
  const redirectUrl = new URL("/", requestUrl.origin)
  redirectUrl.searchParams.set("auth_error", reason)
  redirectUrl.searchParams.set("returnTo", `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`)
  return Response.redirect(redirectUrl.toString(), 302)
}

async function renderMarkdown(markdown: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)

  const tree = processor.parse(markdown)
  const hast = await processor.run(tree)
  return toHtml(hast as Parameters<typeof toHtml>[0])
}

function pageShell(options: {
  title: string
  description: string
  body: string
  isOwner: boolean
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(options.title)}</title>
    <meta name="description" content="${escapeHtml(options.description)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap" />
    <style>
      :root {
        color-scheme: light dark;
        --bg: #f5efe2;
        --panel: rgba(255, 255, 255, 0.78);
        --panel-strong: rgba(255, 255, 255, 0.9);
        --ink: #1d1a16;
        --muted: #5f5446;
        --line: rgba(113, 88, 48, 0.22);
        --accent: #8c6b38;
        --accent-strong: #6b4f23;
        --shadow: 0 18px 44px rgba(78, 60, 31, 0.12);
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #101318;
          --panel: rgba(20, 24, 31, 0.9);
          --panel-strong: rgba(17, 20, 27, 0.96);
          --ink: #f4ead7;
          --muted: #cdbfa4;
          --line: rgba(201, 164, 95, 0.24);
          --accent: #d0a45a;
          --accent-strong: #efc37c;
          --shadow: 0 18px 44px rgba(0, 0, 0, 0.34);
        }
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        background:
          radial-gradient(circle at top, rgba(198, 162, 99, 0.18), transparent 34%),
          linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--bg) 86%, #fff 14%));
        font-family: "EB Garamond", serif;
      }

      a {
        color: inherit;
      }

      .member-shell {
        width: min(980px, calc(100vw - 2rem));
        margin: 0 auto;
        padding: 1.2rem 0 3rem;
      }

      .member-nav,
      .member-card,
      .member-article {
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: var(--shadow);
        backdrop-filter: blur(10px);
      }

      .member-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.95rem 1.1rem;
        border-radius: 1.2rem;
      }

      .member-brand {
        font-family: "Cinzel", serif;
        font-size: 1.1rem;
        letter-spacing: 0.06em;
        text-decoration: none;
      }

      .member-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.9rem;
        font-size: 0.98rem;
      }

      .member-links a {
        text-decoration: none;
        color: var(--muted);
      }

      .member-links a:hover {
        color: var(--accent-strong);
      }

      .member-hero {
        padding: 1.4rem 0.1rem 1rem;
      }

      .member-hero__eyebrow {
        margin: 0;
        font-size: 0.82rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent);
      }

      .member-hero h1 {
        margin: 0.35rem 0 0.3rem;
        font-family: "Cinzel", serif;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      .member-hero p {
        margin: 0;
        color: var(--muted);
        font-size: 1.1rem;
      }

      .member-grid {
        display: grid;
        gap: 0.95rem;
      }

      .member-card {
        display: grid;
        gap: 0.6rem;
        padding: 1.1rem 1.15rem;
        border-radius: 1.15rem;
        text-decoration: none;
      }

      .member-card__head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 0.8rem;
      }

      .member-card h2 {
        margin: 0;
        font-size: 1.35rem;
      }

      .member-card p {
        margin: 0;
        color: var(--muted);
      }

      .member-chip {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
        padding: 0.28rem 0.65rem;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: color-mix(in srgb, var(--panel-strong) 84%, var(--accent) 16%);
        color: var(--accent-strong);
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .member-card__meta,
      .member-article__meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        color: var(--muted);
        font-size: 0.92rem;
      }

      .member-article {
        padding: 1.4rem min(4vw, 2rem);
        border-radius: 1.3rem;
      }

      .member-article h1,
      .member-article h2,
      .member-article h3 {
        font-family: "Cinzel", serif;
      }

      .member-article__lede {
        color: var(--muted);
        font-size: 1.06rem;
      }

      .member-article__body {
        line-height: 1.72;
        font-size: 1.14rem;
      }

      .member-article__body pre,
      .member-article__body code {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      }

      .member-article__body pre {
        overflow-x: auto;
        padding: 0.95rem 1rem;
        border-radius: 1rem;
        background: color-mix(in srgb, var(--panel-strong) 82%, #000 18%);
      }

      .member-empty {
        padding: 1.3rem 1.4rem;
        border-radius: 1.1rem;
        border: 1px dashed var(--line);
        color: var(--muted);
        background: color-mix(in srgb, var(--panel-strong) 90%, transparent);
      }

      .member-back {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        margin-bottom: 1rem;
        color: var(--muted);
        text-decoration: none;
      }

      .member-back:hover {
        color: var(--accent-strong);
      }

      @media (max-width: 720px) {
        .member-nav {
          align-items: start;
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main class="member-shell">
      <nav class="member-nav" aria-label="Member navigation">
        <a class="member-brand" href="/">Hypomnemata</a>
        <div class="member-links">
          <a href="/censorium">Member Library</a>
          ${options.isOwner ? '<a href="/censorium-access-control">Owner Console</a>' : ""}
          <a href="/">Home</a>
        </div>
      </nav>
      ${options.body}
    </main>
  </body>
</html>`
}

function renderLibraryIndex(entries: StoredMemberContent[], isOwner: boolean): string {
  const cards =
    entries.length > 0
      ? entries
          .map(
            (entry) => `
      <a class="member-card" href="/censorium/${encodeURIComponent(entry.slug)}">
        <div class="member-card__head">
          <div>
            <h2>${escapeHtml(entry.title)}</h2>
          </div>
          <span class="member-chip">${escapeHtml(entry.status)}</span>
        </div>
        <p>${escapeHtml(entry.summary || "Verified members can open this note from the private library.")}</p>
        <div class="member-card__meta">
          <span>Updated ${escapeHtml(formatDate(entry.updatedAt))}</span>
          ${
            entry.publishedAt
              ? `<span>Published ${escapeHtml(formatDate(entry.publishedAt))}</span>`
              : ""
          }
        </div>
      </a>`,
          )
          .join("")
      : `<div class="member-empty">No member notes are published yet.</div>`

  return `
    <section class="member-hero">
      <p class="member-hero__eyebrow">Verified Members</p>
      <h1>Private Library</h1>
      <p>Notes published here are visible only to verified members${isOwner ? " and the owner" : ""}.</p>
    </section>
    <section class="member-grid">${cards}</section>
  `
}

async function renderEntry(entry: StoredMemberContent, isOwner: boolean): Promise<string> {
  const html = await renderMarkdown(entry.body)
  return `
    <article class="member-article">
      <a class="member-back" href="/censorium">&larr; Back to the library</a>
      <div class="member-card__head">
        <div>
          <p class="member-hero__eyebrow">Verified Members</p>
          <h1>${escapeHtml(entry.title)}</h1>
        </div>
        <span class="member-chip">${escapeHtml(entry.status)}</span>
      </div>
      ${
        entry.summary
          ? `<p class="member-article__lede">${escapeHtml(entry.summary)}</p>`
          : ""
      }
      <div class="member-article__meta">
        <span>Updated ${escapeHtml(formatDate(entry.updatedAt))}</span>
        ${
          entry.publishedAt
            ? `<span>Published ${escapeHtml(formatDate(entry.publishedAt))}</span>`
            : isOwner
              ? `<span>Visible only to you until published</span>`
              : ""
        }
      </div>
      <div class="member-article__body">${html}</div>
    </article>
  `
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestUrl = new URL(context.request.url)
  const suffix = requestUrl.pathname.replace(/^\/censorium\/?/, "").replace(/\/+$/, "")

  const access = await getMemberAccess(context.request, context.env)
  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      return buildRedirect(requestUrl, "auth_required")
    }

    if (access.reason === "not_authorized") {
      return buildRedirect(requestUrl, "member_verification_required")
    }

    return new Response("Member library is unavailable right now.", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    })
  }

  if (!suffix) {
    const entries = listPublishedMemberContent(await listMemberContentEntries(access.kv))
    return new Response(
      pageShell({
        title: "Member Library",
        description: "Private notes for verified members.",
        isOwner: access.isOwner,
        body: renderLibraryIndex(entries, access.isOwner),
      }),
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    )
  }

  if (suffix.includes("/")) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    })
  }

  const entry = await getMemberContentEntry(access.kv, suffix)
  if (!entry || (entry.status !== "published" && !access.isOwner)) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    })
  }

  return new Response(
    pageShell({
      title: `${entry.title} | Member Library`,
      description:
        entry.summary || "A private note available to verified members of Hypomnemata.",
      isOwner: access.isOwner,
      body: await renderEntry(entry, access.isOwner),
    }),
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  )
}
