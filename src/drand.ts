import { DEFAULT_DRAND } from './config.js';
import { WrongBeaconError } from './errors.js';
import type { DrandBeaconInfo } from './types.js';

export interface DrandConfig {
    /** Base URL for drand v2 API, e.g. https://api.drand.sh/v2 */
    baseUrl?: string;
    /** Timeout for HTTP calls in milliseconds. */
    fetchTimeoutMs?: number;
}

export class DrandClient {
    private readonly baseUrl: string;
    private readonly fetchTimeoutMs: number;

    constructor(config?: DrandConfig) {
        this.baseUrl = config?.baseUrl ?? DEFAULT_DRAND.baseUrl;
        this.fetchTimeoutMs = config?.fetchTimeoutMs ?? DEFAULT_DRAND.fetchTimeoutMs;
    }

    /**
     * Fetch evmnet BN254 beacon info: { genesisTime, period }.
     * Implements a minimal retry (up to 2 attempts) and timeout.
     * Validates that the beacon corresponds to evmnet/BN254, otherwise throws WrongBeaconError.
     */
    public async getInfo(): Promise<DrandBeaconInfo> {
        const url = `${this.baseUrl}/beacons/evmnet/info`;
        const attempt = async (): Promise<DrandBeaconInfo> => {
            const AC: any = (globalThis as any).AbortController;
            const controller = new AC();
            const setTimeoutAny: any = (globalThis as any).setTimeout;
            const clearTimeoutAny: any = (globalThis as any).clearTimeout;
            const id = setTimeoutAny(() => controller.abort(), this.fetchTimeoutMs);
            try {
                const fetchAny: any = (globalThis as any).fetch;
                const res = await fetchAny(url, { signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`drand info http ${res.status}`);
                }
                const data = await res.json();
                // Example expected fields from drand v2:
                // { chain_info: { ... }, period: number, genesis_time: number, scheme: 'bls-bn254' | 'bls-381', network: 'evm' | ..., ... }
                const genesisTime: unknown = (data?.genesis_time ?? data?.genesisTime);
                const period: unknown = data?.period;
                const scheme: unknown = (data?.scheme ?? data?.curve ?? data?.signature_scheme);
                const network: unknown = (data?.network ?? data?.group ?? data?.beacon_name);

                if (typeof genesisTime !== 'number' || typeof period !== 'number') {
                    throw new Error('invalid info payload');
                }

                // Enforce evmnet + BN254. The drand API commonly uses scheme "bls-bn254" for evmnet.
                const isBn254 = typeof scheme === 'string' && scheme.toLowerCase().includes('bn254');
                const isEvmnet = typeof network === 'string' ? network.toLowerCase().includes('evm') : true; // be lenient if missing
                if (!isBn254 || !isEvmnet) {
                    throw new WrongBeaconError('Expected evmnet/BN254 beacon');
                }

                return { genesisTime, period };
            } finally {
                clearTimeoutAny(id);
            }
        };

        // Minimal retry: 2 attempts
        try {
            return await attempt();
        } catch (_e) {
            return await attempt();
        }
    }
}


