// -----------------------------------------------------------------------------
// Access PINs for the public "Progress Individu" self-service route (/progress).
// An employee opens their own progress WITHOUT a normal login by entering their
// NPK + a 6-digit PIN. Admin provisions the PINs from the dashboard.
//
// PINs live in localStorage `nexus-progress-pins` (client-side, like the rest of
// the PII data). The public page reads the same store on the same deployment.
// -----------------------------------------------------------------------------

// NOTE: consumed via useLocalState(PIN_KEY), which prefixes "nexus-" →
// the real localStorage key is "nexus-progress-pins".
export const PIN_KEY = "progress-pins";
export type PinMap = Record<string, string>; // npk → 6-digit PIN

// Deterministic-but-opaque 6-digit code from the NPK, used only to seed a first
// PIN when generating in bulk. Admin can reset any individual PIN afterward.
export function genPin(npk: string, salt = 0): string {
  let h = 2166136261 ^ salt;
  const s = `${npk}#${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = Math.abs(h) % 1000000;
  return String(n).padStart(6, "0");
}

export const hasPin = (map: PinMap, npk: string): boolean => !!map[String(npk).trim()];
export const getPin = (map: PinMap, npk: string): string | undefined => map[String(npk).trim()];

export function verifyPin(map: PinMap, npk: string, pin: string): boolean {
  const p = map[String(npk).trim()];
  return !!p && p === String(pin).trim();
}

// Fill PINs for every NPK that doesn't have one yet (keeps existing PINs stable).
export function provisionAll(map: PinMap, npks: string[]): PinMap {
  const next = { ...map };
  for (const raw of npks) {
    const npk = String(raw).trim();
    if (!npk) continue;
    if (!next[npk]) {
      let pin = genPin(npk);
      let salt = 1;
      // avoid collisions so a PIN maps to one NPK where practical
      const taken = new Set(Object.values(next));
      while (taken.has(pin) && salt < 20) pin = genPin(npk, salt++);
      next[npk] = pin;
    }
  }
  return next;
}
