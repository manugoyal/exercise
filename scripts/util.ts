export function mapAt<K, V>(m: Map<K, V>, k: K): V {
  const res = m.get(k);
  if (res === undefined) {
    throw new Error(`Missing key: ${JSON.stringify(k)}`);
  }
  return res;
}
