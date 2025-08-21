interface DrandConfig {
    endpointUrl: string;
}
declare class DrandClient {
    private readonly config;
    constructor(config: DrandConfig);
    getRandomness(): Promise<string>;
}

interface VrfPolicy {
    maxRequestsPerBlock: number;
}
declare const defaultPolicy: VrfPolicy;

interface ContractConfig {
    address: string;
}
declare class VrfContract {
    private readonly config;
    constructor(config: ContractConfig);
    requestRandomness(): Promise<string>;
}

interface WalletConfig {
    privateKey?: string;
}
declare class Wallet {
    private readonly config;
    constructor(config?: WalletConfig);
    getAddress(): string;
}

/** Template-literal type for hex strings (0x-prefixed). */
type Hex = `0x${string}`;
/** Public config for initializing the SDK. All fields are optional where sensible; defaults applied in init(). */
interface HyperevmVrfConfig {
    /** HyperEVM RPC URL. Default: https://rpc.hyperliquid.xyz/evm */
    rpcUrl?: string;
    /** Address of the DrandVRF_Split contract (required). */
    vrfAddress: Hex;
    /** HyperEVM chain id. Default: 999 */
    chainId?: number;
    /** Account to use for txs: either provide a PK or ask the SDK to generate one. */
    account?: {
        privateKey: Hex;
    } | {
        generate: true;
    };
    /** Anti-grinding policy. Default: { mode: 'window', window: 1 } */
    policy?: {
        mode: 'strict' | 'window';
        /** If mode==='window', inclusive window size (K). Default: 1 */
        window?: number;
    };
    /** Drand v2 client configuration (evmnet/BN254). */
    drand?: {
        /** Base URL for drand v2 API. Default: https://api.drand.sh/v2 */
        baseUrl?: string;
        /** HTTP timeout (ms). Default: 8000 */
        fetchTimeoutMs?: number;
    };
    /** Optional EIP-1559 caps (gwei). */
    gas?: {
        maxFeePerGasGwei?: number;
        maxPriorityFeePerGasGwei?: number;
    };
}
/** Result returned by fulfill(). */
interface FulfillResult {
    requestId: bigint;
    round: bigint;
    signature: [bigint, bigint];
    txHash: Hex;
}
/** Fully-resolved internal config after defaults are applied. */
interface ResolvedConfig {
    rpcUrl: string;
    vrfAddress: Hex;
    chainId: number;
    account?: {
        privateKey: Hex;
    } | {
        generate: true;
    };
    policy: {
        mode: 'strict' | 'window';
        window: number;
    };
    drand: {
        baseUrl: string;
        fetchTimeoutMs: number;
    };
    gas?: {
        maxFeePerGasGwei?: number;
        maxPriorityFeePerGasGwei?: number;
    };
}

declare const DEFAULT_RPC_URL = "https://rpc.hyperliquid.xyz/evm";
declare const DEFAULT_CHAIN_ID = 999;
declare const DEFAULT_POLICY: {
    mode: "window";
    window: number;
};
declare const DEFAULT_DRAND: {
    baseUrl: string;
    fetchTimeoutMs: number;
};
declare function resolveConfig(cfg: HyperevmVrfConfig): ResolvedConfig;

declare class PolicyViolationError extends Error {
    name: string;
}
declare class RoundMissingError extends Error {
    name: string;
}
declare class WrongBeaconError extends Error {
    name: string;
}
declare class AlreadyFulfilledError extends Error {
    name: string;
}
declare class TxError extends Error {
    name: string;
}

declare class HyperevmVrf {
    private readonly cfg;
    private constructor();
    static init(cfg: HyperevmVrfConfig): Promise<HyperevmVrf>;
    getAccount(): {
        address: Hex;
    };
    fulfill(_requestId: bigint): Promise<FulfillResult>;
    onRequested?(_handler: (requestId: bigint) => Promise<void>): () => void;
}

export { AlreadyFulfilledError, type ContractConfig, DEFAULT_CHAIN_ID, DEFAULT_DRAND, DEFAULT_POLICY, DEFAULT_RPC_URL, DrandClient, type DrandConfig, type FulfillResult, type Hex, HyperevmVrf, type HyperevmVrfConfig, PolicyViolationError, type ResolvedConfig, RoundMissingError, TxError, VrfContract, type VrfPolicy, Wallet, type WalletConfig, WrongBeaconError, defaultPolicy, resolveConfig };
