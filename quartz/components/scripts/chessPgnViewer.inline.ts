const CSS_LINK_ID = "chess-pgn-viewer-styles"
const CSS_URLS = [
  "https://cdn.jsdelivr.net/npm/@lichess-org/pgn-viewer@2.4.7/dist/lichess-pgn-viewer.css",
  "https://cdn.jsdelivr.net/npm/lichess-pgn-viewer@2.4.5/lichess-pgn-viewer.css",
]
const STOCKFISH_WORKER_URL = new URL(
  "./static/chess/stockfish/stockfish-18-lite-single.js",
  import.meta.url,
).toString()
const DEFAULT_MASTERS_ENDPOINT = "https://explorer.lichess.ovh/masters"
const ENGINE_DEPTH = 14
const ENGINE_HASH_MB = 16
const ENGINE_DEBOUNCE_MS = 220
const EXPLORER_MOVE_LIMIT = 8
const EXPLORER_GAME_LIMIT = 6

type ViewerApi = {
  toPath: (path: unknown, focus?: boolean) => void
  flip: () => void
  curData: () => {
    fen: string
    turn?: "white" | "black"
  }
}

type ViewerFactory = (node: HTMLElement, config: Record<string, unknown>) => ViewerApi

type EngineController = {
  details: HTMLDetailsElement
  toggleButton: HTMLButtonElement
  evalBarButton: HTMLButtonElement
  status: HTMLElement
  score: HTMLElement
  meta: HTMLElement
  pv: HTMLElement
  bar: HTMLElement
  barWhite: HTMLElement
  barBlack: HTMLElement
  worker: Worker | null
  ready: boolean
  enabled: boolean
  evalBarVisible: boolean
  pendingFen: string | null
  pendingTurn: "white" | "black"
  debounceId: number | null
}

type ExplorerMove = {
  uci?: string
  san?: string
  white?: number
  draws?: number
  black?: number
  averageRating?: number | null
  averageOpponentRating?: number | null
}

type ExplorerGameSide = {
  name?: string | null
  rating?: number | null
}

type ExplorerGame = {
  id?: string
  winner?: "white" | "black"
  white?: ExplorerGameSide
  black?: ExplorerGameSide
  year?: number
  month?: string
}

type ExplorerResponse = {
  white?: number
  draws?: number
  black?: number
  opening?: {
    eco?: string
    name?: string
  }
  moves?: ExplorerMove[]
  topGames?: ExplorerGame[]
  recentGames?: ExplorerGame[]
}

type ExplorerController = {
  details: HTMLDetailsElement
  status: HTMLElement
  opening: HTMLElement
  moves: HTMLElement
  games: HTMLElement
  currentFen: string | null
  requestId: number
}

type BoardEnhancement = {
  node: HTMLElement
  viewer: ViewerApi
  engine: EngineController
  explorer: ExplorerController
}

declare global {
  interface Window {
    __CHESS_MASTERS_ENDPOINT__?: string
  }
}

let viewerModulePromise: Promise<ViewerFactory> | undefined
const activeEngines = new Set<EngineController>()

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
      .then((mod) => (mod.default ?? mod.LichessPgnViewer ?? mod) as ViewerFactory)
  }

  return viewerModulePromise
}

function makeElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)
  if (className) {
    element.className = className
  }
  if (typeof text === "string") {
    element.textContent = text
  }
  return element
}

function ensureBoardShell(node: HTMLElement) {
  let shell = node.parentElement
  if (!shell || !shell.classList.contains("training-board-shell")) {
    shell = makeElement("section", "training-board-shell")
    node.parentNode?.insertBefore(shell, node)
    shell.appendChild(node)
  }

  let sidebar = shell.querySelector<HTMLElement>(":scope > .training-board-sidebar")
  if (!sidebar) {
    sidebar = makeElement("aside", "training-board-sidebar")
    shell.appendChild(sidebar)
  }

  return { shell, sidebar }
}

