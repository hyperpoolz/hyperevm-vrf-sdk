import { describe, it, expect } from "vitest";
import { HyperEVMVRF } from "../src/HyperEVMVRF";
import { ConfigurationError, VrfPolicyViolationError } from "../src/errors.js";
import { config } from "dotenv";
config();

describe("HyperEVMVRF", () => {
  describe("constructor", () => {
    it("should throw ConfigurationError for missing private key", () => {
      expect(() => {
        new HyperEVMVRF({
          account: {
            privateKey: "" as `0x${string}`,
          },
        });
      }).toThrow(ConfigurationError);
    });

    it("should throw ConfigurationError for invalid private key format", () => {
      expect(() => {
        new HyperEVMVRF({
          account: {
            privateKey: "invalid" as `0x${string}`,
          },
        });
      }).toThrow(ConfigurationError);
    });

    it("should create instance with valid configuration", () => {
      const vrf = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
      });
      expect(vrf).toBeInstanceOf(HyperEVMVRF);
    });

    it("should create instance with strict policy", () => {
      const vrf = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "strict" },
      });
      expect(vrf).toBeInstanceOf(HyperEVMVRF);
    });

    it("should create instance with window policy", () => {
      const vrf = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window", window: 5 },
      });
      expect(vrf).toBeInstanceOf(HyperEVMVRF);
    });
  });

  describe("fulfill", () => {
    it("should fulfill a request with default policy", async () => {
      const vrf = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        }, // Allow larger window for testing
      });

      const requestId = 17n;

      await vrf.fulfill(requestId);
    });

    it("should enforce strict policy", async () => {
      const vrf = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "strict" },
      });

      const requestId = 17n;

      // This should fail with policy violation since we can't guarantee exact round match
      try {
        await vrf.fulfill(requestId);
        throw new Error("Expected policy violation");
      } catch (error) {
        if (error instanceof VrfPolicyViolationError) {
          expect(error.policyMode).toBe("strict");
          expect(error.policyWindow).toBe(0);
        } else {
          throw error; // Re-throw if it's not the expected error
        }
      }
    });
  });
});
