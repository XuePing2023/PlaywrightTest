/*
 * Hand-written service worker for the app shell.
 *
 * Registered from `src/serviceWorker.ts`, production builds only. It keeps the
 * shell available offline and caches the content-hashed build output under
 * `/assets/`. Editing this file is what makes browsers see an update — they
 * re-fetch the script on navigation — so a running worker only hands over when
 * the page asks it to, via the `SKIP_WAITING` message at the bottom.
 */

/* Bump to drop every cache below and rebuild it from the network. */
const VERSION = 'v1'

const SHELL_CACHE = `app-shell-${VERSION}`
const ASSET_CACHE = `assets-${VERSION}`
const ACTIVE_CACHES = [SHELL_CACHE, ASSET_CACHE]

/*
 * Resolved against this script, so the URLs stay correct under a non-root
 * `base` in vite.config.ts. `index.html` doubles as the SPA fallback.
 */
const INDEX_URL = new URL('./index.html', self.location.href).href
const APP_SHELL = ['./', './index.html', './favicon.ico']

/*
 * Every lookup below ignores `Vary`. Hosts commonly send `Vary: Origin` (vite
 * preview) or `Vary: Accept-Encoding`, and a cached entry then only matches a
 * request carrying the same headers — so a URL that is visibly in the cache
 * can still miss. These URLs are already versioned, by Vite's hashes or by
 * `VERSION`, so `Vary` buys nothing here.
 */
const MATCH_OPTIONS = { ignoreVary: true }

self.addEventListener('install', (event) => {
  /*
   * Deliberately no `skipWaiting()`: the app decides when to swap versions, so
   * an open tab is never reloaded out from under the user.
   */
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      /* One at a time, so a single missing file cannot discard the whole shell. */
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url))).then((results) => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`[sw] could not precache ${APP_SHELL[index]}`, result.reason)
          }
        })
      }),
    ),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      /* Drop caches left behind by any earlier VERSION. */
      const names = await caches.keys()
      await Promise.all(
        names.filter((name) => !ACTIVE_CACHES.includes(name)).map((name) => caches.delete(name)),
      )

      /* Adopt the pages that are already open, so one reload is enough. */
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return

  const url = new URL(request.url)

  /* Cross-origin traffic — CDNs, fonts, analytics — is none of our business. */
  if (url.origin !== self.location.origin) return

  /* Chrome's `only-if-cached` probe: answering it from a worker throws. */
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return

  /* Vite's dev server rewrites modules for HMR; a cache in front of it breaks. */
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules/')) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
  } else if (url.pathname.includes('/assets/')) {
    /* Content-hashed by Vite, so a cache hit can never be stale. */
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(staleWhileRevalidate(request))
  }
})

/*
 * Network first, so a deploy is never masked by the cache. Offline, every
 * route falls back to the cached shell and vue-router takes it from there.
 */
async function handleNavigation(request) {
  try {
    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      /* Stored under the index key: every route returns the same document. */
      await cache.put(INDEX_URL, response.clone())
    }

    return response
  } catch {
    return (await caches.match(INDEX_URL, MATCH_OPTIONS)) ?? offlineResponse()
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, MATCH_OPTIONS)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE)
    await cache.put(request, response.clone())
  }

  return response
}

/* Good for anything unhashed: show the cached copy, refresh it in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE)
  const cached = await cache.match(request, MATCH_OPTIONS)

  const network = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(request, response.clone())
    return response
  })

  if (cached) {
    /* Nothing awaits the revalidation, so keep its rejection from surfacing. */
    network.catch(() => {})
    return cached
  }

  return network.catch(() => offlineResponse())
}

function offlineResponse() {
  return new Response('Offline, and the app shell has not been cached yet.', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

/* Posted by the page once the user accepts the update prompt. */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
