export function dedupe<T>(
  computeHash: (value: T) => unknown = (value) => value
): (value: T) => boolean {
  const seen = new Set();
  return (value) => {
    const hash = computeHash(value);
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  };
}
