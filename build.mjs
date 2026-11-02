// Construit public/index.html à partir de src/index.html : HTML/CSS minifiés, JavaScript obscurci.
// Construit aussi public/sw.js (service worker) pour que le jeu installé marche hors connexion.
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {minify} from 'html-minifier-terser';
import JavaScriptObfuscator from 'javascript-obfuscator';
import {minify as terser} from 'terser';
let html=readFileSync('src/index.html','utf8');
const m=html.match(/<script>([\s\S]*)<\/script>/);
const small=(await terser(m[1],{compress:{passes:2},mangle:true,format:{comments:false}})).code; // 1. optimisé : code compacté, noms raccourcis
const js=JavaScriptObfuscator.obfuscate(small,{ // 2. brouillé : textes et structure difficiles à lire
  compact:true,identifierNamesGenerator:'mangled',renameGlobals:false,
  stringArray:true,stringArrayThreshold:.5,stringArrayEncoding:[],stringArrayRotate:true,stringArrayShuffle:true,stringArrayIndexShift:true,
  controlFlowFlattening:false,deadCodeInjection:false,selfDefending:false,debugProtection:false,unicodeEscapeSequence:false
}).getObfuscatedCode();
html=html.replace(m[0],'<script>__JS__</script>');
// Police Saira servie depuis public/fonts/ au lieu de Google Fonts : disponible hors connexion.
const LATIN='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT='U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const faces=[['Saira','saira',400],['Saira','saira',600],['Saira Extra Condensed','saira-extra-condensed',600],['Saira Extra Condensed','saira-extra-condensed',800]]
  .flatMap(([fam,slug,w])=>[['latin',LATIN],['latin-ext',LATIN_EXT]].map(([sub,range])=>
    `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(/fonts/${slug}-${sub}-${w}-normal.woff2) format('woff2');unicode-range:${range}}`)).join('');
const gf=/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*">/;
if(!gf.test(html)) throw new Error('Lien Google Fonts introuvable dans src/index.html : mettre à jour build.mjs');
html=html.replace(gf,`<style>${faces}</style>`);
html=html.replace('<title>Touch FC</title>',`<title>Touch FC</title>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="icon" type="image/png" href="/icon-512.png">
<link rel="manifest" href="/manifest.webmanifest"><meta name="apple-mobile-web-app-title" content="Touch FC">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="theme-color" content="#0f2016">`);
html=await minify(html,{collapseWhitespace:true,removeComments:true,minifyCSS:true,minifyJS:false,removeRedundantAttributes:true});
html=html.replace('<script>__JS__</script>',()=>`<script>${js}</script>`);
const reg=`<script>if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))</script>`;
html=html.includes('</body>')?html.replace('</body>',reg+'</body>'):html+reg;
writeFileSync('public/index.html',html);
console.log('src',readFileSync('src/index.html').length,'→ public',Buffer.byteLength(html));

// Service worker : la version change dès qu'un fichier mis en cache change, ce qui déclenche la mise à jour sur l'iPhone.
const fonts=readdirSync('public/fonts').filter(f=>f.endsWith('.woff2')).sort().map(f=>'/fonts/'+f);
const assets=['/','/manifest.webmanifest','/apple-touch-icon.png','/icon-192.png','/icon-512.png',...fonts];
const hash=createHash('sha256');
for(const a of assets) hash.update(a==='/'?html:readFileSync('public'+a));
const version=hash.digest('hex').slice(0,12);
writeFileSync('public/sw.js',`// Généré par build.mjs : ne pas modifier à la main.
const CACHE='touch-fc-${version}';
const ASSETS=${JSON.stringify(assets)};
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
`);
console.log('sw.js',version,assets.length,'fichiers en cache');
