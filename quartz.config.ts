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
    baseUrl: "realkss.github.io/hypomnemata",

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

      // Art Deco header + readable body
      typography: {
        header: "Limelight",
        body: "Josefin Sans",
        code: "JetBrains Mono",
      },

      /**
       * A cleaner, less “plain” look:
       * - softer background
       * - stronger text contrast
       * - deeper accent for links/buttons
       * - slightly warmer highlight
       */
      colors: {
        lightMode: {
          light: "#fbfaf7",
          lightgray: "#ebe7e2",
          gray: "#c7c0b8",
          darkgray: "#3a3a3a",
          dark: "#161616",
          secondary: "#1f4d6b",
          tertiary: "#b07a2a",
          highlight: "rgba(31, 77, 107, 0.10)",
          textHighlight: "#fff3a6cc",
        },
        darkMode: {
          light: "#121214",
          lightgray: "#26262a",
          gray: "#6f6f78",
          darkgray: "#d8d8de",
          dark: "#f3f3f6",
          secondary: "#8db6d6",
          tertiary: "#d6a35a",
          highlight: "rgba(141, 182, 214, 0.12)",
          textHighlight: "#ffd86bcc",
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
