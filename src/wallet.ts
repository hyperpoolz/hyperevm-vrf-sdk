import { HyperEVMVRF } from "./HyperEVMVRF";

export type CreateEphemeralWalletOptions = Parameters<typeof HyperEVMVRF.createEphemeral>[0];

export async function createEphemeralWallet(options: CreateEphemeralWalletOptions) {
  // Thin alias to class-based factory; name is friendlier for users
  return HyperEVMVRF.createEphemeral(options);
}



