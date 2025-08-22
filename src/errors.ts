/**
 * Typed error classes for HyperEVM VRF SDK
 */

export class HyperEVMVrfError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'HyperEVMVrfError';
  }
}

export class VrfRequestError extends HyperEVMVrfError {
  constructor(
    message: string,
    public readonly requestId: bigint,
    details?: Record<string, any>
  ) {
    super(message, 'VRF_REQUEST_ERROR', { requestId: requestId.toString(), ...details });
    this.name = 'VrfRequestError';
  }
}

export class VrfRequestAlreadyFulfilledError extends VrfRequestError {
  constructor(requestId: bigint) {
    super(`Request ${requestId} is already fulfilled`, requestId);
    this.name = 'VrfRequestAlreadyFulfilledError';
  }
}

export class VrfTargetRoundNotPublishedError extends VrfRequestError {
  constructor(
    requestId: bigint,
    public readonly targetRound: bigint,
    public readonly latestRound: bigint,
    public readonly secondsLeft: bigint
  ) {
    super(
      `Target round ${targetRound} is not yet published. Latest: ${latestRound}, waiting: ${secondsLeft}s`,
      requestId,
      { targetRound: targetRound.toString(), latestRound: latestRound.toString(), secondsLeft: secondsLeft.toString() }
    );
    this.name = 'VrfTargetRoundNotPublishedError';
  }
}

export class DrandError extends HyperEVMVrfError {
  constructor(
    message: string,
    public readonly operation: string,
    details?: Record<string, any>
  ) {
    super(message, 'DRAND_ERROR', { operation, ...details });
    this.name = 'DrandError';
  }
}

export class DrandRoundMismatchError extends DrandError {
  constructor(
    public readonly expectedRound: bigint,
    public readonly receivedRound: string
  ) {
    super(
      `Round mismatch: expected ${expectedRound}, got ${receivedRound}`,
      'fetch_round_signature',
      { expectedRound: expectedRound.toString(), receivedRound }
    );
    this.name = 'DrandRoundMismatchError';
  }
}

export class DrandSignatureError extends DrandError {
  constructor(
    public readonly signature: string,
    public readonly expectedLength: number,
    public readonly actualLength: number
  ) {
    super(
      `Invalid signature format: expected ${expectedLength} hex chars, got ${actualLength}`,
      'hex_to_bigint_pair',
      { signature: signature.slice(0, 100), expectedLength, actualLength }
    );
    this.name = 'DrandSignatureError';
  }
}

export class NetworkError extends HyperEVMVrfError {
  constructor(
    message: string,
    public readonly url: string,
    public readonly statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message, 'NETWORK_ERROR', { url, statusCode, ...details });
    this.name = 'NetworkError';
  }
}

export class HttpError extends NetworkError {
  constructor(
    url: string,
    public readonly statusCode: number,
    public readonly responseData: string
  ) {
    super(
      `HTTP ${statusCode} from ${url}: ${responseData}`,
      url,
      statusCode,
      { responseData: responseData.slice(0, 200) }
    );
    this.name = 'HttpError';
  }
}

export class JsonParseError extends NetworkError {
  constructor(
    url: string,
    public readonly responseData: string,
    public readonly parseError: string
  ) {
    super(
      `Invalid JSON from ${url}: ${parseError}`,
      url,
      undefined,
      { responseData: responseData.slice(0, 200), parseError }
    );
    this.name = 'JsonParseError';
  }
}

export class ConfigurationError extends HyperEVMVrfError {
  constructor(
    message: string,
    public readonly field?: string,
    details?: Record<string, any>
  ) {
    super(message, 'CONFIGURATION_ERROR', { field, ...details });
    this.name = 'ConfigurationError';
  }
}

export class ContractError extends HyperEVMVrfError {
  constructor(
    message: string,
    public readonly contractAddress: string,
    public readonly operation: string,
    details?: Record<string, any>
  ) {
    super(message, 'CONTRACT_ERROR', { contractAddress, operation, ...details });
    this.name = 'ContractError';
  }
}

export class TransactionError extends HyperEVMVrfError {
  constructor(
    message: string,
    public readonly txHash: string,
    public readonly operation: string,
    details?: Record<string, any>
  ) {
    super(message, 'TRANSACTION_ERROR', { txHash, operation, ...details });
    this.name = 'TransactionError';
  }
}

// Error code constants for easy reference
export const ERROR_CODES = {
  VRF_REQUEST_ERROR: 'VRF_REQUEST_ERROR',
  DRAND_ERROR: 'DRAND_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
} as const;

// Type for error codes
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
