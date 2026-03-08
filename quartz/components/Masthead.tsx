import { joinSegments, pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Masthead: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const root = pathToRoot(fileData.slug!)
  const homeHref = root
  const topicsHref = `${root}#topics`
  const lexiconHref = joinSegments(root, "lexicon")
  const keeperHref = joinSegments(root, "keeper")
  const greekTitle = "\u1f51\u03c0\u03bf\u03bc\u03bd\u03ae\u03bc\u03b1\u03c4\u03b1"

  return (
    <div class="site-masthead">
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
            <a href={homeHref}>Home</a>
            <a href={topicsHref}>Topics</a>
            <a href={lexiconHref}>Lexicon</a>
            <a href={keeperHref}>On the Keeper</a>
          </nav>
        </div>
      </div>
    </div>
  )
}

Masthead.displayName = "Masthead"

export default (() => Masthead) satisfies QuartzComponentConstructor
