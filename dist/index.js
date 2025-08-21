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
export {
  DrandClient,
  VrfContract,
  Wallet,
  defaultPolicy
};
