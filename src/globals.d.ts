// Constantes que inyecta esbuild (`define`) en tools/build.mjs.

/** `true` en `npm run build`, `false` en `npm run build:release`. */
declare const __DEV__: boolean;

/** Versión del add-on tomada de package.json, p. ej. "0.1.0". */
declare const __VERSION__: string;

/** El runtime de scripts de Minecraft expone `console` (va al Content Log), pero lib ES2022 no lo declara. */
declare const console: {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};
