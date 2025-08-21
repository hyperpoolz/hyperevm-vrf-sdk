/** Template-literal type for hex strings (0x-prefixed). */
export type Hex = `0x${string}`;

/** Public config for initializing the SDK. All fields are optional where sensible; defaults applied in init(). */
export interface HyperevmVrfConfig {
  /** HyperEVM RPC URL. Default: https://rpc.hyperliquid.xyz/evm */
  rpcUrl?: string;
  /** Address of the DrandVRF_Split contract (required). */
  vrfAddress: Hex;
  /** HyperEVM chain id. Default: 999 */
  chainId?: number;
  /** Account to use for txs: either provide a PK or ask the SDK to generate one. */
  account?:
    | { privateKey: Hex }
    | { generate: true };
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
export interface FulfillResult {
  requestId: bigint;
  round: bigint;
  signature: [bigint, bigint];
  txHash: Hex;
}

/** Fully-resolved internal config after defaults are applied. */
export interface ResolvedConfig {
  rpcUrl: string;
  vrfAddress: Hex;
  chainId: number;
  account?: { privateKey: Hex } | { generate: true };
  policy: { mode: 'strict' | 'window'; window: number };
  drand: { baseUrl: string; fetchTimeoutMs: number };
  gas?: { maxFeePerGasGwei?: number; maxPriorityFeePerGasGwei?: number };
}

/** Minimal beacon info needed by the SDK (evmnet/BN254). */
export interface DrandBeaconInfo {
  genesisTime: number;
  period: number;
}