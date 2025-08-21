export interface VrfPolicy {
    maxRequestsPerBlock: number;
}

export const defaultPolicy: VrfPolicy = {
    maxRequestsPerBlock: 100,
};


