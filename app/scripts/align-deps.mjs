// Pins every dependency to the version the installed Expo SDK was tested with.
// Usage: node scripts/align-deps.mjs <path-to-expo-package-dir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const expoDir = process.argv[2];
const bundled = JSON.parse(readFileSync(join(expoDir, 'bundledNativeModules.json'), 'utf8'));
const expoVersion = JSON.parse(readFileSync(join(expoDir, 'package.json'), 'utf8')).version;
const pkgPath = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const fallback = { firebase: '^11.10.0', '@expo/metro-runtime': '*' };
let changed = 0;
for (const section of ['dependencies', 'devDependencies']) {
  for (const name of Object.keys(pkg[section] || {})) {
    let v = name === 'expo' ? `~${expoVersion}` : bundled[name];
    if (!v && name.startsWith('@expo-google-fonts/')) v = '^0.4.0';
    if (!v) v = fallback[name] || pkg[section][name];
    if (pkg[section][name] !== v) { pkg[section][name] = v; changed++; }
  }
}
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Expo ${expoVersion}: pinned ${changed} packages`);
console.log(pkg.dependencies);
