import { describe, expect, test, vi } from 'vitest';
import { readPackageJson } from './readPackageJson';
import { readFile } from 'node:fs/promises';

vi.mock('node:fs/promises', async (original) => {
  const fs = await original<object>();
  const overrides = {
    readFile: vi.fn(async () => {
      return JSON.stringify({
        name: 'foo',
      });
    }),
  };
  return {
    ...fs,
    ...overrides,
    default: { ...fs, ...overrides },
  };
});

describe(readPackageJson, () => {
  test('should read package.json', async () => {
    const packageJson = await readPackageJson('package.json');
    expect(packageJson.name).toEqual('foo');
    expect(readFile).toHaveBeenCalledWith('package.json', 'utf-8');
  });

  test('should throw if not package.json', async () => {
    await expect(readPackageJson('foo.json')).rejects.toThrow(
      'Expected package.json file'
    );
  });
});
