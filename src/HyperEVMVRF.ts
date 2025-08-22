import { ethers } from "ethers";
import { getVRFContract } from "./contract";
import { defaultVRFABI, defaultConfig, validateConfig } from "./defaults";
import { calculateTargetRound, fetchRoundSignature } from "./drand";
import { 
  VrfRequestAlreadyFulfilledError, 
  VrfTargetRoundNotPublishedError,
  VrfPolicyViolationError,
  ContractError,
  TransactionError,
  ConfigurationError
} from "./errors.js";

export interface HyperevmVrfConfig {
  rpcUrl?: string; // default https://rpc.hyperliquid.xyz/evm
  vrfAddress?: string;
  chainId?: number; // default 999
  account: { privateKey: string };
  policy?: { mode: "strict" | "window"; window?: number }; // default window=1
  drand?: { baseUrl?: string; fetchTimeoutMs?: number }; // default api.drand.sh/v2, 8000ms
  gas?: { maxFeePerGasGwei?: number; maxPriorityFeePerGasGwei?: number };
}

type VrfRequest = {
  deadline: bigint;
  minRound: bigint;
  fulfilled: boolean;
  requester: string;
  callback: string;
  salt?: string;
  randomness?: string;
};

type FulfillResult = {
  requestId: bigint;
  round: bigint;
  signature: [bigint, bigint];
  txHash: `0x${string}`;
};

export class HyperEVMVRF {
  private readonly cfg: HyperevmVrfConfig &
    Required<Pick<HyperevmVrfConfig, "rpcUrl" | "vrfAddress" | "chainId">>;

  constructor(cfg: HyperevmVrfConfig) {
    // Validate configuration
    validateConfig(cfg);

    // Validate account configuration
    if (!cfg.account?.privateKey) {
      throw new ConfigurationError(
        'Account private key is required',
        'account.privateKey'
      );
    }

    if (!cfg.account.privateKey.startsWith('0x') || cfg.account.privateKey.length !== 66) {
      throw new ConfigurationError(
        'Private key must be a valid 32-byte hex string with 0x prefix',
        'account.privateKey',
        { privateKeyLength: cfg.account.privateKey.length }
      );
    }

    this.cfg = {
      rpcUrl: cfg.rpcUrl ?? defaultConfig.rpcUrl,
      vrfAddress: cfg.vrfAddress ?? defaultConfig.vrfAddress,
      chainId: cfg.chainId ?? defaultConfig.chainId,
      account: cfg.account,
      policy: cfg.hasOwnProperty('policy') ? cfg.policy : defaultConfig.policy,
      drand: {
        baseUrl: cfg.drand?.baseUrl ?? defaultConfig.drand?.baseUrl,
        fetchTimeoutMs:
          cfg.drand?.fetchTimeoutMs ?? defaultConfig.drand?.fetchTimeoutMs,
      },
      gas: cfg.gas,
    };
  }

  /**
   * Validates the VRF request against the configured policy
   * @param requestId The VRF request ID
   * @param targetRound The target DRAND round
   * @param latestRound The latest available DRAND round
   * @throws VrfPolicyViolationError if policy is violated
   */
  private validatePolicy(requestId: bigint, targetRound: bigint, latestRound: bigint): void {
    const { policy } = this.cfg;
    
    if (!policy) {
      return; // No policy configured, allow all
    }

    const roundDifference = latestRound - targetRound;
    
    if (policy.mode === "strict") {
      // Strict mode: target round must be exactly the latest round
      if (roundDifference !== 0n) {
        throw new VrfPolicyViolationError(
          requestId,
          policy.mode,
          0, // window is 0 for strict mode
          latestRound,
          targetRound,
          roundDifference
        );
      }
    } else if (policy.mode === "window") {
      // Window mode: target round must be within the specified window
      const maxWindow = policy.window ?? 1;
      
      // Check if target round is ahead of current round (negative difference)
      if (roundDifference < 0n) {
        throw new VrfPolicyViolationError(
          requestId,
          policy.mode,
          maxWindow,
          latestRound,
          targetRound,
          roundDifference
        );
      }
      
      // Check if round difference exceeds the window
      if (roundDifference > BigInt(maxWindow)) {
        throw new VrfPolicyViolationError(
          requestId,
          policy.mode,
          maxWindow,
          latestRound,
          targetRound,
          roundDifference
        );
      }
    }
  }

