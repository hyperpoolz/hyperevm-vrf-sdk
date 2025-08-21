import { describe, it, expect, vi, afterEach } from 'vitest';
import { DrandClient } from '../src/drand.js';
import { WrongBeaconError } from '../src/errors.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  // Restore original fetch between tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = originalFetch as any;
  vi.restoreAllMocks();
});

describe('DrandClient.getInfo()', () => {
  it('returns typed { genesisTime, period }', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ genesis_time: 1_700_000_000, period: 3, scheme: 'bls-bn254', network: 'evmnet' }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock as any;

    const client = new DrandClient({ baseUrl: 'https://mock', fetchTimeoutMs: 1000 });
    const info = await client.getInfo();

    expect(info.genesisTime).toBeTypeOf('number');
    expect(info.period).toBeTypeOf('number');
    expect(info).toEqual({ genesisTime: 1_700_000_000, period: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws WrongBeaconError for non-BN254 or non-evmnet', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ genesis_time: 1_700_000_000, period: 3, scheme: 'bls-381', network: 'mainnet' }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock as any;

    const client = new DrandClient({ baseUrl: 'https://mock', fetchTimeoutMs: 1000 });
    await expect(client.getInfo()).rejects.toBeInstanceOf(WrongBeaconError);
  });

  it('retries once on failure and then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ genesis_time: 10, period: 30, scheme: 'bls-bn254', network: 'evm' }),
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock as any;

    const client = new DrandClient({ baseUrl: 'https://mock', fetchTimeoutMs: 1000 });
    const info = await client.getInfo();

    expect(info).toEqual({ genesisTime: 10, period: 30 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});


