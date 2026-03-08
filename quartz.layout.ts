import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.Masthead()],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/realkss/hypomnemata",
    },
  }),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index" && page.fileData.slug !== "keeper",
    }),
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.LanguageSwitcher(),
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [
    Component.ConditionalRender({
      component: Component.Graph({
        localGraph: {
          depth: 2,
          scale: 1.05,
          repelForce: 0.8,
          centerForce: 0.25,
          linkDistance: 42,
          fontSize: 0.75,
          opacityScale: 1.15,
          focusOnHover: true,
        },
        globalGraph: {
          scale: 0.95,
          repelForce: 0.65,
          centerForce: 0.2,
          linkDistance: 46,
          fontSize: 0.75,
          opacityScale: 1.1,
          focusOnHover: true,
          enableRadial: true,
        },
      }),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.Backlinks(),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.LanguageSwitcher(),
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [],
}
