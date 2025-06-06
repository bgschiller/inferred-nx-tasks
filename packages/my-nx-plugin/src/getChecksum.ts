import * as fs from 'node:fs'
import { hashArray } from 'nx/src/hasher/file-hasher'
import { glob } from 'fast-glob'

let checksum: string | null = null

/**
 * Calculate the checksum of the plugin source files so
 * that we can invalidate the cache when the source files change.
 */
export function getChecksum() {
  if (checksum !== null) return checksum

  const files = glob.sync(['**/*.ts', 'src/**/*.json'], {
    cwd: __dirname,
    absolute: true,
    ignore: ['**/*.d.ts', '**/*.spec.ts'],
  })

  files.sort()

  checksum = hashArray(files.map(file => fs.readFileSync(file, 'utf-8')))
  return checksum
}
