import { type ExecutorContext, logger } from '@nx/devkit';
import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as rollup from 'rollup';
import { getProjectDir } from '../../shared/getProjectDir';
import { readPackageJson } from '../../shared/readPackageJson';
import { createRollupOptions } from './config';

export interface RollupExecutorOptions {
  readonly clean: boolean;
  readonly buildType: 'release' | 'debug';
  readonly preserveModules?: boolean;
  readonly transformModernSyntax?: boolean;
  /** Relative path to the package.json file. */
  readonly packageJsonPath?: string;
}

export default rollupExecutor;
export async function rollupExecutor(
  options: RollupExecutorOptions,
  context: ExecutorContext
) {
  const projectDir = getProjectDir(context);
  assert.ok(projectDir, 'Missing projectName');

  const outDir = path.join(projectDir, 'dist');

  if (options.clean) {
    logger.verbose(`Cleaning dist directory.`);
    await fs.rm(outDir, { recursive: true, force: true });
  }

  logger.info(
    `Building ${options.buildType} bundle${
      options.preserveModules ? ' with modules' : ''
    }${options.packageJsonPath ? ` from ${options.packageJsonPath}` : ''}...`
  );

  const startAt = performance.now();
  try {
    await buildPackage(context.root, projectDir, options);
  } catch (error) {
    logger.error(error);
    return { success: false };
  }
  const endAt = performance.now();
  logger.verbose(`⚡ Done in ${durationInSeconds(startAt, endAt)}`);

  return { success: true };
}

async function buildPackage(
  workspaceDir: string,
  packageDir: string,
  options: RollupExecutorOptions
) {
  const packageJsonFile = path.join(
    packageDir,
    options.packageJsonPath ?? 'package.json'
  );
  const packageJson = await readPackageJson(packageJsonFile);
  const configs = createRollupOptions(
    workspaceDir,
    packageDir,
    packageJson,
    options
  );
  assert.ok(configs.length > 0, 'Expected at least one config');

  let hasWarnings = false;
  for (const { output: outputs, ...config } of configs) {
    logger.verbose(
      `Building ${path.relative(packageDir, String(config.input))} -> dist/...`
    );
    const bundle = await rollup.rollup({
      ...config,
      // eslint-disable-next-line no-loop-func
      onwarn: (warning, handle) => {
        if (warning.code === 'EMPTY_BUNDLE') return; // ignore empty bundle warning
        handle(warning);
        if (options.buildType === 'release') {
          hasWarnings = true;
        }
      },
    });
    assert.ok(Array.isArray(outputs), 'Expected output to be an array');
    for (const output of outputs) {
      const result = await bundle.write(output);
      result.output.forEach((output) => {
        logger.verbose(`  -> ${output.fileName}`);
      });
    }
  }

  if (options.buildType === 'release' && hasWarnings) {
    throw new Error('Build completed with warnings.');
  }
}

function durationInSeconds(
  startMilliSeconds: number,
  endMilliSeconds: number
): string {
  return ((endMilliSeconds - startMilliSeconds) / 1000).toFixed(2) + 's';
}
