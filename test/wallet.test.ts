import { describe, it, expect } from 'vitest';
import { Wallet } from '../src/wallet.js';

describe('Wallet', () => {
  it('returns an address string', () => {
    const w = new Wallet({ privateKey: '0x1234' });
    const addr = w.getAddress();
    expect(typeof addr).toBe('string');
    expect(addr.startsWith('0x')).toBe(true);
  });

  it.skip('generates a new EOA when requested', () => {
    // TODO: Implement generation test when feature exists
    expect(true).toBe(true);
  });
});


