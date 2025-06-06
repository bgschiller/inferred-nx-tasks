import type { ExecutorContext } from '@nx/devkit';
import * as path from 'node:path';
import { getNxLibFolder } from './nxLibsFolder';

export function getProjectDir(
  context: Pick<ExecutorContext, 'projectName' | 'root' | 'nxJsonConfiguration'>
) {
  if (context.projectName === undefined) return null;
  return path.join(
    context.root,
    // this is the convention for my monorepo, but you may need to change it
    path.join(getNxLibFolder(context), path.basename(context.projectName))
  );
}
