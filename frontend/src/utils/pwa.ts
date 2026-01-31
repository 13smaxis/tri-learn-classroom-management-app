/**
 * PWA Service Worker Registration and Management
 */

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })
    console.log('Service Worker registered:', registration)

    // Check for updates periodically
    setInterval(() => {
      registration.update()
    }, 60000) // Check every minute

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is ready, show update prompt
          console.log('New version available! Please refresh.')
          // You can show a toast/modal here to notify the user
        }
      })
    })
  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister()
      })
    })
  }
}
