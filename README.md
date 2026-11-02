# Touch FC
Jeu de foot de table façon Subbuteo, à jouer au doigt sur iPhone.

- `src/index.html` : le code source lisible.
- `public/` : la version mise en ligne (code compacté et brouillé), icônes et manifeste.
- `node build.mjs` reconstruit `public/index.html` à partir de `src/index.html` (après `npm install`).
- Hors connexion : `public/sw.js` (généré par `build.mjs`) garde le jeu et la police Saira (`public/fonts/`) dans le téléphone une fois l'appli ajoutée à l'écran d'accueil.
