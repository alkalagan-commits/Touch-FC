// Généré par build.mjs : ne pas modifier à la main.
const CACHE='touch-fc-3d6fe746dff3';
const ASSETS=["/","/manifest.webmanifest","/apple-touch-icon.png","/icon-192.png","/icon-512.png","/fonts/saira-extra-condensed-latin-600-normal.woff2","/fonts/saira-extra-condensed-latin-800-normal.woff2","/fonts/saira-extra-condensed-latin-ext-600-normal.woff2","/fonts/saira-extra-condensed-latin-ext-800-normal.woff2","/fonts/saira-latin-400-normal.woff2","/fonts/saira-latin-600-normal.woff2","/fonts/saira-latin-ext-400-normal.woff2","/fonts/saira-latin-ext-600-normal.woff2"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('touch-fc-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  if(r.mode==='navigate'){
    // Page du jeu : version en ligne si le réseau répond vite, sinon celle gardée dans le téléphone.
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      const net=fetch(r).then(res=>{if(res.ok)c.put('/',res.clone());return res});
      net.catch(()=>{});
      const timeout=new Promise(ok=>setTimeout(ok,3000));
      const res=await Promise.race([net.catch(()=>null),timeout.then(()=>null)]);
      return res||await c.match('/')||net;
    })());
    return;
  }
  // Polices, icônes : depuis le cache, sinon le réseau.
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r)));
});
