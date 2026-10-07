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

Demo Mode is the default and handles coaching, study prompts, voice responses, and independence analysis without network access. Choose Groq or OpenRouter in Settings to use the Cloudflare Pages Function at `/api/ai`.

Provider credentials must only be configured as server-side Cloudflare secrets:

```sh
wrangler secret put GROQ_API_KEY
wrangler secret put OPENROUTER_API_KEY
```

The optional `VITE_AI_API_URL` in `.env` is a public API base URL, never a secret. If the function is not deployed or an upstream provider is unavailable, AIService falls back to feature-aware demo responses.

## Cloudflare Pages

Connect the repository to Cloudflare Pages with build command `npm run build` and output directory `dist`. The `functions/api/ai.ts` Pages Function is bundled as the server-side AI endpoint. Add provider keys in the Pages project settings as encrypted environment secrets; do not use `VITE_` variables for secrets.

## Capacitor preparation

The application is responsive and avoids requiring server or native-only APIs for its core features. Once the mobile wrapper is needed, install Capacitor and use `dist` as its web asset directory. Device capabilities such as notifications can then be added behind services without changing the web experience.

## Privacy

Profile preferences, challenges, focus sessions, journal entries, and progress are stored locally in this browser. Text is sent to a configured AI provider only when a live provider is selected; Demo Mode stays on-device. Use **Settings → Privacy → Clear my data** to remove local AI 360 data.
