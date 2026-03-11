const CSS_LINK_ID = "chess-pgn-viewer-styles"
const CSS_URLS = [
  "https://cdn.jsdelivr.net/npm/@lichess-org/pgn-viewer@2.4.7/dist/lichess-pgn-viewer.css",
  "https://cdn.jsdelivr.net/npm/lichess-pgn-viewer@2.4.5/lichess-pgn-viewer.css",
]

let viewerModulePromise: Promise<any> | undefined

function ensureViewerStyles() {
  if (document.getElementById(CSS_LINK_ID)) {
    return
  }

  const link = document.createElement("link")
  link.id = CSS_LINK_ID
  link.rel = "stylesheet"
  link.type = "text/css"
  link.href = CSS_URLS[0]
  link.onerror = () => {
    if (link.href !== CSS_URLS[1]) {
      link.href = CSS_URLS[1]
    }
  }
  document.head.appendChild(link)
}

async function loadViewer() {
  if (!viewerModulePromise) {
    viewerModulePromise = import("https://cdn.jsdelivr.net/npm/@lichess-org/pgn-viewer@2.4.7/+esm")
      .catch(() => import("https://cdn.jsdelivr.net/npm/lichess-pgn-viewer@2.4.5/+esm"))
      .then((mod) => mod.default ?? mod.LichessPgnViewer ?? mod)
  }

  return viewerModulePromise
}

async function mountBoard(node: HTMLElement) {
  if (node.dataset.viewerMounted === "true") {
    return
  }

  const src = node.dataset.pgnSrc
  if (!src) {
    return
  }

  node.dataset.viewerMounted = "true"
  node.dataset.viewerState = "loading"

  try {
    ensureViewerStyles()
    const [viewerFactory, response] = await Promise.all([
      loadViewer(),
      fetch(new URL(src, window.location.href)),
    ])

    if (!response.ok) {
      throw new Error(`Failed to fetch PGN (${response.status})`)
    }

    const pgn = await response.text()
    node.innerHTML = ""

    const config: Record<string, unknown> = {
      pgn,
      showClocks: false,
      showPlayers: true,
      showMoves: "auto",
    }

    const orientation = node.dataset.orientation
    if (orientation) {
      config.orientation = orientation
    }

    viewerFactory(node, config)
    node.dataset.viewerState = "ready"
  } catch (error) {
    console.error(error)
    node.dataset.viewerMounted = "false"
    node.dataset.viewerState = "error"
    node.innerHTML = `
      <div class="chess-training-board__fallback">
        <p>The interactive board could not be loaded.</p>
        <a href="${src}">Open the PGN directly</a>
      </div>
    `
  }
}

async function mountBoards() {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>(".chess-training-board[data-pgn-src]"),
  )

  if (nodes.length === 0) {
    return
  }

  await Promise.all(nodes.map((node) => mountBoard(node)))
}

document.addEventListener("nav", () => {
  void mountBoards()
})
