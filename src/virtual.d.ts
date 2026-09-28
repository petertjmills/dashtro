declare module 'virtual:dashtro/config' {
  const config: import('./runtime/types.js').DashtroResolvedConfig;
  export default config;
}

declare module 'virtual:dashtro/queries' {
  export function loadAllQueries(): Promise<void>;
}
