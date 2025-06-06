import { describe, expect, test } from 'vitest';
import { dedupe } from './dedupe';

describe(dedupe, () => {
  test('should dedupe values', () => {
    expect([1, 2, 3, 1, 2, 3].filter(dedupe())).toEqual([1, 2, 3]);
  });

  test('should dedupe values with a custom hash function', () => {
    expect(
      [{ a: 1 }, { a: 2 }, { a: 1 }, { a: 2 }].filter(
        dedupe((value) => value.a)
      )
    ).toEqual([{ a: 1 }, { a: 2 }]);
  });
});
