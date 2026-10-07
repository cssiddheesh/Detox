# AI 360

AI 360 is a local-first digital wellness companion that helps students focus, learn alongside AI, and build healthier technology habits.

## Setup

```sh
npm install
npm run dev
```

No account or API key is required. The app starts with an exhibition-ready Demo Mode and saves progress in the browser.

### Windows one-click launch

Double-click **Run AI 360.bat** in the project folder. It checks for Node.js and npm, installs dependencies from the lockfile on first run, and opens the app in your browser. Keep the launcher window open while using AI 360. If Node.js is missing, install it from [nodejs.org](https://nodejs.org/) and run the script again.

## Commands

- `npm run dev` — start the development server
- `npm run typecheck` — run the TypeScript check
- `npm run build` — type-check and create the production build in `dist/`
- `npm run preview` — preview the production build locally

## Demo Mode and AI providers

Demo Mode is the default and handles coaching, study prompts, voice responses, and independence analysis without network access. In Settings, choose Groq, an OpenAI-compatible service, a custom endpoint, or a local server such as Ollama or LM Studio. Configure the API base URL and model there; model discovery works for compatible `/models` endpoints and Ollama's `/api/tags`.

For Groq and OpenRouter, leave the Settings API key field blank to keep credentials on Cloudflare. Configure encrypted provider secrets:

```sh
wrangler secret put GROQ_API_KEY
wrangler secret put OPENROUTER_API_KEY
```

`VITE_AI_API_URL` is an optional public base URL for a separate AI 360 API deployment; leave it blank when the app and Pages Function are deployed together. `VITE_GROQ_API_URL` is the public Groq API base URL used to prefill the Groq settings form (`https://api.groq.com/openai/v1` by default). Neither variable is an API key. Never put secrets in `VITE_` variables.

API keys typed into Settings for direct/custom providers are kept in memory for the current browser tab only; they are not stored in local storage, exported, or synchronized. Direct endpoints must allow browser CORS. Local endpoints must be reachable from the device running the browser; use `http://localhost:11434/v1` for Ollama or configure the local server's CORS/origin settings. A phone cannot use `localhost` to reach an AI server running on a separate computer—use that computer's LAN address instead.

Responses stream progressively when the endpoint supports OpenAI-compatible server-sent events; ordinary JSON chat responses are also accepted. Requests have a timeout and can be cancelled from Voice AI. If a live provider fails, the app shows a diagnostic and uses a Demo Mode response. Retry by resubmitting the prompt or test the connection in Settings. Speech recognition and speech synthesis use browser-provided features; support and available voices vary by browser/device.

## Cloudflare Pages

Connect the repository to Cloudflare Pages with build command `npm run build` and output directory `dist`. The `functions/api/ai.ts` Pages Function is bundled as the server-side Groq/OpenRouter endpoint. Add `GROQ_API_KEY` and/or `OPENROUTER_API_KEY` in the Pages project settings as encrypted secrets; do not use `VITE_` variables for secrets. Set `VITE_GROQ_API_URL` only as a public endpoint URL. If using `wrangler pages dev`, configure secrets in the local Wrangler environment as well.

## Capacitor preparation

The application is responsive and avoids requiring server or native-only APIs for its core features. Once the mobile wrapper is needed, install Capacitor and use `dist` as its web asset directory. Device capabilities such as notifications can then be added behind services without changing the web experience.

## Privacy

Profile preferences, challenges, focus sessions, journal entries, and progress are stored locally in this browser. Text is sent to a configured AI provider only when a live provider is selected; Demo Mode stays on-device. Use **Settings → Privacy → Clear my data** to remove local AI 360 data.
