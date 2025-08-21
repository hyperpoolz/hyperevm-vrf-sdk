export class PolicyViolationError extends Error {
    public override name = 'PolicyViolationError';
}

export class RoundMissingError extends Error {
    public override name = 'RoundMissingError';
}

export class WrongBeaconError extends Error {
    public override name = 'WrongBeaconError';
}

export class AlreadyFulfilledError extends Error {
    public override name = 'AlreadyFulfilledError';
}

export class TxError extends Error {
    public override name = 'TxError';
}


