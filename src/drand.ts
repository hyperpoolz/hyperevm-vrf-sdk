export interface DrandConfig {
    endpointUrl: string;
}

export class DrandClient {
    private readonly config: DrandConfig;

    constructor(config: DrandConfig) {
        this.config = config;
    }

    // Placeholder method to satisfy build
    public async getRandomness(): Promise<string> {
        void this.config;
        return '0x';
    }
}


