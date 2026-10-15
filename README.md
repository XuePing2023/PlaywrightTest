# vue-project

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Service Worker

A hand-written worker in `public/sw.js`, registered by `src/serviceWorker.ts` and
wired into the app by `src/main.ts` / `src/App.vue`. No build plugin, no
dependencies — Vite copies `public/` into `dist/` as-is.

How it serves requests:

| Request                             | Strategy                                                          |
| ----------------------------------- | ----------------------------------------------------------------- |
| Navigations (`request.mode`)        | Network first, falling back to the cached `index.html`            |
| `/assets/*` (content-hashed)        | Cache first — a hash change is a new URL, so a hit is never stale |
| Everything else, same origin        | Stale while revalidate                                            |
| Cross-origin, non-GET, Vite dev HMR | Untouched                                                         |

Registration is **production only**, so `pnpm dev` never puts a cache in front of
Vite's HMR rewrites. To exercise it locally:

```sh
npm run build-only && npm run preview
```

Then check DevTools → Application → Service Workers. Going offline in the Network
tab and navigating to `/about` should still render.

### Shipping an update

Editing `public/sw.js` (or deploying any new build) makes the browser install a
new worker **waiting** behind the running one. Once it installs, `ReloadPrompt.vue`
shows a "new version is available" button; the worker only takes over — and the
page only reloads — when that button is pressed, so an open tab is never reloaded
out from under the user. Bump `VERSION` in `public/sw.js` to drop the old caches
on the following activation.

### Known limitation

Routes are lazy-loaded, so a chunk that has never been fetched online is not in
the cache. Offline works for the app shell and for any route visited at least
once; a **first-ever** offline deep link to an unvisited route cannot resolve its
chunk. Precaching every chunk means generating a build manifest — that is the
job `vite-plugin-pwa` exists to do, if it becomes necessary.
