import { describe, it, expect } from 'vitest';

// Contract bindings per SCOPE.md: getRequest(requestId), fulfillRandomness(requestId, round, sig)

describe.skip('contract.getRequest()', () => {
  it('returns on-chain request struct with deadline etc.', async () => {
    // TODO: Implement when bindings are added
    expect(true).toBe(true);
  });
});

describe.skip('contract.fulfillRandomness()', () => {
  it('submits tx and returns hash on success', async () => {
    // TODO: Implement when viem bindings exist
    expect(true).toBe(true);
  });
});


