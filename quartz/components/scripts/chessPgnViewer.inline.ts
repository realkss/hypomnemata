const CSS_LINK_ID = "chess-pgn-viewer-styles"
const CSS_URLS = [
  "https://cdn.jsdelivr.net/npm/@lichess-org/pgn-viewer@2.4.7/dist/lichess-pgn-viewer.css",
  "https://cdn.jsdelivr.net/npm/lichess-pgn-viewer@2.4.5/lichess-pgn-viewer.css",
]
const CHESSOPS_PGN_URLS = [
  "https://cdn.jsdelivr.net/npm/chessops@0.14.2/+esm",
  "https://esm.sh/chessops@0.14.2/pgn",
]
const CHESSOPS_SAN_URLS = [
  "https://cdn.jsdelivr.net/npm/chessops@0.14.2/san/+esm",
  "https://esm.sh/chessops@0.14.2/san",
]
const CHESSOPS_FEN_URLS = [
  "https://cdn.jsdelivr.net/npm/chessops@0.14.2/fen/+esm",
  "https://esm.sh/chessops@0.14.2/fen",
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
const DEFAULT_MASTERS_ENDPOINT = "/api/chess/masters"
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

type LocalExplorerGame = {
  id: string
  winner?: "white" | "black"
  white?: ExplorerGameSide
  black?: ExplorerGameSide
  year?: number
  eco?: string
  annotator?: string
  moves: Array<{
    fen: string
    san: string
  }>
}

type ChessOpsModule = {
  parsePgn: (pgn: string) => Array<{
    headers: Map<string, string>
    moves: {
      mainline: () => Iterable<{ san: string }>
    }
  }>
  startingPosition: (headers: Map<string, string>) => {
    unwrap: () => {
      toSetup: () => unknown
      play: (move: unknown) => void
    }
  }
  parseSan: (pos: unknown, san: string) => unknown
  makeFen: (setup: unknown) => string
}

type BoardPanelKey = "engine" | "explorer"

type PanelContainer = {
  root: HTMLElement
  bar: HTMLElement
  body: HTMLElement
  tabs: Record<BoardPanelKey, HTMLButtonElement>
}

type BoardEnhancement = {
  node: HTMLElement
  mount: HTMLElement
  viewer: ViewerApi
  panelContainer: PanelContainer
  engine: EngineController
  explorer: ExplorerController
  pgnText: string
}

const boardEnhancements = new WeakMap<HTMLElement, BoardEnhancement>()

declare global {
  interface Window {
    __CHESS_MASTERS_ENDPOINT__?: string
  }
}

let viewerModulePromise: Promise<ViewerFactory> | undefined
let chessOpsModulePromise: Promise<ChessOpsModule> | undefined
const activeEngines = new Set<EngineController>()
const localMasterIndexCache = new Map<string, Promise<LocalExplorerGame[]>>()

async function importFirst<T>(urls: string[]) {
  let lastError: unknown
  for (const url of urls) {
    try {
      return (await import(url)) as T
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error("Dynamic import failed.")
}

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

async function loadChessOps() {
  if (!chessOpsModulePromise) {
    chessOpsModulePromise = Promise.all([
      importFirst<{
        parsePgn: ChessOpsModule["parsePgn"]
        startingPosition: ChessOpsModule["startingPosition"]
      }>(CHESSOPS_PGN_URLS),
      importFirst<{ parseSan: ChessOpsModule["parseSan"] }>(CHESSOPS_SAN_URLS),
      importFirst<{ makeFen: ChessOpsModule["makeFen"] }>(CHESSOPS_FEN_URLS),
    ]).then(([pgn, san, fen]) => ({
      parsePgn: pgn.parsePgn,
      startingPosition: pgn.startingPosition,
      parseSan: san.parseSan,
      makeFen: fen.makeFen,
    }))
  }

  return chessOpsModulePromise
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

  for (const [key, button] of Object.entries(container.tabs) as Array<
    [BoardPanelKey, HTMLButtonElement]
  >) {
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
    const bar =
      existing.querySelector<HTMLElement>(".training-board-panels__bar") ?? makeElement("div")
    const tabs = Array.from(
      existing.querySelectorAll<HTMLButtonElement>(".training-board-tab[data-panel-target]"),
    )

    return {
      root: existing,
      bar,
      body: existing.querySelector<HTMLElement>(".training-board-panels__body") ?? existing,
      tabs: {
        engine:
          tabs.find((button) => button.dataset.panelTarget === "engine") ?? makeElement("button"),
        explorer:
          tabs.find((button) => button.dataset.panelTarget === "explorer") ?? makeElement("button"),
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
    bar,
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

function shouldDockBoardTabsWithControls() {
  return window.matchMedia("(min-width: 901px) and (hover: hover)").matches
}

function shouldUseDesktopMovePane() {
  return window.matchMedia("(min-width: 901px) and (hover: hover)").matches
}

function getStackedMovePaneHeight(boardHeight: number) {
  const preferred = boardHeight * 0.78
  const viewportCap = window.innerHeight * 0.42
  return Math.round(Math.max(180, Math.min(preferred, viewportCap, 360)))
}

function getActiveMount(enhancement: BoardEnhancement) {
  const currentMount = enhancement.node.querySelector<HTMLElement>(
    ":scope > .chess-training-board__mount",
  )

  if (currentMount) {
    enhancement.mount = currentMount
    return currentMount
  }

  return enhancement.mount
}

function clearMovePaneSizing(enhancement: BoardEnhancement) {
  const node = enhancement.node
  const mount = getActiveMount(enhancement)
  const side = mount.querySelector<HTMLElement>(".lpv__side")
  const moves = mount.querySelector<HTMLElement>(".lpv__moves")

  node.removeAttribute("data-training-move-pane")
  node.style.removeProperty("--training-moves-pane-height")
  node.style.removeProperty("--training-moves-list-height")
  node.style.removeProperty("--training-stacked-moves-pane-height")
  node.style.removeProperty("--training-stacked-moves-list-height")
  mount.style.removeProperty("--training-moves-pane-height")
  mount.style.removeProperty("--training-stacked-moves-pane-height")
  side?.removeAttribute("data-training-move-pane")
  moves?.removeAttribute("data-training-move-pane")
  side?.style.removeProperty("align-self")
  side?.style.removeProperty("box-sizing")
  side?.style.removeProperty("height")
  side?.style.removeProperty("max-height")
  side?.style.removeProperty("overflow")
  moves?.style.removeProperty("flex")
  moves?.style.removeProperty("height")
  moves?.style.removeProperty("max-height")
  moves?.style.removeProperty("min-height")
  moves?.style.removeProperty("overflow-y")
  moves?.style.removeProperty("overscroll-behavior")
  moves?.style.removeProperty("scrollbar-gutter")
}

function hasMovePaneSizing(enhancement: BoardEnhancement) {
  const node = enhancement.node
  const mount = getActiveMount(enhancement)
  const side = mount.querySelector<HTMLElement>(".lpv__side")
  const moves = mount.querySelector<HTMLElement>(".lpv__moves")

  return (
    node.hasAttribute("data-training-move-pane") ||
    side?.dataset.trainingMovePane === "true" ||
    moves?.dataset.trainingMovePane === "true" ||
    Boolean(side?.style.maxHeight) ||
    Boolean(moves?.style.maxHeight)
  )
}

function preserveOrClearMovePane(enhancement: BoardEnhancement) {
  if (hasMovePaneSizing(enhancement)) {
    return
  }

  clearMovePaneSizing(enhancement)
}

function applyMovePaneSizing(
  enhancement: BoardEnhancement,
  side: HTMLElement,
  moves: HTMLElement,
  sideHeight: number,
  movesHeight: number,
  desktop: boolean,
) {
  const mount = getActiveMount(enhancement)
  const safeSideHeight = Math.max(Math.round(sideHeight), 0)
  const safeMovesHeight = Math.max(Math.round(movesHeight), 0)

  if (safeSideHeight <= 0 || safeMovesHeight <= 0) {
    preserveOrClearMovePane(enhancement)
    return
  }

  if (desktop) {
    enhancement.node.dataset.trainingMovePane = "desktop"
    enhancement.node.style.setProperty("--training-moves-pane-height", `${safeSideHeight}px`)
    enhancement.node.style.setProperty("--training-moves-list-height", `${safeMovesHeight}px`)
    enhancement.node.style.removeProperty("--training-stacked-moves-pane-height")
    enhancement.node.style.removeProperty("--training-stacked-moves-list-height")
    mount.style.setProperty("--training-moves-pane-height", `${safeSideHeight}px`)
    mount.style.removeProperty("--training-stacked-moves-pane-height")
  } else {
    enhancement.node.dataset.trainingMovePane = "stacked"
    enhancement.node.style.removeProperty("--training-moves-pane-height")
    enhancement.node.style.removeProperty("--training-moves-list-height")
    enhancement.node.style.setProperty("--training-stacked-moves-pane-height", `${safeSideHeight}px`)
    enhancement.node.style.setProperty("--training-stacked-moves-list-height", `${safeMovesHeight}px`)
    mount.style.removeProperty("--training-moves-pane-height")
    mount.style.setProperty("--training-stacked-moves-pane-height", `${safeSideHeight}px`)
  }

  side.dataset.trainingMovePane = "true"
  moves.dataset.trainingMovePane = "true"
  side.style.setProperty("align-self", desktop ? "start" : "stretch")
  side.style.setProperty("box-sizing", "border-box")
  side.style.setProperty("height", `${safeSideHeight}px`)
  side.style.setProperty("max-height", `${safeSideHeight}px`)
  side.style.setProperty("overflow", "hidden")
  moves.style.setProperty("flex", "0 1 auto")
  moves.style.setProperty("height", `${safeMovesHeight}px`)
  moves.style.setProperty("max-height", `${safeMovesHeight}px`)
  moves.style.setProperty("min-height", "0")
  moves.style.setProperty("overflow-y", "auto")
  moves.style.setProperty("overscroll-behavior", "contain")
  if (desktop) {
    moves.style.setProperty("scrollbar-gutter", "stable")
  } else {
    moves.style.removeProperty("scrollbar-gutter")
  }
}

function syncMovePane(enhancement: BoardEnhancement) {
  const mount = getActiveMount(enhancement)
  const side = mount.querySelector<HTMLElement>(".lpv__side")
  const moves = mount.querySelector<HTMLElement>(".lpv__moves")
  const board = mount.querySelector<HTMLElement>(".lpv__board .cg-wrap")
  const topPlayer = mount.querySelector<HTMLElement>(".lpv__player--top")
  const bottomPlayer = mount.querySelector<HTMLElement>(".lpv__player--bottom")

  if (!side || !moves || !board) {
    preserveOrClearMovePane(enhancement)
    return
  }

  const boardHeight = board.getBoundingClientRect().height
  if (!Number.isFinite(boardHeight) || boardHeight <= 0) {
    preserveOrClearMovePane(enhancement)
    return
  }

  const extraGap = 8
  const desktop = shouldUseDesktopMovePane() && mount.classList.contains("lpv--moves-right")

  if (!desktop) {
    const sideHeight = getStackedMovePaneHeight(boardHeight)
    const movesHeight = Math.max(sideHeight - extraGap, 96)
    applyMovePaneSizing(enhancement, side, moves, sideHeight, movesHeight, false)
    return
  }

  const start = (topPlayer ?? board).getBoundingClientRect().top
  const end = (bottomPlayer ?? board).getBoundingClientRect().bottom
  const height = Math.max(board.getBoundingClientRect().height, end - start)

  if (!Number.isFinite(height) || height <= 0) {
    preserveOrClearMovePane(enhancement)
    return
  }

  const movesHeight = Math.max(height - extraGap, 128)
  applyMovePaneSizing(enhancement, side, moves, height, movesHeight, true)
}

function shouldHideBoardComments(section: HTMLElement) {
  const paragraphs = Array.from(
    section.querySelectorAll<HTMLElement>(".training-session-comments__paragraph"),
  )
    .map((paragraph) => paragraph.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean)

  return paragraphs.length === 0 || paragraphs.every((paragraph) => paragraph === "No comments yet.")
}

function syncBoardCommentsVisibility(node: HTMLElement) {
  const commentsSection = node.nextElementSibling
  if (!(commentsSection instanceof HTMLElement)) {
    return
  }

  if (!commentsSection.matches(".training-session-comments--board")) {
    return
  }

  const shouldHide = shouldHideBoardComments(commentsSection)
  commentsSection.hidden = shouldHide
  commentsSection.dataset.placeholder = shouldHide ? "true" : "false"
}

function syncPanelBarDock(enhancement: BoardEnhancement) {
  const mount = getActiveMount(enhancement)
  const { panelContainer } = enhancement
  const { root, bar, body } = panelContainer
  const controls = mount.querySelector<HTMLElement>(".lpv__controls")
  const shouldDock = shouldDockBoardTabsWithControls() && Boolean(controls)

  if (controls) {
    controls.removeAttribute("data-training-panel-dock")
  }

  const unwrapControlsMain = () => {
    if (!controls) {
      return
    }

    const controlsMain = controls.querySelector<HTMLElement>(":scope > .training-board-controls__main")
    if (!controlsMain) {
      return
    }

    const referenceNode = controlsMain.parentElement === controls ? controlsMain : null
    for (const child of Array.from(controlsMain.children)) {
      if (referenceNode) {
        controls.insertBefore(child, referenceNode)
      } else {
        controls.appendChild(child)
      }
    }
    controlsMain.remove()
  }

  if (!controls || !shouldDock) {
    unwrapControlsMain()
    if (bar.parentElement !== root || bar.nextElementSibling !== body) {
      root.insertBefore(bar, body)
    }
    root.dataset.controlsDocked = "false"
    return
  }

  unwrapControlsMain()

  if (bar.parentElement !== controls) {
    controls.appendChild(bar)
  }
  controls.dataset.trainingPanelDock = "true"
  root.dataset.controlsDocked = "true"
}

function observePanelBarDock(enhancement: BoardEnhancement) {
  const { node } = enhancement
  if (node.dataset.panelDockObserved === "true") {
    return
  }

  node.dataset.panelDockObserved = "true"

  const resync = () => {
    syncPanelBarDock(enhancement)
    syncMovePane(enhancement)
  }
  const observer = new MutationObserver(() => {
    resync()
  })
  observer.observe(node, {
    childList: true,
    subtree: true,
  })

  const timeoutIds = [
    window.setTimeout(resync, 0),
    window.setTimeout(resync, 180),
    window.setTimeout(resync, 650),
    window.setTimeout(resync, 1400),
  ]

  window.addEventListener("resize", resync, { passive: true })
  let resizeObserver: ResizeObserver | null = null
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      resync()
    })
    resizeObserver.observe(node)
  }
  window.addCleanup(() => {
    node.removeAttribute("data-panel-dock-observed")
    observer.disconnect()
    resizeObserver?.disconnect()
    for (const timeoutId of timeoutIds) {
      window.clearTimeout(timeoutId)
    }
    window.removeEventListener("resize", resync)
  })
}

function observeMovePaneSizing(enhancement: BoardEnhancement) {
  const { node, mount } = enhancement
  if (node.dataset.movePaneObserved === "true") {
    return
  }

  node.dataset.movePaneObserved = "true"

  const sync = () => {
    syncMovePane(enhancement)
  }
  const delayedSync = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(sync)
    })
  }

  const mutationObserver = new MutationObserver(() => {
    sync()
  })
  mutationObserver.observe(mount, {
    childList: true,
    subtree: true,
  })

  let resizeObserver: ResizeObserver | null = null
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      sync()
    })
    resizeObserver.observe(mount)
    resizeObserver.observe(node)
  }

  const intervalId = window.setInterval(sync, 400)
  const timeoutIds = [
    window.setTimeout(sync, 0),
    window.setTimeout(sync, 180),
    window.setTimeout(sync, 650),
    window.setTimeout(sync, 1400),
    window.setTimeout(sync, 2600),
  ]
  const intervalStopId = window.setTimeout(() => {
    window.clearInterval(intervalId)
  }, 5000)

  window.addEventListener("resize", sync, { passive: true })
  delayedSync()

  window.addCleanup(() => {
    node.removeAttribute("data-move-pane-observed")
    mutationObserver.disconnect()
    resizeObserver?.disconnect()
    window.clearInterval(intervalId)
    window.clearTimeout(intervalStopId)
    for (const timeoutId of timeoutIds) {
      window.clearTimeout(timeoutId)
    }
    window.removeEventListener("resize", sync)
  })
}

