export type ChainConfig = {
  name: string;
  chainId: number;
  rpcUrl: string;
  drandBeacon: string; // e.g., 'evmnet'
  vrfAddress?: string; // optional; users should override in production
};

/**
 * Minimal chain registry. Extend as needed.
 */
export const CHAINS: Record<number, ChainConfig> = {
  999: {
    name: "HyperEVM",
    chainId: 999,
    rpcUrl: "https://rpc.hyperliquid.xyz/evm",
    drandBeacon: "evmnet",
    vrfAddress: "0xCcf1703933D957c10CCD9062689AC376Df33e8E1",
  },
};

export function resolveChain(chainId?: number): ChainConfig | undefined {
  if (!chainId) return undefined;
  return CHAINS[chainId];
}