  public async fulfill(requestId: bigint): Promise<FulfillResult> {
    const vrfAddress = this.cfg.vrfAddress;

    const provider = new ethers.JsonRpcProvider(this.cfg.rpcUrl);
    const signer = new ethers.Wallet(this.cfg.account.privateKey, provider);

    const vrfContract = getVRFContract(vrfAddress, defaultVRFABI, signer);

    let request: VrfRequest;
    try {
      request = (await vrfContract.getRequest(
        requestId
      )) as unknown as VrfRequest;
    } catch (error) {
      throw new ContractError(
        `Failed to get VRF request ${requestId}`,
        vrfAddress,
        'getRequest',
        { requestId: requestId.toString(), error: error instanceof Error ? error.message : String(error) }
      );
    }

    if (request.fulfilled) {
      throw new VrfRequestAlreadyFulfilledError(requestId);
    }

    const { targetRound, latestRound, secondsLeft } = await calculateTargetRound(
      request.deadline,
      request.minRound
    );

    if (latestRound < targetRound) {
      throw new VrfTargetRoundNotPublishedError(requestId, targetRound, latestRound, secondsLeft);
    }

    // Validate policy before proceeding
    this.validatePolicy(requestId, targetRound, latestRound);

    const signature = await fetchRoundSignature(targetRound);

    let tx: ethers.ContractTransactionResponse;
    try {
      // Prepare transaction options with gas configuration
      const txOptions: any = {};
      
      if (this.cfg.gas?.maxFeePerGasGwei) {
        // Convert Gwei to Wei (1 Gwei = 10^9 Wei)
        txOptions.maxFeePerGas = BigInt(this.cfg.gas.maxFeePerGasGwei) * 1000000000n;
        console.log(`Setting maxFeePerGas: ${this.cfg.gas.maxFeePerGasGwei} Gwei (${txOptions.maxFeePerGas} Wei)`);
      }
      
      if (this.cfg.gas?.maxPriorityFeePerGasGwei) {
        // Convert Gwei to Wei (1 Gwei = 10^9 Wei)
        txOptions.maxPriorityFeePerGas = BigInt(this.cfg.gas.maxPriorityFeePerGasGwei) * 1000000000n;
        console.log(`Setting maxPriorityFeePerGas: ${this.cfg.gas.maxPriorityFeePerGasGwei} Gwei (${txOptions.maxPriorityFeePerGas} Wei)`);
      }

      if (Object.keys(txOptions).length > 0) {
        console.log("Transaction gas options:", txOptions);
      }

      tx = await vrfContract.fulfillRandomness(requestId, targetRound, [
        signature[0],
        signature[1],
      ], txOptions);
    } catch (error) {
      throw new ContractError(
        `Failed to fulfill VRF randomness for request ${requestId}`,
        vrfAddress,
        'fulfillRandomness',
        { requestId: requestId.toString(), targetRound: targetRound.toString(), error: error instanceof Error ? error.message : String(error) }
      );
    }

    console.log("Transaction sent:", tx.hash);

    try {
      await tx.wait();
      console.log("Transaction mined:", tx.hash);
    } catch (error) {
      throw new TransactionError(
        `Transaction ${tx.hash} failed to be mined`,
        tx.hash,
        'wait',
        { requestId: requestId.toString(), error: error instanceof Error ? error.message : String(error) }
      );
    }

    return {
      requestId,
      round: targetRound,
      signature: [signature[0], signature[1]],
      txHash: tx.hash as `0x${string}`,
    };
  }
}
