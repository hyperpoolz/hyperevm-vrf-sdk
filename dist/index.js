// src/drand.ts
var DrandClient = class {
  config;
  constructor(config) {
    this.config = config;
  }
  // Placeholder method to satisfy build
  async getRandomness() {
    void this.config;
    return "0x";
  }
};

// src/policy.ts
var defaultPolicy = {
  maxRequestsPerBlock: 100
};

// src/contract.ts
var VrfContract = class {
  config;
  constructor(config) {
    this.config = config;
  }
  async requestRandomness() {
    void this.config;
    return "0x";
  }
};

// src/wallet.ts
var Wallet = class {
  config;
  constructor(config = {}) {
    this.config = config;
  }
  getAddress() {
    void this.config;
    return "0x0000000000000000000000000000000000000000";
  }
};

// src/config.ts
var DEFAULT_RPC_URL = "https://rpc.hyperliquid.xyz/evm";
var DEFAULT_CHAIN_ID = 999;
var DEFAULT_POLICY = { mode: "window", window: 1 };
var DEFAULT_DRAND = {
  baseUrl: "https://api.drand.sh/v2",
  fetchTimeoutMs: 8e3
};
function resolveConfig(cfg) {
  return {
    rpcUrl: cfg.rpcUrl ?? DEFAULT_RPC_URL,
    vrfAddress: cfg.vrfAddress,
    chainId: cfg.chainId ?? DEFAULT_CHAIN_ID,
    account: cfg.account,
    policy: {
      mode: cfg.policy?.mode ?? DEFAULT_POLICY.mode,
      window: (cfg.policy?.mode === "window" ? cfg.policy?.window ?? DEFAULT_POLICY.window : 0) || (cfg.policy?.mode === "strict" ? 0 : DEFAULT_POLICY.window)
    },
    drand: {
      baseUrl: cfg.drand?.baseUrl ?? DEFAULT_DRAND.baseUrl,
      fetchTimeoutMs: cfg.drand?.fetchTimeoutMs ?? DEFAULT_DRAND.fetchTimeoutMs
    },
    gas: cfg.gas
  };
}

// src/errors.ts
var PolicyViolationError = class extends Error {
  name = "PolicyViolationError";
};
var RoundMissingError = class extends Error {
  name = "RoundMissingError";
};
var WrongBeaconError = class extends Error {
  name = "WrongBeaconError";
};
var AlreadyFulfilledError = class extends Error {
  name = "AlreadyFulfilledError";
};
var TxError = class extends Error {
  name = "TxError";
};

// src/sdk.ts
var HyperevmVrf = class _HyperevmVrf {
  cfg;
  constructor(cfg) {
    this.cfg = cfg;
  }
  static async init(cfg) {
    if (!cfg?.vrfAddress) {
      throw new Error("vrfAddress is required");
    }
    const resolved = resolveConfig(cfg);
    return new _HyperevmVrf(resolved);
  }
  getAccount() {
    throw new Error("getAccount() not implemented yet");
  }
  async fulfill(_requestId) {
    throw new Error("fulfill() not implemented yet");
  }
  onRequested(_handler) {
    throw new Error("onRequested() not implemented yet");
  }
};
export {
  AlreadyFulfilledError,
  DEFAULT_CHAIN_ID,
  DEFAULT_DRAND,
  DEFAULT_POLICY,
  DEFAULT_RPC_URL,
  DrandClient,
  HyperevmVrf,
  PolicyViolationError,
  RoundMissingError,
  TxError,
  VrfContract,
  Wallet,
  WrongBeaconError,
  defaultPolicy,
  resolveConfig
};
