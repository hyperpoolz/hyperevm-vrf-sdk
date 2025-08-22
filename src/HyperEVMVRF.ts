import { ethers } from "ethers";
import { getVRFContract } from "./contract";
import { defaultVRFABI, defaultConfig } from "./defaults";
import { calculateTargetRound, fetchRoundSignature } from "./drand";

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

export class HyperEVMVRF {
  private readonly cfg: HyperevmVrfConfig & Required<
    Pick<HyperevmVrfConfig, "rpcUrl" | "vrfAddress" | "chainId">
  >;

  constructor(cfg: HyperevmVrfConfig) {
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

  public async fulfill(requestId: bigint): Promise<void> {
    const vrfAddress = this.cfg.vrfAddress;

    const provider = new ethers.JsonRpcProvider(this.cfg.rpcUrl);
    const signer = new ethers.Wallet(this.cfg.account.privateKey, provider);

    const vrfContract = getVRFContract(vrfAddress, defaultVRFABI, signer);

    const request = (await vrfContract.getRequest(
      requestId
    )) as unknown as VrfRequest;

    if (request.fulfilled) {
      throw new Error("Request already fulfilled");
    }

    const { targetRound, latestRound } = await calculateTargetRound(
      request.deadline,
      request.minRound
    );

    if (latestRound < targetRound) {
      throw new Error("Target round is not yet published");
    }

    const signature = await fetchRoundSignature(targetRound);

    const tx = await vrfContract.fulfillRandomness(requestId, targetRound, [
      signature[0],
      signature[1],
    ]);

    console.log("Transaction sent:", tx.hash);

    await tx.wait();

    console.log("Transaction mined:", tx.hash);
  }
}
