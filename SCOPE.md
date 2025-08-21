# hyperevm-vrf — SDK Scope (MVP)

## Purpose
A TypeScript SDK that fulfills randomness requests for **DrandVRF_Split** on **HyperEVM (chainId 999)**.  
The SDK bridges drand’s public randomness beacon (BN254, evmnet) with the on-chain contract:

1. Derive the target drand round from on-chain request data.
2. Fetch the BN254 signature for that round from drand’s v2 API.
3. Submit `fulfillRandomness(requestId, round, sig)` back on-chain.

## Users
Operators (“node runners”) who want to keep randomness requests live.  
Consumer dApp developers only integrate the on-chain contract.

## In Scope (MVP)
- **Config & init**
  - RPC, chainId (default 999), VRF contract address.
  - Account import (private key) or generate fresh EOA.
  - Gas settings (maxFee, maxPriority).
- **Drand client (BN254 evmnet)**
  - Fetch beacon info `{genesisTime, period}`.
  - Fetch round signatures.
  - Timeout + basic retry.
- **Policy enforcement**
  - Compute `minRound(deadline, genesis, period)`.
  - Modes: `strict` (round == minRound) or `window` (<= minRound + K).
  - Optional expiry check (deadlineMax).
- **Contract bindings**
  - `getRequest(requestId)` wrapper.
  - `fulfillRandomness(requestId, round, sig)` call.
- **One-shot helper**
  - `fulfill(requestId)` = read request → compute round → fetch sig → call fulfill.
- **Typed errors**
  - `PolicyViolationError`, `RoundMissingError`, `WrongBeaconError`, `AlreadyFulfilledError`, `TxError`.
- **Examples & docs**
  - Quick start script.
  - Consumer snippet.

## Optional (time-permitting)
- **Watcher**: subscribe to `RandomnessRequested` and auto-fulfill.
- **CLI**: `vrf init`, `vrf fulfill --id`, `vrf watch`.

## Out of Scope (MVP)
- On-chain BLS math (contract already handles this).
- Multi-chain or multi-beacon support.
- Heavy caching infra or queueing.
- HSM/KeyVault integrations.
- Complex gas strategies.

## Public API
```ts
export interface HyperevmVrfConfig {
  rpcUrl?: string; // default https://rpc.hyperliquid.xyz/evm
  vrfAddress: `0x${string}`;
  chainId?: number; // default 999
  account?: { privateKey: `0x${string}` } | { generate: true };
  policy?: { mode: 'strict' | 'window'; window?: number }; // default window=1
  drand?: { baseUrl?: string; fetchTimeoutMs?: number }; // default api.drand.sh/v2, 8000ms
  gas?: { maxFeePerGasGwei?: number; maxPriorityFeePerGasGwei?: number };
}

export interface FulfillResult {
  requestId: bigint;
  round: bigint;
  signature: [bigint, bigint];
  txHash: `0x${string}`;
}

export class HyperevmVrf {
  static init(cfg: HyperevmVrfConfig): Promise<HyperevmVrf>;
  fulfill(requestId: bigint): Promise<FulfillResult>;
  onRequested?(handler: (requestId: bigint) => Promise<void>): () => void; // optional watcher
  getAccount(): { address: `0x${string}` };
}
```

## Example Usage
```ts
import { HyperevmVrf } from 'hyperevm-vrf';

(async () => {
  const vrf = await HyperevmVrf.init({
    rpcUrl: process.env.RPC_URL ?? 'https://rpc.hyperliquid.xyz/evm',
    vrfAddress: process.env.VRF_ADDR as `0x${string}`,
    chainId: 999,
    account: { privateKey: process.env.PRIVKEY as `0x${string}` },
    policy: { mode: 'window', window: 1 }, // or 'strict'
  });

  const result = await vrf.fulfill(1234n);

  console.log(`✅ Fulfilled request ${result.requestId.toString()}`);
  console.log(`- Round: ${result.round.toString()}`);
  console.log(`- Signature: [${result.signature[0]}, ${result.signature[1]}]`);
  console.log(`- Tx hash: ${result.txHash}`);
})();
```