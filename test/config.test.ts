import { describe, it, expect } from 'vitest';
import { resolveConfig, DEFAULT_RPC_URL, DEFAULT_CHAIN_ID, DEFAULT_DRAND, DEFAULT_POLICY } from '../src/config.js';

describe('resolveConfig()', () => {
  it('applies defaults for rpcUrl, chainId, policy.window, drand config', () => {
    const cfg = resolveConfig({ vrfAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' });
    expect(cfg.rpcUrl).toBe(DEFAULT_RPC_URL);
    expect(cfg.chainId).toBe(DEFAULT_CHAIN_ID);
    expect(cfg.vrfAddress).toBe('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    expect(cfg.policy).toEqual({ mode: DEFAULT_POLICY.mode, window: DEFAULT_POLICY.window });
    expect(cfg.drand).toEqual({ baseUrl: DEFAULT_DRAND.baseUrl, fetchTimeoutMs: DEFAULT_DRAND.fetchTimeoutMs });
  });

  it('supports strict policy (window forced to 0)', () => {
    const cfg = resolveConfig({
      vrfAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      policy: { mode: 'strict' },
    });
    expect(cfg.policy.mode).toBe('strict');
    expect(cfg.policy.window).toBe(0);
  });

  it('supports window policy with custom K', () => {
    const cfg = resolveConfig({
      vrfAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      policy: { mode: 'window', window: 3 },
    });
    expect(cfg.policy).toEqual({ mode: 'window', window: 3 });
  });

  it('passes through gas config if provided', () => {
    const cfg = resolveConfig({
      vrfAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      gas: { maxFeePerGasGwei: 7, maxPriorityFeePerGasGwei: 1 },
    });
    expect(cfg.gas).toEqual({ maxFeePerGasGwei: 7, maxPriorityFeePerGasGwei: 1 });
  });
});


