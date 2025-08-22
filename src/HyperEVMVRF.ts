import { ethers } from "ethers";
import { getVRFContract } from "./contract";
import { defaultVRFABI, defaultConfig, validateConfig } from "./defaults";
import { calculateTargetRound, fetchRoundSignature } from "./drand";
import { 
  VrfRequestAlreadyFulfilledError, 
  VrfTargetRoundNotPublishedError,
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
      policy: cfg.policy ?? defaultConfig.policy,
      drand: {
        baseUrl: cfg.drand?.baseUrl ?? defaultConfig.drand?.baseUrl,
        fetchTimeoutMs:
          cfg.drand?.fetchTimeoutMs ?? defaultConfig.drand?.fetchTimeoutMs,
      },
      gas: cfg.gas,
    };
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

    const signature = await fetchRoundSignature(targetRound);

    let tx: ethers.ContractTransactionResponse;
    try {
      tx = await vrfContract.fulfillRandomness(requestId, targetRound, [
        signature[0],
        signature[1],
      ]);
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
