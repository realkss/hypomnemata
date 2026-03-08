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
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
