import { ethers, InterfaceAbi } from "ethers";

export const getVRFContract = (
  address: string,
  abi: InterfaceAbi,
  signer: ethers.Signer
) => {
  const contract = new ethers.Contract(address, abi, signer);
  return contract;
};