function createPanelSummary(title: string, subtitle: string) {
  const summary = makeElement("summary", "training-board-panel__summary")
  const titleSpan = makeElement("span", "training-board-panel__title", title)
  const subtitleSpan = makeElement("span", "training-board-panel__subtitle", subtitle)
  summary.append(titleSpan, subtitleSpan)
  return summary
}

function createEnginePanel(): EngineController {
  const details = makeElement("details", "training-board-panel training-board-panel--engine")
  details.appendChild(createPanelSummary("Engine", "Separate Stockfish analysis"))

  const body = makeElement("div", "training-board-panel__body training-engine")
  const toolbar = makeElement("div", "training-engine__toolbar")
  const toggleButton = makeElement("button", "training-board-button", "Turn On Stockfish")
  toggleButton.type = "button"
  const evalBarButton = makeElement("button", "training-board-button training-board-button--ghost", "Hide Eval Bar")
  evalBarButton.type = "button"

  const status = makeElement("p", "training-engine__status", "Stockfish is off.")
  const scoreRow = makeElement("div", "training-engine__score-row")
  const score = makeElement("strong", "training-engine__score", "--")
  const meta = makeElement("span", "training-engine__meta", "Depth --")

  const bar = makeElement("div", "training-engine__bar")
  const barWhite = makeElement("div", "training-engine__bar-white")
  const barBlack = makeElement("div", "training-engine__bar-black")
  bar.append(barWhite, barBlack)

  const pv = makeElement("p", "training-engine__pv", "Best line will appear here once the engine starts.")

  toolbar.append(toggleButton, evalBarButton)
  scoreRow.append(score, meta)
  body.append(toolbar, status, scoreRow, bar, pv)
  details.appendChild(body)

  return {
    details,
    toggleButton,
    evalBarButton,
    status,
    score,
    meta,
    pv,
    bar,
    barWhite,
    barBlack,
    worker: null,
    ready: false,
    enabled: false,
    evalBarVisible: true,
    pendingFen: null,
    pendingTurn: "white",
    debounceId: null,
  }
}

function createExplorerPanel(): ExplorerController {
  const details = makeElement("details", "training-board-panel training-board-panel--explorer")
  details.appendChild(createPanelSummary("Masters Database", "Live Lichess opening explorer"))

  const body = makeElement("div", "training-board-panel__body training-explorer")
  const status = makeElement(
    "p",
    "training-explorer__status",
    "Open this panel to load master-game statistics for the current position.",
  )
  const opening = makeElement("p", "training-explorer__opening")
  const moves = makeElement("div", "training-explorer__moves")
  const games = makeElement("div", "training-explorer__games")

  body.append(status, opening, moves, games)
  details.appendChild(body)

  return {
    details,
    status,
    opening,
    moves,
    games,
    currentFen: null,
    requestId: 0,
  }
}

function formatEval(score: number | null, mate: number | null) {
  if (mate != null) {
    const prefix = mate > 0 ? "#" : "-#"
    return `${prefix}${Math.abs(mate)}`
  }

  if (score == null) {
    return "--"
  }

  const signed = score / 100
  return `${signed >= 0 ? "+" : ""}${signed.toFixed(1)}`
}

function whiteShareFromEval(score: number | null, mate: number | null) {
  if (mate != null) {
    return mate > 0 ? 100 : 0
  }

  if (score == null) {
    return 50
  }

  return Math.max(0, Math.min(100, 50 + 46 * Math.tanh(score / 220)))
}

function parseEngineLine(line: string) {
  if (!line.startsWith("info ") || !line.includes(" pv ")) {
    return null
  }

  const depthMatch = line.match(/\bdepth\s+(\d+)/)
  const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/)
  const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/)
  const pvMatch = line.match(/\bpv\s+(.+)$/)

  if (!depthMatch || !pvMatch || (!cpMatch && !mateMatch)) {
    return null
  }

  return {
    depth: Number(depthMatch[1]),
    cp: cpMatch ? Number(cpMatch[1]) : null,
    mate: mateMatch ? Number(mateMatch[1]) : null,
    pv: pvMatch[1].trim().split(/\s+/).slice(0, 8),
  }
}

