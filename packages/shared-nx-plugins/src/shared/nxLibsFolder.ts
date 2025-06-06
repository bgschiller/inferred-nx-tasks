import { type NxJsonConfiguration, readNxJson, type Tree } from '@nx/devkit';

export function readNxLibsFolder(tree: Tree) {
  return getNxLibFolder({ nxJsonConfiguration: readNxJson(tree) ?? {} });
}

export function getNxLibFolder(context: {
  readonly nxJsonConfiguration?: NxJsonConfiguration;
}) {
  return context.nxJsonConfiguration?.workspaceLayout?.libsDir ?? 'libs';
}
