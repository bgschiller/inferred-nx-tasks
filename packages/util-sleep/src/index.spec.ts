import { describe, expect, test } from 'vitest';
import { sleep } from './index';

describe(sleep, () => {
  test('should sleep for the given number of milliseconds', async () => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(100);
  });
});
