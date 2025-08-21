export interface ContractConfig {
    address: string;
}

export class VrfContract {
    private readonly config: ContractConfig;

    constructor(config: ContractConfig) {
        this.config = config;
    }

    public async requestRandomness(): Promise<string> {
        void this.config;
        return '0x';
    }
}


