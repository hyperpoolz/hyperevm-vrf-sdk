import type { HyperevmVrfConfig, ResolvedConfig } from './types.js';

export const DEFAULT_RPC_URL = 'https://rpc.hyperliquid.xyz/evm';
export const DEFAULT_CHAIN_ID = 999;
export const DEFAULT_POLICY = { mode: 'window' as const, window: 1 };
export const DEFAULT_DRAND = {
    baseUrl: 'https://api.drand.sh/v2',
    fetchTimeoutMs: 8_000,
};

export function resolveConfig(cfg: HyperevmVrfConfig): ResolvedConfig {
    return {
        rpcUrl: cfg.rpcUrl ?? DEFAULT_RPC_URL,
        vrfAddress: cfg.vrfAddress,
        chainId: cfg.chainId ?? DEFAULT_CHAIN_ID,
        account: cfg.account,
        policy: {
            mode: cfg.policy?.mode ?? DEFAULT_POLICY.mode,
            window:
                (cfg.policy?.mode === 'window'
                    ? cfg.policy?.window ?? DEFAULT_POLICY.window
                    : 0) || (cfg.policy?.mode === 'strict' ? 0 : DEFAULT_POLICY.window),
        },
        drand: {
            baseUrl: cfg.drand?.baseUrl ?? DEFAULT_DRAND.baseUrl,
            fetchTimeoutMs: cfg.drand?.fetchTimeoutMs ?? DEFAULT_DRAND.fetchTimeoutMs,
        },
        gas: cfg.gas,
    };
}


