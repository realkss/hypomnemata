# Cloudflare Pages Migration

This repo can be moved off GitHub Pages onto Cloudflare Pages so the whole site and the chess "Masters" proxy live together on one platform.

## What this adds

- Static Quartz site hosted on Cloudflare Pages
- Pages Function at `functions/api/chess/masters.ts`
- Same-origin frontend endpoint: `/api/chess/masters`
- Lichess token stored as a Cloudflare secret instead of exposed in the browser
- Optional GitHub Actions workflow for production deploys: `.github/workflows/deploy-cloudflare-pages.yml`

## Cloudflare Pages setup

1. Create a Cloudflare Pages project connected to this repository.
2. Use this build command:

```bash
npm ci && npx quartz build
```

3. Use this output directory:

```text
public
```

4. Add a project secret named:

```text
LICHESS_API_TOKEN
```

5. Add GitHub repository secrets if you want CI/CD deploys:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_PAGES_PROJECT
```

The Cloudflare workflow will skip itself until those three repository secrets exist.

## After cutover

1. Point your Cloudflare Pages project at the final domain you want to use.
2. Update `baseUrl` in `quartz.config.ts` so it matches the Cloudflare-hosted domain.
3. Disable the GitHub Pages deployment workflow if you no longer want dual deploys.

## Notes

- The frontend now defaults to `/api/chess/masters`, so once the site is on Cloudflare Pages the proxy becomes same-origin automatically.
- The token lives only in Cloudflare Pages Functions.
- If you keep GitHub Pages active during migration, the local fallback will still handle boards when `/api/chess/masters` is unavailable.
