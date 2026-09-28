// Copies the stylesheet into `dist/`. TypeScript compiles the JavaScript and
// type declarations; the CSS needs a manual copy.
import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'src/styles.css'), resolve(root, 'dist/styles.css'));

console.log('dashtro: copied stylesheet into dist/');
