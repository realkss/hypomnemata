import { joinSegments, pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Masthead: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const root = pathToRoot(fileData.slug!)
  const homeHref = root
  const subjectsHref = `${root}#subjects`
  const keeperHref = joinSegments(root, "keeper")

  return (
    <div class="site-masthead">
      <div class="site-masthead__ornament" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="site-masthead__inner">
        <p class="site-masthead__kicker">ὑπομνήματα</p>
        <div class="site-masthead__body">
          <div>
            <h1 class="site-masthead__title">Hypomnemata</h1>
            <p class="site-masthead__subtitle">
              A commonplace book in physics, mathematics, graphics, and computation.
            </p>
          </div>
          <nav class="site-masthead__nav" aria-label="Primary">
            <a href={homeHref}>Home</a>
            <a href={subjectsHref}>Subjects</a>
            <a href={keeperHref}>On the Keeper</a>
          </nav>
        </div>
      </div>
    </div>
  )
}

Masthead.displayName = "Masthead"

export default (() => Masthead) satisfies QuartzComponentConstructor
