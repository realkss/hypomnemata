const CSS_LINK_ID = "chess-pgn-viewer-styles"
const CSS_URLS = [
  "https://cdn.jsdelivr.net/npm/@lichess-org/pgn-viewer@2.4.7/dist/lichess-pgn-viewer.css",
  "https://cdn.jsdelivr.net/npm/lichess-pgn-viewer@2.4.5/lichess-pgn-viewer.css",
]

let STOCKFISH_WORKER_URL: string
try {
  STOCKFISH_WORKER_URL = new URL(
    "./static/chess/stockfish/stockfish-18-lite-single.js",
    import.meta.url,
  ).toString()
} catch (e) {
  console.error("Failed to resolve Stockfish worker URL", e)
  STOCKFISH_WORKER_URL = "/static/chess/stockfish/stockfish-18-lite-single.js"
}
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
  panel: HTMLElement
  toggleButton: HTMLButtonElement
  evalBarButton: HTMLButtonElement
  status: HTMLElement
  score: HTMLElement
  meta: HTMLElement
  pv: HTMLElement
  barRail: HTMLElement
  bar: HTMLElement
  barWhite: HTMLElement
  barBlack: HTMLElement
  barLabel: HTMLElement
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
  panel: HTMLElement
  toggleButton: HTMLButtonElement
  status: HTMLElement
  opening: HTMLElement
  moves: HTMLElement
  games: HTMLElement
  enabled: boolean
  currentFen: string | null
  requestId: number
}

type BoardPanelKey = "engine" | "explorer"

type PanelContainer = {
  root: HTMLElement
  body: HTMLElement
  tabs: Record<BoardPanelKey, HTMLButtonElement>
}

