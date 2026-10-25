// Construit public/index.html à partir de src/index.html : HTML/CSS minifiés, JavaScript obscurci.
import {readFileSync,writeFileSync} from 'node:fs';
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
html=html.replace('<title>Touch FC</title>',`<title>Touch FC</title>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="icon" type="image/png" href="/icon-512.png">
<link rel="manifest" href="/manifest.webmanifest"><meta name="apple-mobile-web-app-title" content="Touch FC">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="theme-color" content="#0f2016">`);
html=await minify(html,{collapseWhitespace:true,removeComments:true,minifyCSS:true,minifyJS:false,removeRedundantAttributes:true});
html=html.replace('<script>__JS__</script>',()=>`<script>${js}</script>`);
writeFileSync('public/index.html',html);
console.log('src',readFileSync('src/index.html').length,'→ public',Buffer.byteLength(html));
