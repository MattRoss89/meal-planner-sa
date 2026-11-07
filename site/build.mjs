// Inlines shared/core.js into the marketing site (strips ES `export` keywords).
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const core = readFileSync(here + '../shared/core.js', 'utf8').replace(/^export /gm, '');
const tpl = readFileSync(here + 'template.html', 'utf8');
// The swap demo is a prebuilt bundle (see site/demo/build.mjs).
const demoCss = readFileSync(here + 'demo/dist/swap-demo.css', 'utf8');
const demoJs = readFileSync(here + 'demo/dist/swap-demo.js', 'utf8').replace(/<\/script/gi, '<\\/script');
writeFileSync(here + 'index.html', tpl.replace('/*__CORE__*/', () => core).replace('/*__DEMO_CSS__*/', () => demoCss).replace('/*__DEMO_JS__*/', () => demoJs));
console.log('built site/index.html');