function ensureMovePaneFallback(_enhancement: BoardEnhancement) {
  // no-op: the fallback "Moves & comments" section was redundant with the interactive viewer
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
  const evalBarButton = makeElement(
    "button",
    "training-board-button training-board-button--ghost",
    "Hide Eval Bar",
  )
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

  const pv = makeElement(
    "p",
    "training-engine__pv",
    "Best line will appear here once the engine starts.",
  )

  toolbar.append(toggleButton, evalBarButton)
  scoreRow.append(score, meta)
  summary.append(scoreRow, status)
  header.append(summary, toolbar)
  body.append(header, barRail, pv)
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

function toWhitePerspective(turn: "white" | "black", cp: number | null, mate: number | null) {
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
  controller.pv.textContent =
    pv.length > 0 ? `PV: ${pv.join(" ")}` : "Best line will appear here once the engine starts."

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
  const body = controller.panel.querySelector<HTMLElement>(".training-engine")
  if (!body) {
    return
  }

  const pv = body.querySelector<HTMLElement>(".training-engine__pv")
  if (controller.barRail.parentElement !== body) {
    controller.barRail.remove()
    body.insertBefore(controller.barRail, pv ?? body.lastChild)
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

function explorerGameHref(game: ExplorerGame) {
  if (!game.id) {
    return null
  }

  try {
    return new URL(`/${game.id}`, "https://lichess.org").toString()
  } catch {
    return null
  }
}

function normalizeFen(fen: string) {
  // The viewer and the local PGN parser can disagree on auxiliary FEN fields
  // like castling rights or en-passant targets for equivalent opening positions.
  // For the local fallback, matching piece placement + side to move is robust enough.
  return fen.trim().split(/\s+/).slice(0, 2).join(" ")
}

function resultToWinner(result: string | undefined): "white" | "black" | undefined {
  if (result === "1-0") {
    return "white"
  }

  if (result === "0-1") {
    return "black"
  }

  return undefined
}

function yearFromDate(value: string | undefined) {
  const match = value?.match(/\d{4}/)
  return match ? Number(match[0]) : undefined
}

function firstMasterLink() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
  return (
    links.find((link) => (link.textContent ?? "").trim() === "Master Games") ??
    links.find((link) => /master-games\/?$/i.test(link.href))
  )
}

function preferredMovesLayout(): "bottom" | "right" {
  const compactViewport = window.matchMedia(
    "(max-width: 900px), (hover: none) and (orientation: landscape), (orientation: landscape) and (max-height: 720px)",
  ).matches

  // Use explicit layouts instead of LPV's auto mode so desktop stays reliably
  // right-sided while compact and foldable screens always stack the moves below.
  return compactViewport ? "bottom" : "right"
}

async function discoverLocalMasterPgnUrls() {
  const directUrls = Array.from(
    document.querySelectorAll<HTMLElement>(".chess-training-board[data-pgn-src]"),
  )
    .map((element) => element.dataset.pgnSrc)
    .filter((value): value is string => Boolean(value))
    .filter((value) => /reference-\d+\.pgn$/i.test(value))
    .map((value) => new URL(value, document.baseURI).toString())

  if (directUrls.length > 0) {
    return directUrls
  }

  const masterLink = firstMasterLink()
  const masterIndexUrl = new URL(masterLink?.href ?? "Master-Games/index.html", document.baseURI)
  if (!/index\.html$/i.test(masterIndexUrl.pathname)) {
    masterIndexUrl.pathname = `${masterIndexUrl.pathname.replace(/\/?$/, "/")}index.html`
  }

  const response = await fetch(masterIndexUrl.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch local master index (${response.status})`)
  }

  const html = await response.text()
  const documentFragment = new DOMParser().parseFromString(html, "text/html")
  return Array.from(
    documentFragment.querySelectorAll<HTMLElement>(".chess-training-board[data-pgn-src]"),
  )
    .map((element) => element.dataset.pgnSrc)
    .filter((value): value is string => Boolean(value))
    .filter((value) => /reference-\d+\.pgn$/i.test(value))
    .map((value) => new URL(value, masterIndexUrl).toString())
}

async function parseLocalExplorerGames() {
  const cacheKey = document.baseURI
  const cached = localMasterIndexCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const promise = (async () => {
    const [chessops, urls] = await Promise.all([loadChessOps(), discoverLocalMasterPgnUrls()])
    if (urls.length === 0) {
      return []
    }

    const responses = await Promise.all(urls.map((url) => fetch(url)))
    const texts = await Promise.all(
      responses.map(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch local master PGN (${response.status})`)
        }
        return response.text()
      }),
    )

    const games: LocalExplorerGame[] = []
    for (const [index, pgn] of texts.entries()) {
      for (const game of chessops.parsePgn(pgn)) {
        const headers = game.headers
        const position = chessops.startingPosition(headers).unwrap()
        const moves: LocalExplorerGame["moves"] = []

        for (const node of game.moves.mainline()) {
          const move = chessops.parseSan(position, node.san)
          if (!move) {
            break
          }

          moves.push({
            fen: normalizeFen(chessops.makeFen(position.toSetup())),
            san: node.san,
          })
          position.play(move)
        }

        games.push({
          id: `${urls[index]}#${games.length}`,
          winner: resultToWinner(headers.get("Result")),
          white: {
            name: headers.get("White") ?? undefined,
            rating: headers.get("WhiteElo") ? Number(headers.get("WhiteElo")) : undefined,
          },
          black: {
            name: headers.get("Black") ?? undefined,
            rating: headers.get("BlackElo") ? Number(headers.get("BlackElo")) : undefined,
          },
          year: yearFromDate(headers.get("Date")),
          eco: headers.get("ECO") ?? undefined,
          annotator: headers.get("Annotator") ?? undefined,
          moves,
        })
      }
    }

    return games
  })()

  localMasterIndexCache.set(cacheKey, promise)
  return promise
}

