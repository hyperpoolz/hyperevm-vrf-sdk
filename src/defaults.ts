import type { HyperevmVrfConfig } from "./HyperEVMVRF";
import { ConfigurationError } from "./errors.js";

export const defaultConfig: Required<
  Pick<
    HyperevmVrfConfig,
    "rpcUrl" | "vrfAddress" | "chainId" | "policy" | "drand"
  >
> = {
  rpcUrl: "https://rpc.hyperliquid.xyz/evm",
  vrfAddress: "0xCcf1703933D957c10CCD9062689AC376Df33e8E1",
  chainId: 999,
  policy: { mode: "window", window: 10000 }, // Very generous default - allows up to 10000 rounds behind
  drand: {
    baseUrl: "https://api.drand.sh/v2",
    fetchTimeoutMs: 8000,
    // default beacon used by HyperEVM VRF deployments
    beacon: "evmnet",
  },
};

// Configuration validation function
export function validateConfig(config: Partial<HyperevmVrfConfig>): void {
  if (config.rpcUrl && !config.rpcUrl.startsWith('http')) {
    throw new ConfigurationError(
      'RPC URL must be a valid HTTP/HTTPS URL',
      'rpcUrl',
      { rpcUrl: config.rpcUrl }
    );
  }

  if (config.vrfAddress && !config.vrfAddress.startsWith('0x')) {
    throw new ConfigurationError(
      'VRF address must be a valid Ethereum address',
      'vrfAddress',
      { vrfAddress: config.vrfAddress }
    );
  }

  if (config.chainId && (config.chainId < 1 || config.chainId > 0x7fffffff)) {
    throw new ConfigurationError(
      'Chain ID must be a positive integer',
      'chainId',
      { chainId: config.chainId }
    );
  }

  if (config.policy?.window && config.policy.window < 1) {
    throw new ConfigurationError(
      'Policy window must be at least 1',
      'policy.window',
      { window: config.policy.window }
    );
  }

  if (config.drand?.fetchTimeoutMs && config.drand.fetchTimeoutMs < 1000) {
    throw new ConfigurationError(
      'DRAND fetch timeout must be at least 1000ms',
      'drand.fetchTimeoutMs',
      { fetchTimeoutMs: config.drand.fetchTimeoutMs }
    );
  }

  if (config.drand && (config.drand as any).beacon && typeof (config.drand as any).beacon !== 'string') {
    throw new ConfigurationError(
      'DRAND beacon must be a string',
      'drand.beacon',
      { beacon: (config.drand as any).beacon }
    );
  }

  if (config.gas?.maxFeePerGasGwei && config.gas.maxFeePerGasGwei < 0) {
    throw new ConfigurationError(
      'Max fee per gas must be non-negative',
      'gas.maxFeePerGasGwei',
      { maxFeePerGasGwei: config.gas.maxFeePerGasGwei }
    );
  }

  if (config.gas?.maxPriorityFeePerGasGwei && config.gas.maxPriorityFeePerGasGwei < 0) {
    throw new ConfigurationError(
      'Max priority fee per gas must be non-negative',
      'gas.maxPriorityFeePerGasGwei',
      { maxPriorityFeePerGasGwei: config.gas.maxPriorityFeePerGasGwei }
    );
  }
}

export const defaultVRFABI = [
  {
    inputs: [
      { internalType: "address", name: "blsVerifier", type: "address" },
      { internalType: "uint256[4]", name: "pubkey", type: "uint256[4]" },
      { internalType: "uint256", name: "genesisTime", type: "uint256" },
      { internalType: "uint256", name: "period", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "AlreadyFulfilled",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint64", name: "provided", type: "uint64" },
      { internalType: "uint64", name: "expectedMin", type: "uint64" },
    ],
    name: "BadRound",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256[4]", name: "pubkey", type: "uint256[4]" },
    ],
    name: "InvalidPublicKey",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256[4]", name: "pubkey", type: "uint256[4]" },
      { internalType: "uint256[2]", name: "message", type: "uint256[2]" },
      { internalType: "uint256[2]", name: "sig", type: "uint256[2]" },
    ],
    name: "InvalidSignature",
    type: "error",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "RequestNotFound",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint64", name: "round", type: "uint64" },
      { internalType: "uint256", name: "notBefore", type: "uint256" },
    ],
    name: "TooEarly",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256[4]",
        name: "pubkey",
        type: "uint256[4]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "genesisTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "period",
        type: "uint256",
      },
    ],
    name: "BeaconUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: false, internalType: "uint64", name: "round", type: "uint64" },
      {
        indexed: false,
        internalType: "bytes32",
        name: "randomness",
        type: "bytes32",
      },
    ],
    name: "RandomnessFulfilled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      {
        indexed: true,
        internalType: "address",
        name: "requester",
        type: "address",
      },
      { indexed: false, internalType: "uint64", name: "round", type: "uint64" },
      {
        indexed: false,
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
    ],
    name: "RandomnessRequested",
    type: "event",
  },
  {
    inputs: [],
    name: "DRAND_PUBKEY",
    outputs: [{ internalType: "uint256[4]", name: "k", type: "uint256[4]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DST",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "GENESIS_TIME",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "P0",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "P1",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "P2",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "P3",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PERIOD",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bls",
    outputs: [{ internalType: "contract IBLS", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "uint64", name: "round", type: "uint64" },
      { internalType: "uint256[2]", name: "signature", type: "uint256[2]" },
    ],
    name: "fulfillRandomness",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getRequest",
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "deadline", type: "uint64" },
          { internalType: "uint64", name: "minRound", type: "uint64" },
          { internalType: "bool", name: "fulfilled", type: "bool" },
          { internalType: "address", name: "requester", type: "address" },
          { internalType: "address", name: "callback", type: "address" },
          { internalType: "bytes32", name: "salt", type: "bytes32" },
          { internalType: "bytes32", name: "randomness", type: "bytes32" },
        ],
        internalType: "struct DrandVRF_Split.Request",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "deadline", type: "uint256" }],
    name: "minRoundFromDeadline",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
      { internalType: "address", name: "consumer", type: "address" },
    ],
    name: "requestRandomness",
    outputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "requests",
    outputs: [
      { internalType: "uint64", name: "deadline", type: "uint64" },
      { internalType: "uint64", name: "minRound", type: "uint64" },
      { internalType: "bool", name: "fulfilled", type: "bool" },
      { internalType: "address", name: "requester", type: "address" },
      { internalType: "address", name: "callback", type: "address" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
      { internalType: "bytes32", name: "randomness", type: "bytes32" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
