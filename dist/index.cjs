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
  DrandClient: () => DrandClient,
  VrfContract: () => VrfContract,
  Wallet: () => Wallet,
  defaultPolicy: () => defaultPolicy
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DrandClient,
  VrfContract,
  Wallet,
  defaultPolicy
});
