import "dotenv/config";
import { HyperEVMVRF } from "../src/HyperEVMVRF";

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!privateKey) throw new Error("Set PRIVATE_KEY in env");

  const vrfAddress = process.env.VRF_ADDRESS as `0x${string}` | undefined;

  const vrf = new HyperEVMVRF({
    account: { privateKey },
    chainId: 999,
    vrfAddress,
    policy: undefined,
  });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 120);

  console.log("Requesting randomness...");
  const { requestId, txHash: requestTxHash } = await vrf.requestRandomness({
    deadline,
    consumer: "0x0000000000000000000000000000000000000000",
  });
  console.log({ requestId: requestId.toString(), requestTxHash });

  console.log("Fulfilling (waiting for DRAND round)...");
  const res = await vrf.fulfillWithWait(requestId, { timeoutMs: 5 * 60_000, intervalMs: 2000 });
  console.log({ round: res.round.toString(), txHash: res.txHash, signature: res.signature.map(String) });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



