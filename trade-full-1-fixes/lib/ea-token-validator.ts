// lib/ea-token-validator.ts
// Timing-safe bearer token comparison for the MT5 EA sync endpoint.
// Prevents timing-oracle attacks where an attacker could infer token
// length/prefix by measuring response time differences.

import { timingSafeEqual } from "crypto";

/**
 * Compare two token strings in constant time.
 * Both strings are padded/truncated to 128 bytes so comparison time
 * is always the same regardless of where they differ.
 */
export function validateEaToken(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;

  const PAD_LENGTH = 128;

  try {
    const a = Buffer.alloc(PAD_LENGTH);
    const b = Buffer.alloc(PAD_LENGTH);
    a.write(provided.slice(0, PAD_LENGTH), "utf8");
    b.write(expected.slice(0, PAD_LENGTH), "utf8");

    // timingSafeEqual checks byte equality in constant time
    const bytesMatch = timingSafeEqual(a, b);

    // Also verify exact string equality (catches length differences not
    // caught by the padded buffer comparison)
    return bytesMatch && provided === expected;
  } catch {
    return false;
  }
}
