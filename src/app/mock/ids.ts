/**
 * Идентификаторы записей мок-БД. Формат — uuid 8-4-4-4-12. Два источника:
 *  - createDeterministicUuidGenerator(seed) — воспроизводимый поток uuid для
 *    сида (повторный re-seed даёт те же значения);
 *  - newRuntimeId() — crypto.randomUUID() для записей, создаваемых в runtime.
 */

/** Формат идентификаторов мок-БД — uuid 8-4-4-4-12. */
export const MOCK_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** mulberry32 — компактный детерминированный PRNG (одинаковый seed → поток). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/** 32-битное слово в виде ровно восьми hex-символов. */
function hex8(value: number): string {
  return (value >>> 0).toString(16).padStart(8, '0');
}

/** Нибл → hex-цифра варианта RFC 4122 (10xx: 8/9/a/b). */
function variantDigit(nibble: number): string {
  return ((nibble & 0x3) | 0x8).toString(16);
}

/** Сборка uuid 8-4-4-4-12 из четырёх 32-битных слов случайности. */
function uuidFromWords(w1: number, w2: number, w3: number, w4: number): string {
  return [
    hex8(w1),
    hex8(w2).slice(0, 4),
    '4' + hex8(w2).slice(5, 8),
    variantDigit(w3 >>> 28) + hex8(w3).slice(1, 4),
    hex8(w3).slice(4, 8) + hex8(w4),
  ].join('-');
}

/** Детерминированный генератор uuid для сида: один seed — одна последовательность. */
export function createDeterministicUuidGenerator(seed: number): () => string {
  const next = mulberry32(seed);
  return () => uuidFromWords(next(), next(), next(), next());
}

/** Идентификатор runtime-записи: crypto.randomUUID() с резервом через getRandomValues. */
export function newRuntimeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
