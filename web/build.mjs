// Inlines shared/core.js into the web page (strips ES `export` keywords).
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const core = readFileSync(here + '../shared/core.js', 'utf8').replace(/^export /gm, '');
const tpl = readFileSync(here + 'template.html', 'utf8');
writeFileSync(here + 'index.html', tpl.replace('/*__CORE__*/', () => core));
console.log('built web/index.html');
