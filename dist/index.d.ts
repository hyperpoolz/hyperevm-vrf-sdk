interface DrandConfig {
    endpointUrl: string;
}
declare class DrandClient {
    private readonly config;
    constructor(config: DrandConfig);
    getRandomness(): Promise<string>;
}

interface VrfPolicy {
    maxRequestsPerBlock: number;
}
declare const defaultPolicy: VrfPolicy;

interface ContractConfig {
    address: string;
}
declare class VrfContract {
    private readonly config;
    constructor(config: ContractConfig);
    requestRandomness(): Promise<string>;
}

interface WalletConfig {
    privateKey?: string;
}
declare class Wallet {
    private readonly config;
    constructor(config?: WalletConfig);
    getAddress(): string;
}

export { type ContractConfig, DrandClient, type DrandConfig, VrfContract, type VrfPolicy, Wallet, type WalletConfig, defaultPolicy };
