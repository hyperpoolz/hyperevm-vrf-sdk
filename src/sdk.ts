import type { FulfillResult, Hex, HyperevmVrfConfig, ResolvedConfig } from './types.js';
import { resolveConfig } from './config.js';

export class HyperevmVrf {
    private readonly cfg: ResolvedConfig;

    private constructor(cfg: ResolvedConfig) {
        this.cfg = cfg;
    }

    public static async init(cfg: HyperevmVrfConfig): Promise<HyperevmVrf> {
        if (!cfg?.vrfAddress) {
            throw new Error('vrfAddress is required');
        }
        const resolved = resolveConfig(cfg);
        return new HyperevmVrf(resolved);
    }

    public getAccount(): { address: Hex } {
        throw new Error('getAccount() not implemented yet');
    }

    public async fulfill(_requestId: bigint): Promise<FulfillResult> {
        throw new Error('fulfill() not implemented yet');
    }

    public onRequested?(_handler: (requestId: bigint) => Promise<void>): () => void {
        throw new Error('onRequested() not implemented yet');
    }
}


