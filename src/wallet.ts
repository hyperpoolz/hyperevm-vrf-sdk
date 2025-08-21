export interface WalletConfig {
    privateKey?: string;
}

export class Wallet {
    private readonly config: WalletConfig;

    constructor(config: WalletConfig = {}) {
        this.config = config;
    }

    public getAddress(): string {
        void this.config;
        return '0x0000000000000000000000000000000000000000';
    }
}


