// @ts-check
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Node 20 supports ES2022 syntax but esbuild defaults to ES2015.
  esbuild: { target: 'es2022' },
  plugins: [
    // This plugin is useful for debugging issues with the test runner not
    // transforming ESNext syntax or other issues.
    {
      name: 'verbose',
      transform(_, _id) {
        // Uncomment to see which files are being transformed in vitest.
        // console.log(`File: ${_id}`)
      },
    },
  ],
  test: {
    include: ['**/*.spec.ts', '**/*.spec.tsx'],
    exclude: ['**/node_modules/**', '.nx/**', 'coverage/**', 'dist/**'],
    typecheck: { enabled: false },
  },
});
