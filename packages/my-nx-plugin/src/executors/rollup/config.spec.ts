import { describe, expect, test, vi } from 'vitest';
import { createRollupOptions } from './config';
import * as path from 'path';

vi.mock('@rollup/plugin-node-resolve', () => ({
  default: vi.fn(() => ({ name: 'node-resolve' })),
}));

vi.mock('@rollup/plugin-typescript', () => ({
  default: vi.fn(() => ({ name: 'typescript' })),
}));

describe(createRollupOptions, () => {
  test('creates rollup options', () => {
    const options = createRollupOptions(
      '/virtual',
      '/virtual/libs/foo',
      {
        dependencies: {
          bar: '1.0.0',
        },
      },
      { clean: false, buildType: 'release' },
      {
        'src/index.ts': [
          { type: 'esm', file: 'dist/index.mjs' },
          { type: 'commonjs', file: 'dist/index.cjs' },
          { type: 'auto' },
        ],
      }
    );

    expect(options[0]).toEqual({
      cache: false,
      input: '/virtual/libs/foo/src/index.ts'.split('/').join(path.sep),
      plugins: [
        expect.objectContaining({ name: 'json' }),
        expect.objectContaining({ name: 'node-resolve' }),
        expect.objectContaining({ name: 'typescript' }),
        expect.objectContaining({ name: 'visualizer' }),
        expect.objectContaining({ name: 'build-checksum' }),
      ],
      external: expect.any(Function),
      treeshake: { preset: 'recommended' },
      strictDeprecations: true,
      output: [
        {
          assetFileNames: '[name]-[hash].[ext]',
          sourcemap: true,
          dir: '/virtual/libs/foo/dist'.split('/').join(path.sep),
          chunkFileNames: expect.any(Function),
          entryFileNames: expect.any(Function),
          exports: 'named',
          format: 'esm',
          generatedCode: {
            preset: 'es2015',
            constBindings: true,
            objectShorthand: true,
          },
        },

        {
          assetFileNames: '[name]-[hash].[ext]',
          sourcemap: true,
          dir: '/virtual/libs/foo/dist'.split('/').join(path.sep),
          chunkFileNames: expect.any(Function),
          entryFileNames: expect.any(Function),
          exports: 'named',
          format: 'commonjs',
          generatedCode: {
            preset: 'es2015',
            constBindings: true,
            objectShorthand: true,
          },
        },
        {
          assetFileNames: '[name]-[hash].[ext]',
          sourcemap: true,
          dir: '/virtual/libs/foo/dist'.split('/').join(path.sep),
          chunkFileNames: expect.any(Function),
          entryFileNames: expect.any(Function),
          exports: 'named',
          format: 'commonjs',
          generatedCode: {
            preset: 'es2015',
            constBindings: true,
            objectShorthand: true,
          },
        },
      ],
    });
  });

  test('resolves auto format using type field', () => {
    const options = createRollupOptions(
      '/virtual',
      '/virtual/libs/foo',
      {
        type: 'module',
        dependencies: {
          bar: '1.0.0',
        },
      },
      { clean: false, buildType: 'release' },
      {
        'src/index.ts': [{ type: 'auto' }],
      }
    );

    expect((options.at(0)?.output as unknown[]).at(0)).toEqual(
      expect.objectContaining({
        format: 'esm',
        entryFileNames: expect.any(Function),
      })
    );
  });

  test('preserveModules', () => {
    const options = createRollupOptions(
      '/virtual',
      '/virtual/libs/foo',
      {
        dependencies: {
          bar: '1.0.0',
        },
      },
      {
        clean: false,
        preserveModules: true,
        buildType: 'release',
      },
      {
        'src/index.ts': [{ type: 'auto' }],
      }
    );

    expect((options.at(0)?.output as unknown[]).at(0)).toEqual(
      expect.objectContaining({
        preserveModules: true,
        preserveModulesRoot: '/virtual/libs/foo/src'.split('/').join(path.sep),
      })
    );
  });
});
