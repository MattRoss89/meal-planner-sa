// Bundles the swap demo (React + the Stageshow kit) into site/demo/dist/,
// which site/build.mjs inlines into the marketing page. The bundle is
// committed, so the site builds without React installed; rebuild it here when
// the demo changes:  node site/demo/build.mjs  (needs esbuild, react, react-dom).
// Set NODE_PATH to where those packages live if they aren't in node_modules.
import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'node:fs';

const here = new URL('.', import.meta.url).pathname;
mkdirSync(here + 'dist', { recursive: true });

// The kit's Icon imports lucide-react; this demo uses none of those glyphs.
const lucideShim = {
  name: 'lucide-shim',
  setup(b) {
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: 'lucide', namespace: 'shim' }));
    b.onLoad({ filter: /.*/, namespace: 'shim' }, () => ({
      contents: `const none = () => null; export default new Proxy({}, { get: () => none });
        ${['Archive', 'ArrowRight', 'ArrowUpRight', 'Bell', 'Calendar', 'Check', 'ChevronDown', 'ChevronRight', 'Clock', 'CreditCard', 'Ellipsis', 'File', 'Globe', 'GripVertical', 'Heart', 'House', 'Lock', 'Mail', 'Pause', 'Play', 'Plus', 'ScanFace', 'Search', 'Send', 'Settings', 'Star', 'Trash2', 'User', 'Wifi', 'X', 'Zap'].map((n) => `export const ${n} = none;`).join('\n')}`,
      loader: 'js',
    }));
  },
};

await build({
  entryPoints: [here + 'entry.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  outdir: here + 'dist',
  entryNames: 'swap-demo',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.url': 'document.baseURI' },
  plugins: [lucideShim],
  logLevel: 'warning',
  nodePaths: (process.env.NODE_PATH || '').split(':').filter(Boolean),
});
writeFileSync(here + 'dist/.keep', '');
console.log('built site/demo/dist/swap-demo.{js,css}');