function toWhitePerspective(
  turn: "white" | "black",
  cp: number | null,
  mate: number | null,
) {
  const sign = turn === "white" ? 1 : -1
  return {
    cp: cp == null ? null : cp * sign,
    mate: mate == null ? null : mate * sign,
  }
}

function renderEngineState(
  controller: EngineController,
  score: number | null,
  mate: number | null,
  depth: number | null,
  pv: string[],
) {
  controller.score.textContent = formatEval(score, mate)
  controller.meta.textContent = depth == null ? "Depth --" : `Depth ${depth}`
  controller.pv.textContent = pv.length > 0 ? `PV: ${pv.join(" ")}` : "Best line will appear here once the engine starts."

  const whiteShare = whiteShareFromEval(score, mate)
  controller.barWhite.style.width = `${whiteShare}%`
  controller.barBlack.style.width = `${100 - whiteShare}%`
}

function stopEngineSearch(controller: EngineController) {
  if (controller.worker) {
    controller.worker.postMessage("stop")
  }
  if (controller.debounceId != null) {
    window.clearTimeout(controller.debounceId)
    controller.debounceId = null
  }
}

function teardownEngine(controller: EngineController) {
  stopEngineSearch(controller)
  controller.worker?.terminate()
  controller.worker = null
  controller.ready = false
  controller.enabled = false
  controller.pendingFen = null
  controller.toggleButton.textContent = "Turn On Stockfish"
  controller.status.textContent = "Stockfish is off."
  controller.score.textContent = "--"
  controller.meta.textContent = "Depth --"
  controller.pv.textContent = "Best line will appear here once the engine starts."
  controller.bar.dataset.hidden = controller.evalBarVisible ? "false" : "true"
  activeEngines.delete(controller)
}

function scheduleEngineAnalysis(controller: EngineController) {
  if (!controller.enabled || !controller.ready || !controller.worker || !controller.pendingFen) {
    return
  }

  stopEngineSearch(controller)
  controller.status.textContent = "Analysing current position..."
  controller.debounceId = window.setTimeout(() => {
    if (!controller.worker || !controller.pendingFen) {
      return
    }

    controller.worker.postMessage("ucinewgame")
    controller.worker.postMessage(`position fen ${controller.pendingFen}`)
    controller.worker.postMessage(`go depth ${ENGINE_DEPTH}`)
  }, ENGINE_DEBOUNCE_MS)
}

function ensureEngineStarted(enhancement: BoardEnhancement) {
  const controller = enhancement.engine
  if (controller.worker) {
    return
  }

  try {
    const worker = new Worker(STOCKFISH_WORKER_URL)
    controller.worker = worker
    controller.enabled = true
    controller.toggleButton.textContent = "Turn Off Stockfish"
    controller.status.textContent = "Starting Stockfish 18 lite..."
    activeEngines.add(controller)

    worker.onmessage = (event) => {
      const line = typeof event.data === "string" ? event.data : String(event.data)
      if (line === "readyok") {
        controller.ready = true
        controller.status.textContent = "Stockfish ready."
        scheduleEngineAnalysis(controller)
        return
      }

      const info = parseEngineLine(line)
      if (info) {
        const perspective = toWhitePerspective(controller.pendingTurn, info.cp, info.mate)
        renderEngineState(controller, perspective.cp, perspective.mate, info.depth, info.pv)
        controller.status.textContent = "Live engine analysis"
        return
      }

      if (line.startsWith("bestmove")) {
        controller.status.textContent = "Analysis up to date."
      }
    }

    worker.onerror = () => {
      teardownEngine(controller)
      controller.status.textContent = "Stockfish could not be loaded in this browser."
    }

    worker.postMessage("uci")
    worker.postMessage(`setoption name Hash value ${ENGINE_HASH_MB}`)
    worker.postMessage("isready")
  } catch (error) {
    console.error(error)
    teardownEngine(controller)
    controller.status.textContent = "Stockfish could not be started."
  }
}

