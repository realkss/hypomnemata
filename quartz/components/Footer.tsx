import { joinSegments, pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"
import TranslationBadge from "./TranslationBadge"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({
    displayClass,
    cfg,
    fileData,
    externalResources,
    children,
    tree,
    allFiles,
    ctx,
  }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    const TranslationNote = TranslationBadge()
    const root = fileData.slug ? pathToRoot(fileData.slug) : "."
    const basePath = cfg.baseUrl
      ? new URL(`https://${cfg.baseUrl}`).pathname.replace(/^\/+|\/+$/g, "")
      : ""
    const resolveLink = (link: string) => {
      if (/^(?:[a-z]+:)?\/\//i.test(link) || link.startsWith("#")) {
        return link
      }

      if (link.startsWith("./") || link.startsWith("../")) {
        return link
      }

      let normalized = link.replace(/^\/+/, "")
      if (basePath && (normalized === basePath || normalized.startsWith(`${basePath}/`))) {
        normalized = normalized.slice(basePath.length).replace(/^\/+/, "")
      }

      return normalized.length > 0 ? joinSegments(root, normalized) : root
    }

    return (
      <footer class={`${displayClass ?? ""}`}>
        <TranslationNote
          cfg={cfg}
          fileData={fileData}
          externalResources={externalResources}
          children={children}
          tree={tree}
          allFiles={allFiles}
          ctx={ctx}
        />
        <p>
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a>{" "}
          {"\u00A9"} {year}
        </p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={resolveLink(link)}>{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
