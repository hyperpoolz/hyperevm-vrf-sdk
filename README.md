# HyperEVM VRF SDK

TypeScript SDK to fulfill HyperEVM on-chain VRF requests using drand (evmnet) randomness.

### Features
- **Typed API** with ESM/CJS builds
- **One-call fulfill**: fetch target round, verify availability, submit on-chain
- **Sane defaults** for RPC, VRF contract, chain id, and drand endpoint

### Installation

```bash
pnpm add hyperevm-vrf-sdk
# or
npm i hyperevm-vrf-sdk
# or
yarn add hyperevm-vrf-sdk
```

### Quickstart

```ts
import { HyperEVMVRF } from "hyperevm-vrf-sdk";

const vrf = new HyperEVMVRF({
  account: { privateKey: process.env.WALLET_PRIVATE_KEY! },
  // optional overrides shown below
});

const result = await vrf.fulfill(1234n);
console.log(`Fulfilled request ${result.requestId} with round ${result.round}`);
console.log(`Transaction hash: ${result.txHash}`);
```

This will:
- Read request metadata from the VRF contract
- Compute the required drand round from the request deadline and minRound
- Wait until the round is available (if needed) and fetch its signature
- Submit `fulfillRandomness` on-chain
- Return fulfillment details including transaction hash

### Configuration

`new HyperEVMVRF(config)` accepts:

```ts
interface HyperevmVrfConfig {
  rpcUrl?: string;                  // default: https://rpc.hyperliquid.xyz/evm
  vrfAddress?: string;              // default: 0xCcf1703933D957c10CCD9062689AC376Df33e8E1
  chainId?: number;                 // default: 999 (HyperEVM)
  account: { privateKey: string };  // required
  policy?: { mode: "strict" | "window"; window?: number }; // default: { mode: "window", window: 10000 }
  drand?: { baseUrl?: string; fetchTimeoutMs?: number };   // default: api.drand.sh/v2, 8000ms
  gas?: { maxFeePerGasGwei?: number; maxPriorityFeePerGasGwei?: number };
}
```

Defaults are exported from `defaultConfig` and `defaultVRFABI`.

#### Policy Enforcement

The SDK enforces VRF request policies to ensure randomness quality and security:

- **`strict` mode**: Only allows fulfillment when the target round is exactly the latest published round
- **`window` mode**: Allows fulfillment when the target round is within a specified window of the latest round
- **No policy**: Explicitly disable policy enforcement by setting `policy: undefined`

**Default Behavior**: When no policy is specified, the SDK uses a very generous window of 10000 rounds to ensure requests can be fulfilled even if they've been waiting for a long time. This provides maximum usability while still having some reasonable upper bound.

> **Note**: With DRAND's 30-second round interval, a window of 10000 rounds allows requests that are up to ~83 hours (3.5 days) old to be fulfilled. This ensures excellent user experience for most scenarios.

```ts
// Strict policy - only fulfill with latest round
const vrf = new HyperEVMVRF({
  account: { privateKey: process.env.PRIVATE_KEY! },
  policy: { mode: "strict" }
});

// Window policy - allow up to 3 rounds behind latest
const vrf = new HyperEVMVRF({
  account: { privateKey: process.env.PRIVATE_KEY! },
  policy: { mode: "window", window: 3 }
});

// No policy enforcement - allow any round difference
const vrf = new HyperEVMVRF({
  account: { privateKey: process.env.PRIVATE_KEY! },
  policy: undefined
});

// Default policy (very generous window=10000) when no policy specified
const vrf = new HyperEVMVRF({
  account: { privateKey: process.env.PRIVATE_KEY! }
  // Uses default: { mode: "window", window: 10000 }
});
```

Policy violations throw `VrfPolicyViolationError` with detailed context about the violation.

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
  - `fulfill(requestId: bigint): Promise<FulfillResult>`

### Error Handling

The SDK provides comprehensive typed error handling with specific error classes for different failure scenarios:

#### Error Classes

- **`HyperEVMVrfError`** - Base error class for all SDK errors
- **`ConfigurationError`** - Invalid configuration parameters
- **`VrfRequestError`** - Base class for VRF request-related errors
  - **`VrfRequestAlreadyFulfilledError`** - Request has already been fulfilled
  - **`VrfTargetRoundNotPublishedError`** - Target DRAND round not yet available
  - **`VrfPolicyViolationError`** - Policy enforcement violations
- **`DrandError`** - DRAND network or signature errors
  - **`DrandRoundMismatchError`** - Round mismatch between expected and received
  - **`DrandSignatureError`** - Invalid signature format
- **`NetworkError`** - Network communication errors
  - **`HttpError`** - HTTP status code errors
  - **`JsonParseError`** - JSON parsing failures
- **`ContractError`** - Smart contract interaction errors
- **`TransactionError`** - Transaction mining failures

#### Error Properties

All errors include:
- `message`: Human-readable error description
- `code`: Error category identifier
- `details`: Additional context information
- `name`: Error class name for type checking

#### Example Error Handling

```ts
import { HyperEVMVRF, ConfigurationError, VrfRequestAlreadyFulfilledError } from "hyperevm-vrf-sdk";

try {
  const vrf = new HyperEVMVRF({
    account: { privateKey: "invalid_key" }
  });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.log(`Configuration error in field: ${error.field}`);
    console.log(`Details:`, error.details);
  }
}

try {
  await vrf.fulfill(requestId);
} catch (error) {
  if (error instanceof VrfRequestAlreadyFulfilledError) {
    console.log(`Request ${error.requestId} already fulfilled`);
  } else if (error instanceof VrfTargetRoundNotPublishedError) {
    console.log(`Waiting ${error.secondsLeft}s for round ${error.targetRound}`);
  } else if (error instanceof VrfPolicyViolationError) {
    console.log(`Policy violation: ${error.policyMode} mode requires round difference <= ${error.policyWindow}`);
    console.log(`Current: ${error.currentRound}, Target: ${error.targetRound}, Difference: ${error.roundDifference}`);
  }
}
```

#### Error Codes

```ts
import { ERROR_CODES } from "hyperevm-vrf-sdk";

// Available error codes:
// ERROR_CODES.VRF_REQUEST_ERROR
// ERROR_CODES.DRAND_ERROR  
// ERROR_CODES.NETWORK_ERROR
// ERROR_CODES.CONFIGURATION_ERROR
// ERROR_CODES.CONTRACT_ERROR
// ERROR_CODES.TRANSACTION_ERROR
```

#### Return Types

The `fulfill` method returns a `FulfillResult` object:

```ts
interface FulfillResult {
  requestId: bigint;           // The fulfilled request ID
  round: bigint;               // The DRAND round used
  signature: [bigint, bigint]; // BLS signature components
  txHash: `0x${string}`;      // Transaction hash
}
```

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

MIT
