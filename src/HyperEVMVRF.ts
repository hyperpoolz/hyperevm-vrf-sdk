import { ethers } from "ethers";
import { getVRFContract } from "./contract";
import { defaultVRFABI, defaultConfig, validateConfig } from "./defaults";
import { calculateTargetRound, fetchRoundSignature } from "./drand";
import { resolveChain } from "./chains";
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
  policy?: { mode: "strict" | "window"; window?: number }; // default window=10000 via defaults
  drand?: { baseUrl?: string; fetchTimeoutMs?: number; beacon?: string }; // default api.drand.sh/v2, 8000ms, evmnet
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

export type RequestResult = {
  requestId: bigint;
  txHash: `0x${string}`;
};

export type RequestAndFulfillResult = {
  requestId: bigint;
  round: bigint;
  signature: [bigint, bigint];
  requestTxHash: `0x${string}`;
  fulfillTxHash: `0x${string}`;
};

export type EphemeralCreateOptions = Omit<HyperevmVrfConfig, 'account'> & {
  minBalanceWei?: bigint;
  waitTimeoutMs?: number;
  pollIntervalMs?: number;
};

export type EphemeralCreateResult = {
  vrf: HyperEVMVRF;
  address: `0x${string}`;
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

    const resolved = resolveChain(cfg.chainId ?? defaultConfig.chainId);

    this.cfg = {
      rpcUrl: cfg.rpcUrl ?? resolved?.rpcUrl ?? defaultConfig.rpcUrl,
      vrfAddress: cfg.vrfAddress ?? resolved?.vrfAddress ?? defaultConfig.vrfAddress,
      chainId: cfg.chainId ?? defaultConfig.chainId,
      account: cfg.account,
      policy: cfg.hasOwnProperty('policy') ? cfg.policy : defaultConfig.policy,
      drand: {
        baseUrl: cfg.drand?.baseUrl ?? defaultConfig.drand?.baseUrl,
        fetchTimeoutMs: cfg.drand?.fetchTimeoutMs ?? defaultConfig.drand?.fetchTimeoutMs,
        beacon: cfg.drand?.beacon ?? resolved?.drandBeacon ?? (defaultConfig.drand as any)?.beacon,
      },
      gas: cfg.gas,
    };
  }

  /**
   * Create an instance with an in-memory ephemeral account.
   * Returns the address to fund with gas; waits until funded if minBalanceWei provided.
   */
  public static async createEphemeral(options: EphemeralCreateOptions): Promise<EphemeralCreateResult> {
    const chainId = options.chainId ?? defaultConfig.chainId;
    const resolved = resolveChain(chainId);
    const rpcUrl = options.rpcUrl ?? resolved?.rpcUrl ?? defaultConfig.rpcUrl;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.createRandom().connect(provider);

    const minBalanceWei = options.minBalanceWei ?? 0n;
    if (minBalanceWei > 0n) {
      const deadline = Date.now() + (options.waitTimeoutMs ?? 5 * 60_000);
      const interval = Math.max(1000, options.pollIntervalMs ?? 2000);
      // poll balance until funded or timeout
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const bal = await provider.getBalance(wallet.address);
        if (bal >= minBalanceWei) break;
        if (Date.now() + interval > deadline) break;
        await new Promise((r) => setTimeout(r, interval));
      }
    }

    const vrf = new HyperEVMVRF({
      ...options,
      account: { privateKey: wallet.privateKey as `0x${string}` },
    });

    return { vrf, address: wallet.address as `0x${string}` };
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

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      request.minRound,
      { baseUrl: this.cfg.drand?.baseUrl, beacon: (this.cfg.drand as any)?.beacon }
    );

    if (latestRound < targetRound) {
      throw new VrfTargetRoundNotPublishedError(requestId, targetRound, latestRound, secondsLeft);
    }

    // Validate policy before proceeding
    this.validatePolicy(requestId, targetRound, latestRound);

    const signature = await fetchRoundSignature(targetRound, { baseUrl: this.cfg.drand?.baseUrl, beacon: (this.cfg.drand as any)?.beacon });

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

  /**
   * Repeatedly attempts fulfill until the target round is published, with optional timeout.
   */
  public async fulfillWithWait(
    requestId: bigint,
    opts?: { intervalMs?: number; timeoutMs?: number }
  ): Promise<FulfillResult> {
    const start = Date.now();
    const intervalMs = Math.max(500, opts?.intervalMs ?? 2000);
    const timeoutMs = opts?.timeoutMs ?? 5 * 60_000;

    for (;;) {
      try {
        const res = await this.fulfill(requestId);
        return res;
      } catch (e: any) {
        if (e?.name === "VrfTargetRoundNotPublishedError") {
          const secs = Number(e.secondsLeft ?? 1n);
          const wait = Math.min(Math.max(secs * 1000, intervalMs), 30_000);
          if (Date.now() - start + wait > timeoutMs) {
            throw e;
          }
          await this.sleep(wait);
          continue;
        }
        throw e;
      }
    }
  }

  /**
   * Requests randomness directly on the VRF contract.
   * If consumer is omitted, uses address(0) (no callback).
   */
  public async requestRandomness(args: {
    deadline: bigint;
    consumer?: string;
    salt?: `0x${string}`;
  }): Promise<RequestResult> {
    const vrfAddress = this.cfg.vrfAddress;

    const provider = new ethers.JsonRpcProvider(this.cfg.rpcUrl);
    const signer = new ethers.Wallet(this.cfg.account.privateKey, provider);
    const vrfContract = getVRFContract(vrfAddress, defaultVRFABI, signer);

    const consumer = args.consumer ?? "0x0000000000000000000000000000000000000000";
    const salt = args.salt ?? (ethers.hexlify(ethers.randomBytes(32)) as `0x${string}`);

    let tx: ethers.ContractTransactionResponse;
    try {
      tx = await vrfContract.requestRandomness(args.deadline, salt, consumer);
    } catch (error) {
      throw new ContractError(
        `Failed to request randomness`,
        vrfAddress,
        "requestRandomness",
        {
          deadline: args.deadline.toString(),
          consumer,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }

    let requestId: bigint | null = null;
    try {
      const receipt = await tx.wait();
      if (!receipt) {
        throw new TransactionError(
          `Transaction ${tx.hash} returned empty receipt`,
          tx.hash,
          "wait"
        );
      }
      const iface = new ethers.Interface(defaultVRFABI);
      for (const log of receipt.logs ?? []) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "RandomnessRequested") {
            const id = parsed.args?.[0] ?? parsed.args?.id;
            if (typeof id === "bigint") {
              requestId = id;
              break;
            }
          }
        } catch {}
      }
      if (requestId == null) {
        // Fallback to contract.lastId() if event parsing failed
        try {
          const lastId = (await vrfContract.lastId()) as bigint;
          requestId = lastId;
        } catch {}
      }
    } catch (error) {
      throw new TransactionError(
        `Transaction ${tx.hash} failed to be mined`,
        tx.hash,
        "wait",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }

    if (requestId == null) {
      throw new ContractError(
        `Could not determine request id from receipt`,
        vrfAddress,
        "requestRandomness",
        { txHash: tx.hash }
      );
    }

    return { requestId, txHash: tx.hash as `0x${string}` };
  }

  /**
   * One-shot: request a VRF and then fulfill it when the round is available.
   */
  public async requestAndFulfill(args: {
    deadline: bigint;
    consumer?: string;
    salt?: `0x${string}`;
    wait?: { intervalMs?: number; timeoutMs?: number };
  }): Promise<RequestAndFulfillResult> {
    const { requestId, txHash: requestTxHash } = await this.requestRandomness({
      deadline: args.deadline,
      consumer: args.consumer,
      salt: args.salt,
    });

    const fulfill = await this.fulfillWithWait(requestId, args.wait);
    return {
      requestId,
      round: fulfill.round,
      signature: fulfill.signature,
      requestTxHash,
      fulfillTxHash: fulfill.txHash,
    };
  }
}
