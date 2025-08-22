import { describe, it } from "vitest";
import { HyperEVMVRF } from "../src/HyperEVMVRF";
import { config } from "dotenv";
config();

describe("fulfill", () => {
  it("should fulfill a request", async () => {
    const vrf = new HyperEVMVRF({
      account: {
        privateKey: process.env.PRIVATE_KEY as `0x${string}`,
      },
    });

    const requestId = 17n;

    await vrf.fulfill(requestId);
  });
});
