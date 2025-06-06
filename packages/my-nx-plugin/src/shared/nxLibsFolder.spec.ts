import { describe, expect, test } from 'vitest';
import { readNxLibsFolder } from './nxLibsFolder';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

describe(readNxLibsFolder, () => {
  test('returns default libs folder', () => {
    expect(readNxLibsFolder(createTreeWithEmptyWorkspace())).toBe('libs');
    expect(
      readNxLibsFolder(
        createTreeWithEmptyWorkspace({
          layout: 'apps-libs',
        })
      )
    ).toBe('libs');

    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    tree.write(
      'nx.json',
      JSON.stringify({ workspaceLayout: { libsDir: 'packages' } })
    );

    expect(readNxLibsFolder(tree)).toBe('packages');
  });
});
