# HyperEVM VRF SDK

TypeScript SDK to fulfill HyperEVM on-chain VRF requests using drand (evmnet) randomness.

### Features
- **Typed API** with ESM/CJS builds
- **One-call fulfill**: fetch target round, verify availability, submit on-chain
- **Sane defaults** for RPC, VRF contract, chain id, and drand endpoint

### Installation

```bash
pnpm add hyperevm-vrf-sdk ethers
# or
npm i hyperevm-vrf-sdk ethers
# or
yarn add hyperevm-vrf-sdk ethers
```

### Quickstart

```ts
import { HyperEVMVRF } from "hyperevm-vrf-sdk";

const vrf = new HyperEVMVRF({
  account: { privateKey: process.env.WALLET_PRIVATE_KEY! },
  // optional overrides shown below
});

await vrf.fulfill(1234n);
```

This will:
- Read request metadata from the VRF contract
- Compute the required drand round from the request deadline and minRound
- Wait until the round is available (if needed) and fetch its signature
- Submit `fulfillRandomness` on-chain

### Configuration

`new HyperEVMVRF(config)` accepts:

```ts
interface HyperevmVrfConfig {
  rpcUrl?: string;                  // default: https://rpc.hyperliquid.xyz/evm
  vrfAddress?: string;              // default: 0xCcf1703933D957c10CCD9062689AC376Df33e8E1
  chainId?: number;                 // default: 999 (HyperEVM)
  account: { privateKey: string };  // required
  policy?: { mode: "strict" | "window"; window?: number }; // default: { mode: "window", window: 1 }
  drand?: { baseUrl?: string; fetchTimeoutMs?: number };   // default: api.drand.sh/v2, 8000ms
  gas?: { maxFeePerGasGwei?: number; maxPriorityFeePerGasGwei?: number };
}
```

Defaults are exported from `defaultConfig` and `defaultVRFABI`.

### Environment

- Node.js >= 18
- Set `WALLET_PRIVATE_KEY` (or pass directly) for the signer

Example `.env` (never commit private keys):

```dotenv
WALLET_PRIVATE_KEY=0xabc123...
```

Load it in scripts/tests with `dotenv` if needed.

### API

- **class `HyperEVMVRF`**
  - `constructor(config: HyperevmVrfConfig)`
  - `fulfill(requestId: bigint): Promise<void>`

### Usage Examples

- Minimal script:

```ts
import "dotenv/config";
import { HyperEVMVRF } from "hyperevm-vrf-sdk";

async function main() {
  const vrf = new HyperEVMVRF({ account: { privateKey: process.env.WALLET_PRIVATE_KEY! } });
  await vrf.fulfill(1234n);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- Custom endpoints and gas:

```ts
const vrf = new HyperEVMVRF({
  rpcUrl: "https://rpc.hyperliquid.xyz/evm",
  vrfAddress: "0xCcf1703933D957c10CCD9062689AC376Df33e8E1",
  chainId: 999,
  account: { privateKey: process.env.WALLET_PRIVATE_KEY! },
  drand: { baseUrl: "https://api.drand.sh/v2", fetchTimeoutMs: 8000 },
  gas: { maxFeePerGasGwei: 2, maxPriorityFeePerGasGwei: 1 },
});
```

### How it works (high level)

- Reads the VRF request from the contract
- Queries drand (evmnet) for beacon info to map deadline -> round
- Ensures the target round is published, fetches its BLS signature
- Calls `fulfillRandomness(id, round, signature)` on the VRF contract

### Scripts

- `pnpm build` – build library with types
- `pnpm dev` – watch build
- `pnpm lint` – eslint check
- `pnpm test` – run unit tests (vitest)

### License

MIT © HyperEVM contributors
