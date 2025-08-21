import { describe, it, expect } from 'vitest';

// The policy implementation will compute minRound(deadline, genesis, period)
// and enforce modes strict vs window, plus optional expiry. Tests are scaffolded per SCOPE.md.

describe.skip('policy.minRound()', () => {
  it('computes min round from deadline, genesisTime, period', () => {
    // TODO: implement once policy math exists
    expect(true).toBe(true);
  });
});

describe.skip('policy.strict mode', () => {
  it('accepts only round == minRound', () => {
    // TODO
    expect(true).toBe(true);
  });
});

describe.skip('policy.window mode', () => {
  it('accepts round <= minRound + K', () => {
    // TODO
    expect(true).toBe(true);
  });
});

describe.skip('policy.expiry', () => {
  it('rejects if past deadlineMax (if configured)', () => {
    // TODO
    expect(true).toBe(true);
  });
});


