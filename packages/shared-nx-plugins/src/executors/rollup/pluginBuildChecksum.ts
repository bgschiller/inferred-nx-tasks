import type { Plugin } from 'rollup';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

/**
 * Computes the checksum of the build and writes it to a file
 * with the same name as the entry point but with a `.checksum.txt` extension.
 *
 * @param input The entry point of the build.
 */
export function pluginBuildChecksum(input: string): Plugin {
  return {
    name: 'build-checksum',

    async generateBundle(options, bundle) {
      if (options.format !== 'es') return; // Only compute checksum for ES modules.
      const checksum = Object.values(bundle)
        .reduce((hash, asset) => {
          switch (asset.type) {
            case 'asset':
              return hash.update(asset.source);
            case 'chunk':
              return hash.update(asset.code);
            default:
              throw new Error(
                `Unsupported asset type: ${Reflect.get(asset, 'type')}`
              );
          }
        }, crypto.createHash('sha256'))
        .digest('hex');

      const fileName = path.basename(input, '.ts') + '.checksum.txt';

      this.emitFile({
        type: 'asset',
        name: fileName,
        fileName: fileName,
        source: checksum + '\n',
        needsCodeReference: false,
      });
    },
  };
}
