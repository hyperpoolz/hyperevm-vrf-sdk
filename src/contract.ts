import { ethers, InterfaceAbi } from "ethers";
import { ConfigurationError } from "./errors.js";

export const getVRFContract = (
  address: string,
  abi: InterfaceAbi,
  signer: ethers.Signer
) => {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new ConfigurationError(
      "Invalid VRF contract address",
      "vrfAddress",
      { address }
    );
  }

  if (!signer) {
    throw new ConfigurationError(
      "Signer is required for VRF contract operations",
      "signer"
    );
  }

  try {
    const contract = new ethers.Contract(address, abi, signer);
    return contract;
  } catch (error) {
    throw new ConfigurationError(
      `Failed to create VRF contract instance: ${error instanceof Error ? error.message : String(error)}`,
      "contract_creation",
      { address, error: error instanceof Error ? error.message : String(error) }
    );
  }
};
