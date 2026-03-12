import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/accessAdminConsole.scss"
// @ts-ignore
import script from "./scripts/accessAdminConsole.inline"

const ADMIN_ACCESS_SLUG = "censorium-access-control"

const AccessAdminConsole: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (fileData.slug !== ADMIN_ACCESS_SLUG) {
    return null
  }

  return (
    <section class="access-admin-console" data-access-admin-console aria-live="polite">
      <div class="access-admin-console__intro">
        <p class="access-admin-console__eyebrow">Owner Console</p>
        <h2>Access control</h2>
        <p>
          Restricted pages are managed here. Mark a note with <code>access: restricted</code> in
          frontmatter to make it show up below.
        </p>
      </div>

      <div class="access-admin-console__status" data-access-admin-status>
        Loading access rules...
      </div>

      <div class="access-admin-console__summary" data-access-admin-summary hidden></div>
      <div class="access-admin-console__pages" data-access-admin-pages hidden></div>
      <div class="access-admin-console__users" data-access-admin-users hidden></div>
    </section>
  )
}

AccessAdminConsole.css = style
AccessAdminConsole.afterDOMLoaded = script

export default (() => AccessAdminConsole) satisfies QuartzComponentConstructor
