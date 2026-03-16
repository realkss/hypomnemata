import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <article class="popover-hint not-found">
      <p class="not-found__code">404</p>
      <h1 class="not-found__title">Page Not Found</h1>
      <p class="not-found__message">
        The page you seek has wandered beyond the margins of this notebook.
      </p>
      <a href={baseDir} class="not-found__link">
        Return Home
      </a>
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor
