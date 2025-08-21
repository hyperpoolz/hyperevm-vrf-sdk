import { describe, it, expect } from 'vitest';

// One-shot fulfill(requestId): read request → compute round → fetch sig → call fulfill

describe.skip('HyperevmVrf.fulfill()', () => {
  it('returns FulfillResult with requestId, round, signature, txHash', async () => {
    // TODO: Implement when fulfill() is implemented
    expect(true).toBe(true);
  });

  it('throws PolicyViolationError when round violates mode', async () => {
    // TODO
    expect(true).toBe(true);
  });

  it('throws AlreadyFulfilledError if already satisfied', async () => {
    // TODO
    expect(true).toBe(true);
  });

  it('wraps tx failures as TxError', async () => {
    // TODO
    expect(true).toBe(true);
  });
});


