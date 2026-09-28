// Bundles the React chart layer (including Recharts, EvilCharts and motion)
// into a single file. Only React and React DOM stay external, so the consuming app
// always uses one copy of React. Without this, a locally linked dashtro loads
// React from its own `node_modules` through Recharts and React reports an
// invalid hook call.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/react/index.ts'],
  outfile: 'dist/react/index.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/*', 'react-dom/*'],
  sourcemap: true,
  logLevel: 'warning',
  banner: {
    js: [
      '// Bundled by scripts/bundle-react.mjs. Do not edit.',
      // Some bundled dependencies (for example `use-sync-external-store` via
      // `react-redux`) are CommonJS and call `require("react")`. esbuild keeps
      // that call as a dynamic require in ESM output, which fails in the
      // browser and in Node ESM. Map it back to the external React import.
      "import * as __dashtroReact from 'react';",
      'const require = (id) => {',
      "  if (id === 'react') return __dashtroReact;",
      "  throw new Error('dashtro: unexpected require of ' + id);",
      '};',
    ].join('\n'),
  },
});

console.log('dashtro: bundled the React chart layer into dist/react/index.js');
