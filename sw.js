const PROXY_PREFIX = '/proxy/';

// Intercept all network fetches inside the iframe sandbox scope
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip assets belonging directly to the proxy application itself
  if (url.pathname.startsWith('/gateway') || url.pathname.startsWith('/proxy/')) {
    return;
  }

  // Retrieve the referer to deduce which site this asset belongs to
  const referer = event.request.referrer;
  if (referer && referer.includes(PROXY_PREFIX)) {
    try {
      // Extract the target destination origin from the referer path
      const parts = referer.split(PROXY_PREFIX);
      if (parts.length > 1) {
        const targetContext = parts[1].split('/')[0]; // e.g., "https:||tiktok.com" or "https://tiktok.com"
        const cleanContext = decodeURIComponent(targetContext).replace(/\|/g, '/');
        
        // Construct the new fully-qualified proxy asset URL
        const proxiedUrl = `${self.location.origin}${PROXY_PREFIX}${cleanContext}${url.pathname}${url.search}`;
        
        event.respondWith(
          fetch(proxiedUrl, {
            method: event.request.method,
            headers: event.request.headers,
            credentials: event.request.credentials,
            mode: event.request.mode === 'navigate' ? 'same-origin' : event.request.mode
          })
        );
        return;
      }
    } catch (err) {
      console.error('Service Worker asset routing mismatch:', err);
    }
  }
});
