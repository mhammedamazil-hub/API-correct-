# API Correct

A **100% frontend-only** authorized API key checker. It is a static Vite + React app. There is **no backend, no database, no proxy, no serverless function, and no environment variables**.

That is why it **deploys for free on GitHub Pages**.

> Only test API credentials that you own or are explicitly authorized to test.

## What it does

1. You drop a `.txt` file with one key per line.
2. The file is read **in the browser** with `File.text()`. It is never uploaded to this project.
3. Duplicate keys are checked once. Original line numbers are kept.
4. Each unique key is tested against the **official provider API** with the smallest auth request (list models / check key). No chat completions are generated.
5. **VALID** is shown only after a real HTTP 2xx from that provider.
6. CORS or network failures are **never** reported as invalid.

## Providers

| Provider | Test request |
| --- | --- |
| OpenAI | `GET https://api.openai.com/v1/models` |
| Google Gemini | `GET https://generativelanguage.googleapis.com/v1beta/models` (`x-goog-api-key` header, never `?key=`) |
| Anthropic | `GET https://api.anthropic.com/v1/models` + `anthropic-dangerous-direct-browser-access: true` |
| Groq | `GET https://api.groq.com/openai/v1/models` |
| OpenRouter | `GET https://openrouter.ai/api/v1/key` |
| Mistral | `GET https://api.mistral.ai/v1/models` |
| Cohere | `POST https://api.cohere.com/v1/check-api-key` |
| Together AI | `GET https://api.together.ai/v1/models` |

## Browser / CORS limitation

This is a genuine checker, not a demo. The request is a real `fetch()` from your browser to the provider.

Some providers do not send CORS headers to random origins. When the browser blocks the response, the row is marked:

**BROWSER BLOCKED — This provider cannot be verified directly from a static frontend.**

That is **not** INVALID. This project will not add a proxy to bypass CORS, because a proxy would be a backend.

## Security

- No analytics, Sentry, or telemetry.
- Keys are not written to `localStorage`, URLs, or console logs.
- Full keys stay in RAM until you click **Show full key** or **Clear everything**.
- Theme preference is the only thing stored locally.

## Local development

Requires Node 18+.

```bash
npm install
npm test
npm run dev
```

Open the printed local URL. For a production build:

```bash
npm run build
npm run preview
```

The production output is the `dist/` folder. That folder is the entire website.

## Deploy to GitHub Pages (free)

`vite.config.ts` sets `base: './'` so asset paths work on both user sites and project sites (`https://<user>.github.io/<repo>/`).

GitHub Pages is free for public repositories. The built site is just static files in `dist/`. No server, no paid plan, no env vars.

### Fastest: deploy the `docs/` folder

```bash
npm install
npm run build
rm -rf docs
cp -R dist docs
```

Commit `docs/`, then in GitHub:

1. **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` (or this branch) / folder: **/docs**
4. Save

The site is `https://<user>.github.io/<repo>/`.

`public/.nojekyll` is copied into the build so Pages does not ignore generated files.

### Optional: GitHub Actions

If you want Pages to build on every push, create `.github/workflows/deploy.yml` in the GitHub UI (Actions permission required) with:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Then Settings → Pages → Source: **GitHub Actions**.

## Usage

1. Confirm you are authorized to test the keys.
2. Upload a UTF-8 `.txt` file:

```text
# comments and blank lines are ignored
sk-key-from-line-2
sk-key-from-line-3
sk-key-from-line-2
```

Line 4 is a duplicate of line 2. It is not sent twice; it inherits line 2’s result.

3. Pick a provider, set concurrency (1–8), and click **Start checking**.
4. Pause, resume, or stop at any time. Stop cancels remaining requests.
5. Click a row → **Show full key** → Copy or Hide.
6. Export CSV / JSON / valid keys.

## Architecture

```text
src/
  providers/     one adapter per vendor
  engine/        concurrency, pause/resume/stop, retries
  lib/           parser, classifier, mask, export
  components/    UI
  hooks/         checker state
```

Provider-specific URLs and headers live only under `src/providers/`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm test` | Vitest |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve `dist/` locally |

## License

MIT