function toggleEngine(enhancement: BoardEnhancement) {
  const controller = enhancement.engine
  if (controller.enabled) {
    teardownEngine(controller)
    return
  }

  const current = enhancement.viewer.curData()
  controller.pendingFen = current.fen
  controller.pendingTurn = current.turn ?? "white"
  ensureEngineStarted(enhancement)
}

function updateEnginePosition(enhancement: BoardEnhancement) {
  const controller = enhancement.engine
  const current = enhancement.viewer.curData()
  controller.pendingFen = current.fen
  controller.pendingTurn = current.turn ?? "white"

  if (controller.enabled) {
    scheduleEngineAnalysis(controller)
  }
}

function setEvalBarVisible(controller: EngineController, visible: boolean) {
  controller.evalBarVisible = visible
  controller.bar.dataset.hidden = visible ? "false" : "true"
  controller.evalBarButton.textContent = visible ? "Hide Eval Bar" : "Show Eval Bar"
}

function getMastersEndpoint() {
  return window.__CHESS_MASTERS_ENDPOINT__ || DEFAULT_MASTERS_ENDPOINT
}

function parseExplorerPayload(payload: string): ExplorerResponse {
  const trimmed = payload.trim()
  if (!trimmed) {
    return {}
  }

  try {
    return JSON.parse(trimmed) as ExplorerResponse
  } catch (_error) {
    const lastLine = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .pop()

    if (!lastLine) {
      return {}
    }

    return JSON.parse(lastLine) as ExplorerResponse
  }
}

function ratio(value: number, total: number) {
  if (!total) {
    return 0
  }
  return Math.round((value / total) * 100)
}

function renderExplorerData(controller: ExplorerController, data: ExplorerResponse) {
  const total = (data.white ?? 0) + (data.draws ?? 0) + (data.black ?? 0)
  controller.status.textContent = total
    ? `Master games found: ${total.toLocaleString()}`
    : "No master-game statistics were returned for this position."

  controller.opening.textContent = data.opening?.name
    ? `${data.opening.name}${data.opening.eco ? ` (${data.opening.eco})` : ""}`
    : ""

  controller.moves.replaceChildren()
  const moves = (data.moves ?? []).slice(0, EXPLORER_MOVE_LIMIT)
  if (moves.length > 0) {
    const list = makeElement("div", "training-explorer__move-list")
    for (const move of moves) {
      const row = makeElement("div", "training-explorer__move-row")
      const moveTotal = (move.white ?? 0) + (move.draws ?? 0) + (move.black ?? 0)
      const header = makeElement("div", "training-explorer__move-head")
      const san = makeElement("strong", "training-explorer__move-san", move.san ?? move.uci ?? "?")
      const games = makeElement("span", "training-explorer__move-games", moveTotal.toLocaleString())
      header.append(san, games)

      const bar = makeElement("div", "training-explorer__result-bar")
      const white = makeElement("span", "training-explorer__result-bar-white")
      white.style.width = `${ratio(move.white ?? 0, moveTotal)}%`
      const draws = makeElement("span", "training-explorer__result-bar-draws")
      draws.style.width = `${ratio(move.draws ?? 0, moveTotal)}%`
      const black = makeElement("span", "training-explorer__result-bar-black")
      black.style.width = `${ratio(move.black ?? 0, moveTotal)}%`
      bar.append(white, draws, black)

      const summary = makeElement(
        "p",
        "training-explorer__move-summary",
        `White ${ratio(move.white ?? 0, moveTotal)}% | Draw ${ratio(move.draws ?? 0, moveTotal)}% | Black ${ratio(move.black ?? 0, moveTotal)}%`,
      )

      row.append(header, bar, summary)
      list.appendChild(row)
    }
    controller.moves.appendChild(list)
  }

  controller.games.replaceChildren()
  const games = (data.topGames ?? data.recentGames ?? []).slice(0, EXPLORER_GAME_LIMIT)
  if (games.length > 0) {
    const heading = makeElement("p", "training-explorer__games-title", "Top games")
    const list = makeElement("div", "training-explorer__game-list")

    for (const game of games) {
      const row = makeElement("div", "training-explorer__game-row")
      const players = makeElement(
        "span",
        "training-explorer__game-players",
        `${game.white?.name ?? "White"} vs ${game.black?.name ?? "Black"}`,
      )
      const meta = makeElement(
        "span",
        "training-explorer__game-meta",
        `${game.winner === "white" ? "1-0" : game.winner === "black" ? "0-1" : "1/2-1/2"}${game.year ? ` - ${game.year}` : ""}`,
      )
      row.append(players, meta)
      list.appendChild(row)
    }

    controller.games.append(heading, list)
  }
}

