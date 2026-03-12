import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 * Docs: https://quartz.jzhao.xyz/configuration
 *
 * Notes:
 * - Art Deco header font: Limelight (Google Fonts)
 * - Clean “editorial” palette + higher contrast text
 * - Fixes RSS “looks like XML” confusion: RSS is supposed to be XML at /index.xml.
 *   Your actual homepage is / (served from index.html generated from content/index.md).
 */
const config: QuartzConfig = {
  configuration: {
    // Site identity
    pageTitle: "Hypomnemata",
    pageTitleSuffix: "",
    locale: "en-US",

    // IMPORTANT: no protocol here. This should match the GitHub Pages path.
    // (owner.github.io/repo)
    baseUrl: "hypomnemata-b8t.pages.dev",

    // UX
    enableSPA: true,
    enablePopovers: true,
    defaultDateType: "modified",

    // Don’t publish these folders
    ignorePatterns: [
      "private",
      "Private Notes",
      "templates",
      ".obsidian",
      ".trash",
      ".DS_Store",
      "Thumbs.db",
    ],

    // Analytics (optional)
    analytics: {
      provider: "plausible",
      // host: "https://plausible.io", // set only if you self-host
    },

    // Theme
          theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Cinzel",
        body: "EB Garamond",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#f8f5ef",
          lightgray: "#d9d4c8",
          gray: "#b7afa1",
          darkgray: "#4e463d",
          dark: "#1f1b16",
          secondary: "#8b6b2c",
          tertiary: "#6f8c9b",
          highlight: "rgba(139, 107, 44, 0.10)",
          textHighlight: "#f3df9b88",
        },
        darkMode: {
          light: "#121212",
          lightgray: "#2a2a2a",
          gray: "#5f5a54",
          darkgray: "#ddd6cc",
          dark: "#f6f1e8",
          secondary: "#c6a15b",
          tertiary: "#8fb7cc",
          highlight: "rgba(198, 161, 91, 0.12)",
          textHighlight: "#c6a15b66",
        },
      },
    },
  },

  plugins: {
    transformers: [
      Plugin.FrontMatter(),

      // Prefer explicit dates in frontmatter, then git, then filesystem
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),

      // Better code blocks
      Plugin.SyntaxHighlighting({
        theme: { light: "github-light", dark: "github-dark" },
        keepBackground: false,
      }),

      // Obsidian compat
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),

      // Nice reading experience
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],

    filters: [
      // Don’t publish drafts
      Plugin.RemoveDrafts(),
    ],

    emitters: [
      // Useful if you rename notes
      Plugin.AliasRedirects(),

      // JS/CSS needed by components
      Plugin.ComponentResources(),

      // Pages
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.AccessControlIndex(),

      // Index + feeds
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true, // RSS will be XML — that’s normal
      }),

      // Static assets + favicon + 404
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),

      // Pretty social preview images (can slow builds)
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
