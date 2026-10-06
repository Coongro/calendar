import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * `@coongro/datetime` lo resuelve el host en runtime; en los tests, su `dist` del Core
 * (el mismo camino que usa el tsconfig).
 */
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@coongro\/datetime$/,
        replacement: resolve(__dirname, '../../packages/datetime/dist/index.js'),
      },
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Procesos y no hilos: los tests cambian `process.env.TZ` para simular la zona del
    // navegador, y en un worker thread ese cambio no llega a `Date`.
    pool: 'forks',
  },
});