async function loadLocalExplorerData(fen: string): Promise<ExplorerResponse | null> {
  const games = await parseLocalExplorerGames()
  const moveTable = new Map<string, ExplorerMove>()
  const matchingGames: ExplorerGame[] = []
  const normalizedFen = normalizeFen(fen)
  let white = 0
  let black = 0
  let draws = 0
  const ecoCounts = new Map<string, number>()

  for (const game of games) {
    const nextMove = game.moves.find((move) => move.fen === normalizedFen)
    if (!nextMove) {
      continue
    }

    if (game.winner === "white") {
      white += 1
    } else if (game.winner === "black") {
      black += 1
    } else {
      draws += 1
    }

    if (game.eco) {
      ecoCounts.set(game.eco, (ecoCounts.get(game.eco) ?? 0) + 1)
    }

    const existing = moveTable.get(nextMove.san) ?? {
      san: nextMove.san,
      white: 0,
      draws: 0,
      black: 0,
    }

    if (game.winner === "white") {
      existing.white = (existing.white ?? 0) + 1
    } else if (game.winner === "black") {
      existing.black = (existing.black ?? 0) + 1
    } else {
      existing.draws = (existing.draws ?? 0) + 1
    }

    moveTable.set(nextMove.san, existing)
    matchingGames.push({
      id: game.id,
      winner: game.winner,
      white: game.white,
      black: game.black,
      year: game.year,
    })
  }

  const total = white + black + draws
  if (!total) {
    return null
  }

  const openingEco = Array.from(ecoCounts.entries()).sort(
    (left, right) => right[1] - left[1],
  )[0]?.[0]
  const moves = Array.from(moveTable.values()).sort((left, right) => {
    const leftTotal = (left.white ?? 0) + (left.draws ?? 0) + (left.black ?? 0)
    const rightTotal = (right.white ?? 0) + (right.draws ?? 0) + (right.black ?? 0)
    return rightTotal - leftTotal || (left.san ?? "").localeCompare(right.san ?? "")
  })

  return {
    white,
    black,
    draws,
    opening: openingEco
      ? {
          eco: openingEco,
          name: "Local master references",
        }
      : undefined,
    moves,
    topGames: matchingGames.sort((left, right) => (right.year ?? 0) - (left.year ?? 0)),
  }
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
      const href = explorerGameHref(game)
      const row = href
        ? makeElement("a", "training-explorer__game-row")
        : makeElement("div", "training-explorer__game-row")
      if (row instanceof HTMLAnchorElement) {
        row.href = href
        row.style.color = "inherit"
        row.style.textDecoration = "none"
        row.title = "Open this game on Lichess"
        row.setAttribute("aria-label", "Open this game on Lichess")
      }
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
    if (requestId !== controller.requestId || !controller.enabled) {
      return
    }

    try {
      const localData = await loadLocalExplorerData(currentFen)
      if (requestId !== controller.requestId || !controller.enabled) {
        return
      }

      if (localData) {
        renderExplorerData(controller, localData)
        controller.status.textContent += " (from local cited master references)"
        return
      }
    } catch (localError) {
      console.error(localError)
    }

    const message = String(error)
    clearExplorer(controller)
    controller.status.textContent = message.includes("401")
      ? "The official Lichess masters endpoint needs authentication, and no local master references matched this position."
      : "The live masters database could not be loaded right now."
  }
}

