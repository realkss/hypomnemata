import { joinSegments, pathToRoot } from "../util/path"
// @ts-ignore
import mastheadScript from "./scripts/masthead.inline"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Masthead: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const root = pathToRoot(fileData.slug!)
  const homeHref = root
  const topicsHref = `${root}#topics`
  const lexiconHref = joinSegments(root, "lexicon")
  const keeperHref = joinSegments(root, "keeper")
  const greekTitle = "\u1f51\u03c0\u03bf\u03bc\u03bd\u03ae\u03bc\u03b1\u03c4\u03b1"

  return (
    <>
    <a href="#quartz-body" class="skip-to-content">Skip to content</a>
    <div class="site-masthead" role="banner">
      <div class="site-masthead__ornament" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="site-masthead__inner">
        <p class="site-masthead__kicker">{greekTitle}</p>
        <div class="site-masthead__body">
          <div>
            <h1 class="site-masthead__title">Hypomnemata</h1>
            <p class="site-masthead__subtitle">
              A digital commonplace book shaped by the older disciplines of study, recollection, and return.
            </p>
          </div>
          <nav class="site-masthead__nav" aria-label="Primary">
            <div class="site-masthead__nav-links">
              <a href={homeHref}>Home</a>
              <a href={topicsHref}>Topics</a>
              <a href={lexiconHref}>Lexicon</a>
              <a href={keeperHref}>On the Keeper</a>
            </div>
            <button
              class="site-masthead__hamburger"
              aria-label="Toggle navigation menu"
              aria-expanded="false"
              aria-controls="masthead-mobile-menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line class="hamburger-top" x1="3" y1="6" x2="21" y2="6" />
                <line class="hamburger-mid" x1="3" y1="12" x2="21" y2="12" />
                <line class="hamburger-bot" x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div id="masthead-mobile-menu" class="site-masthead__drawer" aria-hidden="true">
              <a href={homeHref}>Home</a>
              <a href={topicsHref}>Topics</a>
              <a href={lexiconHref}>Lexicon</a>
              <a href={keeperHref}>On the Keeper</a>
            </div>
          </nav>
        </div>
      </div>
    </div>
    </>
  )
}

Masthead.afterDOMLoaded = mastheadScript
Masthead.displayName = "Masthead"

export default (() => Masthead) satisfies QuartzComponentConstructor
