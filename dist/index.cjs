"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AlreadyFulfilledError: () => AlreadyFulfilledError,
  DEFAULT_CHAIN_ID: () => DEFAULT_CHAIN_ID,
  DEFAULT_DRAND: () => DEFAULT_DRAND,
  DEFAULT_POLICY: () => DEFAULT_POLICY,
  DEFAULT_RPC_URL: () => DEFAULT_RPC_URL,
  DrandClient: () => DrandClient,
  HyperevmVrf: () => HyperevmVrf,
  PolicyViolationError: () => PolicyViolationError,
  RoundMissingError: () => RoundMissingError,
  TxError: () => TxError,
  VrfContract: () => VrfContract,
  Wallet: () => Wallet,
  WrongBeaconError: () => WrongBeaconError,
  defaultPolicy: () => defaultPolicy,
  resolveConfig: () => resolveConfig
});
module.exports = __toCommonJS(index_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