async function loadExplorer(enhancement: BoardEnhancement) {
  const controller = enhancement.explorer
  if (!controller.details.open) {
    return
  }

  const currentFen = enhancement.viewer.curData().fen
  if (controller.currentFen === currentFen) {
    return
  }

  controller.currentFen = currentFen
  const requestId = ++controller.requestId
  controller.status.textContent = "Loading live masters database..."
  controller.opening.textContent = ""
  controller.moves.replaceChildren()
  controller.games.replaceChildren()

  try {
    const endpoint = getMastersEndpoint()
    const url = new URL(endpoint)
    url.searchParams.set("fen", currentFen)

    const response = await fetch(url.toString(), {
      credentials: endpoint.includes("lichess.org") ? "omit" : "same-origin",
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = await response.text()
    if (requestId !== controller.requestId) {
      return
    }

    renderExplorerData(controller, parseExplorerPayload(payload))
  } catch (error) {
    console.error(error)
    const message = String(error)
    controller.moves.replaceChildren()
    controller.games.replaceChildren()
    controller.opening.textContent = ""
    controller.status.textContent = message.includes("401")
      ? "The official Lichess masters endpoint now needs an authenticated proxy. Configure window.__CHESS_MASTERS_ENDPOINT__ to your own proxy to enable live data here."
      : "The live masters database could not be loaded right now."
  }
}

function syncEnhancement(enhancement: BoardEnhancement) {
  updateEnginePosition(enhancement)
  void loadExplorer(enhancement)
}

function patchViewerLifecycle(enhancement: BoardEnhancement) {
  const viewer = enhancement.viewer
  const originalToPath = viewer.toPath.bind(viewer)
  viewer.toPath = (path, focus = true) => {
    originalToPath(path, focus)
    syncEnhancement(enhancement)
  }

  const originalFlip = viewer.flip.bind(viewer)
  viewer.flip = () => {
    originalFlip()
    syncEnhancement(enhancement)
  }
}

function enhanceBoard(node: HTMLElement, viewer: ViewerApi) {
  if (node.dataset.viewerEnhanced === "true") {
    return
  }

  node.dataset.viewerEnhanced = "true"
  const { sidebar } = ensureBoardShell(node)
  const engine = createEnginePanel()
  const explorer = createExplorerPanel()
  sidebar.append(engine.details, explorer.details)

  const enhancement: BoardEnhancement = {
    node,
    viewer,
    engine,
    explorer,
  }

  engine.toggleButton.addEventListener("click", () => {
    toggleEngine(enhancement)
  })
  engine.evalBarButton.addEventListener("click", () => {
    setEvalBarVisible(engine, !engine.evalBarVisible)
  })
  setEvalBarVisible(engine, true)

  explorer.details.addEventListener("toggle", () => {
    void loadExplorer(enhancement)
  })

  patchViewerLifecycle(enhancement)
  syncEnhancement(enhancement)
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
      fetch(new URL(src, document.baseURI)),
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

    const viewer = viewerFactory(node, config)
    enhanceBoard(node, viewer)
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

function cleanupEngines() {
  for (const engine of activeEngines) {
    teardownEngine(engine)
  }
  activeEngines.clear()
}

document.addEventListener("nav", () => {
  cleanupEngines()
  void mountBoards()
})

void mountBoards()
