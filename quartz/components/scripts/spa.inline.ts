import micromorph from "micromorph"
import { FullSlug, RelativeURL, getFullSlug, normalizeRelativeURLs } from "../../util/path"
import { fetchCanonical } from "./util"

// adapted from `micromorph`
// https://github.com/natemoo-re/micromorph
const NODE_TYPE_ELEMENT = 1
let announcer = document.createElement("route-announcer")
const isElement = (target: EventTarget | null): target is Element =>
  (target as Node)?.nodeType === NODE_TYPE_ELEMENT
const isLocalUrl = (href: string) => {
  try {
    const url = new URL(href)
    if (window.location.origin === url.origin) {
      return true
    }
  } catch (e) {}
  return false
}

const isSamePage = (url: URL): boolean => {
  const sameOrigin = url.origin === window.location.origin
  const samePath = url.pathname === window.location.pathname
  return sameOrigin && samePath
}

const getOpts = ({ target }: Event): { url: URL; scroll?: boolean } | undefined => {
  if (!isElement(target)) return
  if (target.attributes.getNamedItem("target")?.value === "_blank") return
  const a = target.closest("a")
  if (!a) return
  if ("routerIgnore" in a.dataset) return
  const { href } = a
  if (!isLocalUrl(href)) return
  return { url: new URL(href), scroll: "routerNoscroll" in a.dataset ? false : undefined }
}

function notifyNav(url: FullSlug) {
  const event: CustomEventMap["nav"] = new CustomEvent("nav", { detail: { url } })
  document.dispatchEvent(event)
}

const cleanupFns: Set<(...args: any[]) => void> = new Set()
window.addCleanup = (fn) => cleanupFns.add(fn)

function startLoading() {
  const loadingBar = document.createElement("div")
  loadingBar.className = "navigation-progress"
  loadingBar.style.width = "0"
  if (!document.body.contains(loadingBar)) {
    document.body.appendChild(loadingBar)
  }

  setTimeout(() => {
    loadingBar.style.width = "80%"
  }, 100)
}

let isNavigating = false
let p: DOMParser
async function _navigate(url: URL, isBack: boolean = false) {
  isNavigating = true
  startLoading()
  p = p || new DOMParser()
  const contents = await fetchCanonical(url)
    .then((res) => {
      const contentType = res.headers.get("content-type")
      if (contentType?.startsWith("text/html")) {
        return res.text()
      } else {
        window.location.assign(url)
      }
    })
    .catch(() => {
      window.location.assign(url)
    })

  if (!contents) return

  // notify about to nav
  const event: CustomEventMap["prenav"] = new CustomEvent("prenav", { detail: {} })
  document.dispatchEvent(event)

  // cleanup old
  cleanupFns.forEach((fn) => fn())
  cleanupFns.clear()

  const html = p.parseFromString(contents, "text/html")
  normalizeRelativeURLs(html, url)

  let title = html.querySelector("title")?.textContent
  if (title) {
    document.title = title
  } else {
    const h1 = document.querySelector("h1")
    title = h1?.innerText ?? h1?.textContent ?? url.pathname
  }
  if (announcer.textContent !== title) {
    announcer.textContent = title
  }
  announcer.dataset.persist = ""
  html.body.appendChild(announcer)

  // morph body
  await micromorph(document.body, html.body)

  // re-create persistent UI after morph
  ensureReadingProgressBar()
  ensureBackToTop()

  // page transition
  const pageArticle = document.querySelector(".center > article") as HTMLElement
  if (pageArticle) {
    pageArticle.classList.add("page-enter")
    pageArticle.addEventListener(
      "animationend",
      () => pageArticle.classList.remove("page-enter"),
      { once: true },
    )
  }

  // re-init scroll reveal for new page
  initScrollReveal()

  // scroll into place and add history
  if (!isBack) {
    if (url.hash) {
      const el = document.getElementById(decodeURIComponent(url.hash.substring(1)))
      el?.scrollIntoView()
    } else {
      window.scrollTo({ top: 0 })
    }
  }

  // now, patch head, re-executing scripts
  const elementsToRemove = document.head.querySelectorAll(":not([data-persist])")
  elementsToRemove.forEach((el) => el.remove())
  const elementsToAdd = html.head.querySelectorAll(":not([data-persist])")
  elementsToAdd.forEach((el) => document.head.appendChild(el))

  // delay setting the url until now
  // at this point everything is loaded so changing the url should resolve to the correct addresses
  if (!isBack) {
    history.pushState({}, "", url)
  }

  notifyNav(getFullSlug(window))
  delete announcer.dataset.persist
}

async function navigate(url: URL, isBack: boolean = false) {
  if (isNavigating) return
  isNavigating = true
  try {
    await _navigate(url, isBack)
  } catch (e) {
    console.error(e)
    window.location.assign(url)
  } finally {
    isNavigating = false
  }
}

window.spaNavigate = navigate

