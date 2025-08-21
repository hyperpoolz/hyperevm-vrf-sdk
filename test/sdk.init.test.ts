import { describe, it, expect } from 'vitest';
import { HyperevmVrf } from '../src/sdk.js';

describe('HyperevmVrf.init()', () => {
  it('throws if vrfAddress missing', async () => {
    // @ts-expect-error testing runtime behavior when address missing
    await expect(HyperevmVrf.init({})).rejects.toThrow('vrfAddress is required');
  });

  it('creates instance with minimal config', async () => {
    const inst = await HyperevmVrf.init({ vrfAddress: '0x0000000000000000000000000000000000000000' });
    expect(inst).toBeInstanceOf(HyperevmVrf);
  });
});


