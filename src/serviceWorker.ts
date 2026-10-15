import { readonly, ref } from 'vue'

/**
 * Set once a new worker has finished installing behind the one controlling the
 * page. `ReloadPrompt.vue` renders while it is true.
 */
const updateReady = ref(false)

/* The worker that takes over when `applyUpdate()` posts to it. */
let waitingWorker: ServiceWorker | null = null

/* Set when the user accepts an update, which is the only reload we want. */
let handingOver = false

/**
 * Registers the service worker in `public/sw.js`.
 *
 * Production only — in dev it would sit in front of Vite's HMR module
 * rewrites. Use `pnpm build && pnpm preview` to exercise it locally.
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return

  /*
   * On `load`, so the worker never competes with the first paint. The browser
   * fetches a worker's script at low priority anyway.
   */
  window.addEventListener('load', () => {
    /* `BASE_URL` keeps this correct if the app is ever served from a subpath. */
    const url = `${import.meta.env.BASE_URL}sw.js`

    navigator.serviceWorker
      .register(url)
      .then(watchForUpdates)
      .catch((error: unknown) => {
        console.error('[sw] registration failed', error)
      })
  })

  /*
   * `clients.claim()` fires this on a first install too, so reload only when
   * `applyUpdate()` asked for the swap — otherwise every first visit would
   * bounce the page for no reason.
   */
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (handingOver) window.location.reload()
  })
}

/**
 * Flags an update once a new worker finishes installing next to the one
 * already controlling the page. A first-ever install is not an update.
 */
function watchForUpdates(registration: ServiceWorkerRegistration): void {
  /* Left waiting by an earlier visit — this tab was open when it installed. */
  if (registration.waiting && navigator.serviceWorker.controller) {
    waitingWorker = registration.waiting
    updateReady.value = true
  }

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing
    if (!installing) return

    installing.addEventListener('statechange', () => {
      if (installing.state !== 'installed') return
      /* No controller means nothing is being replaced: this is the first install. */
      if (!navigator.serviceWorker.controller) return

      waitingWorker = registration.waiting
      updateReady.value = true
    })
  })
}

/** Hands over to the waiting worker; `controllerchange` then reloads the page. */
function applyUpdate(): void {
  if (!waitingWorker || handingOver) return

  handingOver = true
  waitingWorker.postMessage({ type: 'SKIP_WAITING' })
}

/** Read-only view of the update flag, plus the action the prompt calls. */
export function useServiceWorkerUpdate() {
  return { updateReady: readonly(updateReady), applyUpdate }
}
