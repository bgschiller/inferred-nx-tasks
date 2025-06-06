/* eslint-disable @typescript-eslint/no-empty-function */
import type {
  CreateNodesResult,
  CreateNodesV2,
  TargetConfiguration,
} from '@nx/devkit';
import { fileExists, readJsonFile } from 'nx/src/utils/fileutils';
import * as path from 'node:path';
import type { PackageJson } from './package-json';
import { getChecksum } from './getChecksum';
import type { RollupExecutorOptions } from './executors/rollup/executor';

export const name = 'my-nx-plugin';

export const createNodesV2: CreateNodesV2 = [
  // declare that any package with a package.json file is one we
  // want to analyze and possibly add tasks for
  '**/package.json',
  (projectConfigurationFiles, _options, context) => {
    return projectConfigurationFiles.flatMap((file) => {
      console.log('file', file);
      const directoryContainingPackageJson = path.dirname(file);
      const parent = path.relative(
        context.workspaceRoot,
        path.dirname(directoryContainingPackageJson)
      );

      const packageJson = readJsonFile<PackageJson>(file);
      const projectJsonPath = path.join(
        directoryContainingPackageJson,
        'project.json'
      );
      if (fileExists(projectJsonPath)) {
        const projectJson = readJsonFile<PackageJson['nx']>(projectJsonPath);
        packageJson.nx = { ...packageJson.nx, ...projectJson };
      }

      const targets = getTargetsByTags(file, packageJson);
      if (Object.keys(targets).length === 0) return [];
      const result = {
        projects: {
          [path.dirname(file)]: {
            name: file,
            targets,
          },
        },
      } satisfies CreateNodesResult;

      return [[file, result]];
    });
  },
];

const knownTags = ['rollup', 'vitest', 'eslint', 'release'] as const;
type KnownTag = (typeof knownTags)[number];
function isKnownTag(tag: string): tag is KnownTag {
  return knownTags.includes(tag as KnownTag);
}

/**
 * Inspect the nx tags in the package.json and create a map from target name to
 * target configuration.
 *
 * To begin with, we'll address the rollup tag
 */
function getTargetsByTags(_file: string, packageJson: PackageJson) {
  const tags = (packageJson.nx?.tags ?? []).filter(isKnownTag) as KnownTag[];
  if (tags.length === 0) return {};
  const targets: Record<string, TargetConfiguration> = {};
  for (const tag of tags) {
    if (tag === 'rollup') {
      targets.build = createRollupTarget({
        projectName: packageJson.name,
        packageJson,
        tags,
      });
    } else if (tag === 'vitest') {
      targets.test = createVitestTarget(packageJson);
    } else if (tag === 'eslint') {
      // I'd prefer to _default_ to adding a lint target, and require the presence of a tag to opt out.
      // This helps us transition while most projects still have project.json files with explicit lint targets.
      targets.lint = createEslintTarget();
    } else if (tag === 'release') {
      // This part seems silly to me. What is a target with no executor, just a no-op?
      // In the future, we should rely on the tag itself. This will let us use a tag but avoid
      // changing every project.
      targets['nx-release-publish'] = createReleasePublishTarget();
    } else {
      assertUnreachable(tag);
    }
  }

  // Nx doesn't seem to notice when *this* code, the my-nx-plugin, changes.
  // We add a runtime input calculated from a checksum of the source code to force
  // Nx to re-run the target when the my-nx-plugin changes.
  const checksum = getChecksum();
  Object.values(targets).forEach((target) => {
    target.inputs = [
      ...new Set(target.inputs),
      { runtime: `node -e "console.log('${checksum}')"` },
    ];
  });
  return targets;
}

interface CreateTargetOptions {
  readonly projectName: string;
  readonly packageJson: PackageJson;
  readonly tags: readonly string[];
}

function createEslintTarget(): TargetConfiguration {
  return {
    executor: '@nx/eslint:lint',
  };
}

function createReleasePublishTarget(): TargetConfiguration {
  return {
    options: {
      packageRoot: '{projectRoot}/dist',
    },
  };
}

function createRollupTarget(options: CreateTargetOptions): TargetConfiguration {
  const srcDir = path.posix.join('{projectRoot}', 'src');
  const outDir = path.posix.join('{projectRoot}', 'dist');
  const reportsDir = path.posix.join('{projectRoot}', 'reports');
  const isPublicPackage = !options.packageJson.private;

  return {
    executor: 'my-nx-plugin:rollup',
    options: {
      clean: true,
      buildType: 'release',
      preserveModules: !isPublicPackage,
      transformModernSyntax: isPublicPackage,
    },
    configurations: {
      development: {
        buildType: 'debug',
      },
      production: {
        buildType: 'release',
      },
    } satisfies Record<string, Partial<RollupExecutorOptions>>,
    defaultConfiguration: 'development',
    dependsOn: ['^build'],
    inputs: [
      { dependentTasksOutputFiles: '**/*.checksum.txt', transitive: true },
      `${srcDir}/**/*`,
      `!${srcDir}/**/*.spec.{ts,tsx}`,
      '{projectRoot}/tsconfig.json',
    ],
    outputs: [outDir, reportsDir],
    cache: true,
    metadata: {
      description: 'Builds the project with Rollup',
      technologies: ['rollup'],
    },
  };
}

function createVitestTarget(packageJson: PackageJson): TargetConfiguration {
  return {
    executor: '@nx/vite:test',
    dependsOn: ['^build'],
    defaultConfiguration: 'development',
    configurations: {
      watch: {
        watch: false,
      },
      development: {},
      production: {},
    },
    inputs: [
      { dependentTasksOutputFiles: '**/*.checksum.txt', transitive: true },
      '{workspaceRoot}/vitest.config.mts',
      '{projectRoot}/package.json',
      '{projectRoot}/src/**/*.{ts,tsx}',
      '{projectRoot}/test/**/*.{ts,tsx}',
    ],
    outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
    cache: true,
    options: {
      reportsDirectory: '../../coverage/{projectRoot}',
      configFile: '{workspaceRoot}/vitest.config.mts',
    },
  };
}

function assertUnreachable(tag: never): never {
  throw new Error(`Unreachable tag: ${tag}`);
}
