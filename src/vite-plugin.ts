import { relative } from 'node:path';

import type { Plugin, ViteDevServer } from 'vite';

import { parseSqlSource } from './runtime/params.js';
import type { DashtroResolvedConfig } from './runtime/types.js';

export const VIRTUAL_CONFIG_ID = 'virtual:dashtro/config';
export const RESOLVED_VIRTUAL_CONFIG_ID = `\0${VIRTUAL_CONFIG_ID}`;
export const VIRTUAL_QUERIES_ID = 'virtual:dashtro/queries';
export const RESOLVED_VIRTUAL_QUERIES_ID = `\0${VIRTUAL_QUERIES_ID}`;

export interface DashtroVitePluginOptions {
  config: DashtroResolvedConfig;
  /** Root-relative glob (for example `/src/queries/**\/*.sql`) used by the API endpoint. */
  queriesGlob: string | null;
}

/**
 * Vite plugin that:
 * - turns `.sql` imports into runnable dashtro queries,
 * - exposes the resolved configuration through `virtual:dashtro/config`,
 * - exposes a lazy loader for every query through `virtual:dashtro/queries`.
 */
export function dashtroVitePlugin(options: DashtroVitePluginOptions): Plugin {
  const { config, queriesGlob } = options;

  return {
    name: 'dashtro',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_CONFIG_ID) {
        return RESOLVED_VIRTUAL_CONFIG_ID;
      }
      if (id === VIRTUAL_QUERIES_ID) {
        return RESOLVED_VIRTUAL_QUERIES_ID;
      }
      return null;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_CONFIG_ID) {
        return `export default ${JSON.stringify(config)};\n`;
      }

      if (id === RESOLVED_VIRTUAL_QUERIES_ID) {
        if (!queriesGlob) {
          return 'export async function loadAllQueries() {}\n';
        }
        return [
          'const modules = import.meta.glob(' + JSON.stringify(queriesGlob) + ');',
          'export async function loadAllQueries() {',
          '  await Promise.all(Object.values(modules).map((load) => load()));',
          '}',
          '',
        ].join('\n');
      }

      return null;
    },

    transform(code, id) {
      const file = cleanModuleId(id);
      if (!file.endsWith('.sql') || file.includes('/node_modules/')) {
        return null;
      }

      const source = code.replace(/^\uFEFF/, '');
      const parsed = parseSqlSource(source);
      const queryId = toPosix(relative(config.rootDir, file));
      const definition = JSON.stringify({
        id: queryId,
        path: queryId,
        sql: parsed.sql,
        params: parsed.params,
      });

      return {
        code: [
          "import { createQuery } from 'dashtro/runtime';",
          `const query = createQuery(${definition});`,
          'export default query;',
          'export { query };',
          '',
        ].join('\n'),
        map: null,
      };
    },

    configureServer(server: ViteDevServer) {
      server.watcher.on('change', (file) => {
        if (file.endsWith('.sql')) {
          // The query registry and the generated query modules are cached at
          // module scope, so a full reload is the simplest correct response.
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

function cleanModuleId(id: string): string {
  const queryIndex = id.indexOf('?');
  return queryIndex === -1 ? id : id.slice(0, queryIndex);
}

function toPosix(value: string): string {
  return value.split('\\').join('/');
}