function createRouter() {
  if (typeof window !== "undefined") {
    window.addEventListener("click", async (event) => {
      const { url } = getOpts(event) ?? {}
      // dont hijack behaviour, just let browser act normally
      if (!url || event.ctrlKey || event.metaKey) return
      event.preventDefault()

      if (isSamePage(url) && url.hash) {
        const el = document.getElementById(decodeURIComponent(url.hash.substring(1)))
        el?.scrollIntoView()
        history.pushState({}, "", url)
        return
      }

      navigate(url, false)
    })

    window.addEventListener("popstate", (event) => {
      const { url } = getOpts(event) ?? {}
      if (window.location.hash && window.location.pathname === url?.pathname) return
      navigate(new URL(window.location.toString()), true)
      return
    })
  }

  return new (class Router {
    go(pathname: RelativeURL) {
      const url = new URL(pathname, window.location.toString())
      return navigate(url, false)
    }

    back() {
      return window.history.back()
    }

    forward() {
      return window.history.forward()
    }
  })()
}

createRouter()
notifyNav(getFullSlug(window))

// Reading progress bar
function ensureReadingProgressBar() {
  if (document.body && !document.querySelector(".reading-progress")) {
    const bar = document.createElement("div")
    bar.className = "reading-progress"
    bar.setAttribute("aria-hidden", "true")
    document.body.prepend(bar)
  }
}

function updateReadingProgress() {
  const bar = document.querySelector(".reading-progress") as HTMLElement
  if (!bar) return
  const article = document.querySelector(".center > article") as HTMLElement
  if (!article) {
    bar.style.width = "0"
    return
  }
  const scrollY = window.scrollY
  const articleTop = article.offsetTop
  const articleHeight = article.offsetHeight
  const viewportHeight = window.innerHeight
  if (articleHeight <= viewportHeight) {
    bar.style.width = scrollY > articleTop ? "100%" : "0"
    return
  }
  const end = articleTop + articleHeight - viewportHeight
  const pct = Math.min(Math.max((scrollY - articleTop) / (end - articleTop), 0), 1)
  bar.style.width = `${pct * 100}%`
}

// Back-to-top button
function ensureBackToTop() {
  if (document.body && !document.querySelector(".back-to-top")) {
    const btn = document.createElement("button")
    btn.className = "back-to-top"
    btn.setAttribute("aria-label", "Back to top")
    btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>'
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
    document.body.appendChild(btn)
  }
}

function updateBackToTop() {
  const btn = document.querySelector(".back-to-top") as HTMLElement
  if (!btn) return
  btn.classList.toggle("visible", window.scrollY > 400)
}

// Scroll-reveal for landing page elements
function initScrollReveal() {
  const elements = document.querySelectorAll(
    ".landing-card:not(.scroll-reveal), .landing-inscription:not(.scroll-reveal)",
  )
  if (elements.length === 0) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed")
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  )

  elements.forEach((el, i) => {
    el.classList.add("scroll-reveal")
    ;(el as HTMLElement).style.transitionDelay = `${i * 0.08}s`
    observer.observe(el)
  })
}

// Image lightbox (event delegation — only needs to be called once)
let lightboxInitialized = false
function initLightbox() {
  if (lightboxInitialized) return
  lightboxInitialized = true

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    if (
      target.tagName === "IMG" &&
      target.closest("article") &&
      !target.classList.contains("no-lightbox") &&
      !target.closest("a")
    ) {
      const overlay = document.createElement("div")
      overlay.className = "lightbox-overlay"
      const img = document.createElement("img")
      img.src = (target as HTMLImageElement).src
      img.alt = (target as HTMLImageElement).alt
      overlay.appendChild(img)
      document.body.appendChild(overlay)

      requestAnimationFrame(() => overlay.classList.add("active"))

      function closeLightbox() {
        overlay.classList.remove("active")
        overlay.addEventListener("transitionend", () => overlay.remove(), { once: true })
      }

      overlay.addEventListener("click", closeLightbox)
      document.addEventListener(
        "keydown",
        function onEsc(e) {
          if (e.key === "Escape") {
            closeLightbox()
            document.removeEventListener("keydown", onEsc)
          }
        },
      )
    }
  })
}

let rpRaf = 0
window.addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(rpRaf)
    rpRaf = requestAnimationFrame(() => {
      updateReadingProgress()
      updateBackToTop()
    })
  },
  { passive: true },
)

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ensureReadingProgressBar()
    ensureBackToTop()
    updateReadingProgress()
    updateBackToTop()
    initScrollReveal()
    initLightbox()
  })
} else {
  ensureReadingProgressBar()
  ensureBackToTop()
  updateReadingProgress()
  updateBackToTop()
  initScrollReveal()
  initLightbox()
}

if (!customElements.get("route-announcer")) {
  const attrs = {
    "aria-live": "assertive",
    "aria-atomic": "true",
    style:
      "position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px",
  }

  customElements.define(
    "route-announcer",
    class RouteAnnouncer extends HTMLElement {
      constructor() {
        super()
      }
      connectedCallback() {
        for (const [key, value] of Object.entries(attrs)) {
          this.setAttribute(key, value)
        }
      }
    },
  )
}