type BoardEnhancement = {
  node: HTMLElement
  mount: HTMLElement
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

function setActiveBoardPanel(container: PanelContainer, panel: BoardPanelKey) {
  container.root.dataset.activePanel = panel

  for (const [key, button] of Object.entries(container.tabs) as Array<[BoardPanelKey, HTMLButtonElement]>) {
    const active = key === panel
    button.dataset.active = active ? "true" : "false"
    button.setAttribute("aria-selected", active ? "true" : "false")
  }

  for (const section of Array.from(container.body.children) as HTMLElement[]) {
    const active = section.dataset.panel === panel
    section.dataset.active = active ? "true" : "false"
    section.hidden = !active
  }
}

function ensurePanelContainer(node: HTMLElement) {
  const existing = node.querySelector<HTMLElement>(":scope > .training-board-panels")
  if (existing) {
    const tabs = Array.from(
      existing.querySelectorAll<HTMLButtonElement>(".training-board-tab[data-panel-target]"),
    )

    return {
      root: existing,
      body: existing.querySelector<HTMLElement>(".training-board-panels__body") ?? existing,
      tabs: {
        engine: tabs.find((button) => button.dataset.panelTarget === "engine") ?? makeElement("button"),
        explorer: tabs.find((button) => button.dataset.panelTarget === "explorer") ?? makeElement("button"),
      },
    } satisfies PanelContainer
  }

  const root = makeElement("section", "training-board-panels")
  const bar = makeElement("div", "training-board-panels__bar")
  const tabs = makeElement("div", "training-board-panels__tabs")
  const meta = makeElement("span", "training-board-panels__meta", "Analysis dock")
  const engineTab = makeElement("button", "training-board-tab", "Engine")
  engineTab.type = "button"
  engineTab.dataset.panelTarget = "engine"
  engineTab.setAttribute("aria-selected", "true")
  const explorerTab = makeElement("button", "training-board-tab", "Masters")
  explorerTab.type = "button"
  explorerTab.dataset.panelTarget = "explorer"
  explorerTab.setAttribute("aria-selected", "false")
  tabs.append(engineTab, explorerTab)
  bar.append(tabs, meta)

  const body = makeElement("div", "training-board-panels__body")
  root.append(bar, body)
  node.appendChild(root)

  const container = {
    root,
    body,
    tabs: {
      engine: engineTab,
      explorer: explorerTab,
    },
  } satisfies PanelContainer

  engineTab.addEventListener("click", () => {
    setActiveBoardPanel(container, "engine")
  })
  explorerTab.addEventListener("click", () => {
    setActiveBoardPanel(container, "explorer")
  })

  return container
}

function createEnginePanel(): EngineController {
  const panel = makeElement("section", "training-board-panel training-board-panel--engine")
  panel.dataset.panel = "engine"
  const body = makeElement("div", "training-board-panel__body training-engine")
  const header = makeElement("div", "training-engine__header")
  const summary = makeElement("div", "training-engine__summary")
  const toolbar = makeElement("div", "training-engine__toolbar")
  const toggleButton = makeElement("button", "training-board-button", "Turn On Stockfish")
  toggleButton.type = "button"
  const evalBarButton = makeElement("button", "training-board-button training-board-button--ghost", "Hide Eval Bar")
  evalBarButton.type = "button"

  const status = makeElement("p", "training-engine__status", "Stockfish is off.")
  const scoreRow = makeElement("div", "training-engine__score-row")
  const score = makeElement("strong", "training-engine__score", "--")
  const meta = makeElement("span", "training-engine__meta", "Depth --")

  const barRail = makeElement("div", "training-engine__bar-rail")
  const bar = makeElement("div", "training-engine__bar")
  const barWhite = makeElement("div", "training-engine__bar-white")
  const barBlack = makeElement("div", "training-engine__bar-black")
  bar.append(barWhite, barBlack)
  barRail.appendChild(bar)

  const barLabel = makeElement("span", "training-engine__bar-label")
  barRail.appendChild(barLabel)

  const pv = makeElement("p", "training-engine__pv", "Best line will appear here once the engine starts.")

  toolbar.append(toggleButton, evalBarButton)
  scoreRow.append(score, meta)
  summary.append(scoreRow, status)
  header.append(summary, toolbar)
  body.append(header, pv)
  panel.append(body)

  return {
    panel,
    toggleButton,
    evalBarButton,
    status,
    score,
    meta,
    pv,
    barRail,
    bar,
    barWhite,
    barBlack,
    barLabel,
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
  const panel = makeElement("section", "training-board-panel training-board-panel--explorer")
  panel.dataset.panel = "explorer"
  const body = makeElement("div", "training-board-panel__body training-explorer")
  const header = makeElement("div", "training-explorer__header")
  const summary = makeElement("div", "training-explorer__summary")
  const toolbar = makeElement("div", "training-explorer__toolbar")
  const toggleButton = makeElement("button", "training-board-button", "Turn On Database")
  toggleButton.type = "button"
  const status = makeElement(
    "p",
    "training-explorer__status",
    "Masters database is off. Turn it on to fetch opening statistics for the current position.",
  )
  const opening = makeElement("p", "training-explorer__opening")
  const content = makeElement("div", "training-explorer__content")
  const moves = makeElement("div", "training-explorer__moves")
  const games = makeElement("div", "training-explorer__games")

  toolbar.appendChild(toggleButton)
  summary.append(status, opening)
  header.append(summary, toolbar)
  content.append(moves, games)
  body.append(header, content)
  panel.append(body)

  return {
    panel,
    toggleButton,
    status,
    opening,
    moves,
    games,
    enabled: false,
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
  const evalText = formatEval(score, mate)
  controller.score.textContent = evalText
  controller.meta.textContent = depth == null ? "Depth --" : `Depth ${depth}`
  controller.pv.textContent = pv.length > 0 ? `PV: ${pv.join(" ")}` : "Best line will appear here once the engine starts."

  const whiteShare = whiteShareFromEval(score, mate)
  controller.barWhite.style.width = `${whiteShare}%`
  controller.barBlack.style.width = `${100 - whiteShare}%`
  controller.barWhite.style.height = `${whiteShare}%`
  controller.barBlack.style.height = `${100 - whiteShare}%`
  controller.barLabel.textContent = evalText
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
  controller.barLabel.textContent = ""
  controller.barWhite.style.width = "50%"
  controller.barBlack.style.width = "50%"
  controller.barWhite.style.height = "50%"
  controller.barBlack.style.height = "50%"
  controller.barRail.dataset.disabled = "true"
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
    controller.barRail.dataset.disabled = "false"
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
  controller.barRail.dataset.hidden = visible ? "false" : "true"
  controller.bar.dataset.hidden = visible ? "false" : "true"
  controller.evalBarButton.textContent = visible ? "Hide Eval Bar" : "Show Eval Bar"
}

function mountEvalBar(mount: HTMLElement, controller: EngineController) {
  const board = mount.querySelector<HTMLElement>(".lpv__board")
  if (!board) {
    return
  }

  if (controller.barRail.parentElement !== board) {
    controller.barRail.remove()
    board.appendChild(controller.barRail)
  }
}

function getMastersEndpoint() {
  return window.__CHESS_MASTERS_ENDPOINT__ || DEFAULT_MASTERS_ENDPOINT
}

function clearExplorer(controller: ExplorerController) {
  controller.opening.textContent = ""
  controller.moves.replaceChildren()
  controller.games.replaceChildren()
}

function setExplorerEnabled(controller: ExplorerController, enabled: boolean) {
  controller.enabled = enabled
  controller.currentFen = null
  controller.requestId += 1
  controller.toggleButton.textContent = enabled ? "Turn Off Database" : "Turn On Database"

  if (!enabled) {
    clearExplorer(controller)
    controller.status.textContent =
      "Masters database is off. Turn it on to fetch opening statistics for the current position."
  }
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
    const heading = makeElement("p", "training-explorer__games-title", "Move table")
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
    controller.moves.append(heading, list)
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
  if (!controller.enabled) {
    return
  }

  const currentFen = enhancement.viewer.curData().fen
  if (controller.currentFen === currentFen) {
    return
  }

  controller.currentFen = currentFen
  const requestId = ++controller.requestId
  controller.status.textContent = "Loading live masters database..."
  clearExplorer(controller)

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
    if (requestId !== controller.requestId || !controller.enabled) {
      return
    }

    renderExplorerData(controller, parseExplorerPayload(payload))
  } catch (error) {
    console.error(error)
    const message = String(error)
    clearExplorer(controller)
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

function enhanceBoard(node: HTMLElement, mount: HTMLElement, viewer: ViewerApi) {
  if (node.dataset.viewerEnhanced === "true") {
    return
  }

  node.dataset.viewerEnhanced = "true"

  const panelContainer = ensurePanelContainer(node)
  const engine = createEnginePanel()
  const explorer = createExplorerPanel()
  panelContainer.body.append(engine.panel, explorer.panel)
  setActiveBoardPanel(panelContainer, "engine")

  const enhancement: BoardEnhancement = {
    node,
    mount,
    viewer,
    engine,
    explorer,
  }

  mountEvalBar(mount, engine)
  engine.toggleButton.addEventListener("click", () => {
    setActiveBoardPanel(panelContainer, "engine")
    toggleEngine(enhancement)
  })
  engine.evalBarButton.addEventListener("click", () => {
    setActiveBoardPanel(panelContainer, "engine")
    setEvalBarVisible(engine, !engine.evalBarVisible)
  })
  setEvalBarVisible(engine, true)
  engine.barRail.dataset.disabled = "true"
  engine.barWhite.style.width = "50%"
  engine.barBlack.style.width = "50%"
  engine.barWhite.style.height = "50%"
  engine.barBlack.style.height = "50%"

  explorer.toggleButton.addEventListener("click", () => {
    setActiveBoardPanel(panelContainer, "explorer")
    setExplorerEnabled(explorer, !explorer.enabled)
    void loadExplorer(enhancement)
  })
  setExplorerEnabled(explorer, false)

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

    const mount = makeElement("div", "chess-training-board__mount")
    node.appendChild(mount)

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

    const viewer = viewerFactory(mount, config)
    enhanceBoard(node, mount, viewer)
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
