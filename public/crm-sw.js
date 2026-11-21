// Service Worker ultraleve do Aura Fitness CRM (instalação instantânea)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Intercepta apenas navegações sem atrasar assets, imagens ou APIs
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aura CRM</title><body style="font-family:sans-serif;background:#142318;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px"><div><h2>Sem conexão no momento</h2><p>Verifique sua internet e toque para tentar novamente.</p><button onclick="location.reload()" style="padding:12px 20px;border-radius:10px;border:0;background:#fbbf24;color:#111;font-weight:bold">Recarregar</button></div></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
    )
  );
});