function syncEnhancement(enhancement: BoardEnhancement) {
  syncPanelBarDock(enhancement)
  syncMovePane(enhancement)
  syncBoardCommentsVisibility(enhancement.node)
  mountEvalBar(enhancement.mount, enhancement.engine)
  updateEnginePosition(enhancement)
  void loadExplorer(enhancement)
  window.setTimeout(() => {
    syncPanelBarDock(enhancement)
    syncMovePane(enhancement)
    syncBoardCommentsVisibility(enhancement.node)
    mountEvalBar(enhancement.mount, enhancement.engine)
    ensureMovePaneFallback(enhancement)
  }, 0)
  window.setTimeout(() => {
    syncPanelBarDock(enhancement)
    syncMovePane(enhancement)
    syncBoardCommentsVisibility(enhancement.node)
    mountEvalBar(enhancement.mount, enhancement.engine)
    ensureMovePaneFallback(enhancement)
  }, 180)
  window.setTimeout(() => {
    syncPanelBarDock(enhancement)
    syncMovePane(enhancement)
    syncBoardCommentsVisibility(enhancement.node)
    mountEvalBar(enhancement.mount, enhancement.engine)
    ensureMovePaneFallback(enhancement)
  }, 650)
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

function enhanceBoard(node: HTMLElement, mount: HTMLElement, viewer: ViewerApi, pgnText: string) {
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
    panelContainer,
    engine,
    explorer,
    pgnText,
  }

  boardEnhancements.set(node, enhancement)
  observePanelBarDock(enhancement)
  observeMovePaneSizing(enhancement)
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
    const enhancement = boardEnhancements.get(node)
    if (enhancement) {
      observePanelBarDock(enhancement)
      observeMovePaneSizing(enhancement)
      syncEnhancement(enhancement)
    }
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
      showMoves: preferredMovesLayout(),
    }

    const orientation = node.dataset.orientation
    if (orientation) {
      config.orientation = orientation
    }

    const viewer = viewerFactory(mount, config)
    enhanceBoard(node, mount, viewer, pgn)
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
