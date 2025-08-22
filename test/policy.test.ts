import { describe, it, expect, beforeEach, vi } from "vitest";
import { HyperEVMVRF } from "../src/HyperEVMVRF";
import { VrfPolicyViolationError } from "../src/errors.js";
import { config } from "dotenv";

config();

describe("Policy Validation", () => {
  let vrf: HyperEVMVRF;

  beforeEach(() => {
    vrf = new HyperEVMVRF({
      account: {
        privateKey: process.env.PRIVATE_KEY as `0x${string}`,
      },
    });
  });

  describe("Strict Policy", () => {
    it("should allow fulfillment when target round equals latest round", () => {
      const vrfStrict = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "strict" },
      });

      // Mock the validatePolicy method to test logic
      const validatePolicySpy = vi.spyOn(vrfStrict as any, 'validatePolicy');
      
      // This should not throw
      expect(() => {
        (vrfStrict as any).validatePolicy(1n, 100n, 100n);
      }).not.toThrow();

      expect(validatePolicySpy).toHaveBeenCalledWith(1n, 100n, 100n);
    });

    it("should reject fulfillment when target round is behind latest round", () => {
      const vrfStrict = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "strict" },
      });

      expect(() => {
        (vrfStrict as any).validatePolicy(1n, 100n, 101n);
      }).toThrow(VrfPolicyViolationError);
    });

    it("should reject fulfillment when target round is ahead of latest round", () => {
      const vrfStrict = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "strict" },
      });

      expect(() => {
        (vrfStrict as any).validatePolicy(1n, 101n, 100n);
      }).toThrow(VrfPolicyViolationError);
    });
  });

  describe("Window Policy", () => {
    it("should allow fulfillment within window", () => {
      const vrfWindow = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window", window: 2 },
      });

      // Should allow round difference of 0, 1, or 2
      expect(() => {
        (vrfWindow as any).validatePolicy(1n, 100n, 100n); // diff = 0
      }).not.toThrow();

      expect(() => {
        (vrfWindow as any).validatePolicy(1n, 100n, 101n); // diff = 1
      }).not.toThrow();

      expect(() => {
        (vrfWindow as any).validatePolicy(1n, 100n, 102n); // diff = 2
      }).not.toThrow();
    });

    it("should reject fulfillment outside window", () => {
      const vrfWindow = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window", window: 2 },
      });

      expect(() => {
        (vrfWindow as any).validatePolicy(1n, 100n, 103n); // diff = 3
      }).toThrow(VrfPolicyViolationError);
    });

    it("should use default window of 1 when window mode specified without window value", () => {
      const vrfDefault = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window" }, // window not specified - uses fallback of 1
      });

      // Should allow round difference of 0 or 1 (fallback window = 1)
      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 100n, 100n); // diff = 0
      }).not.toThrow();

      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 100n, 101n); // diff = 1
      }).not.toThrow();

      // Should reject round difference of 2 (exceeds fallback window of 1)
      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 100n, 102n); // diff = 2
      }).toThrow(VrfPolicyViolationError);
    });
  });

  describe("Default Policy", () => {
    it("should use generous default window policy when no policy is configured", () => {
      const vrfDefault = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        // No policy specified - should use generous default
      });

      // Should allow very large round differences (default window = 10000)
      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 100n, 100n); // diff = 0
      }).not.toThrow();

      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 100n, 5000n); // diff = 4900
      }).not.toThrow();

      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 100n, 10100n); // diff = 10000
      }).not.toThrow();

      // Should reject only extremely large differences (exceeds default window of 10000)
      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 100n, 10101n); // diff = 10001
      }).toThrow(VrfPolicyViolationError);
    });
  });

  describe("No Policy Enforcement", () => {
    it("should allow any round difference when policy is explicitly disabled", () => {
      // Create a VRF instance with policy explicitly set to undefined
      const vrfNoPolicy = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: undefined as any, // Explicitly disable policy
      });

      // Should allow any round difference
      expect(() => {
        (vrfNoPolicy as any).validatePolicy(1n, 100n, 200n); // diff = 100
      }).not.toThrow();

      expect(() => {
        (vrfNoPolicy as any).validatePolicy(1n, 100n, 1000n); // diff = 900
      }).not.toThrow();
    });
  });

  describe("Policy Violation Error Details", () => {
    it("should provide detailed error information for strict policy violations", () => {
      const vrfStrict = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "strict" },
      });

      try {
        (vrfStrict as any).validatePolicy(1n, 100n, 101n);
        throw new Error("Expected policy violation");
      } catch (error) {
        if (error instanceof VrfPolicyViolationError) {
          expect(error.policyMode).toBe("strict");
          expect(error.policyWindow).toBe(0);
          expect(error.currentRound).toBe(101n);
          expect(error.targetRound).toBe(100n);
          expect(error.roundDifference).toBe(1n);
          expect(error.requestId).toBe(1n);
        } else {
          throw error;
        }
      }
    });

    it("should provide detailed error information for window policy violations", () => {
      const vrfWindow = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window", window: 2 },
      });

      try {
        (vrfWindow as any).validatePolicy(1n, 100n, 103n);
        throw new Error("Expected policy violation");
      } catch (error) {
        if (error instanceof VrfPolicyViolationError) {
          expect(error.policyMode).toBe("window");
          expect(error.policyWindow).toBe(2);
          expect(error.currentRound).toBe(103n);
          expect(error.targetRound).toBe(100n);
          expect(error.roundDifference).toBe(3n);
          expect(error.requestId).toBe(1n);
        } else {
          throw error;
        }
      }
    });
  });

  describe("Additional Boundary Cases", () => {
    it("should reject negative round differences (target ahead of current)", () => {
      const vrfWindow = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window", window: 2 },
      });

      // Should reject case where target round is ahead of current round
      expect(() => {
        (vrfWindow as any).validatePolicy(1n, 102n, 100n); // target = 102, current = 100, diff = -2
      }).toThrow(VrfPolicyViolationError);
    });

    it("should handle edge case of window = 0 with exact match", () => {
      const vrfExact = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window", window: 0 },
      });

      // Should allow exact match when window = 0
      expect(() => {
        (vrfExact as any).validatePolicy(1n, 100n, 100n); // diff = 0
      }).not.toThrow();
    });

    it("should handle edge case of window = 0 with any difference", () => {
      const vrfExact = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window", window: 0 },
      });

      // Should reject any difference when window = 0
      expect(() => {
        (vrfExact as any).validatePolicy(1n, 100n, 101n); // diff = 1
      }).toThrow(VrfPolicyViolationError);

      expect(() => {
        (vrfExact as any).validatePolicy(1n, 100n, 99n); // diff = -1
      }).toThrow(VrfPolicyViolationError);
    });
  });

  describe("Gas Configuration", () => {
    it("should create instance with gas configuration", () => {
      const vrf = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        gas: { 
          maxFeePerGasGwei: 100, 
          maxPriorityFeePerGasGwei: 5 
        },
      });
      expect(vrf).toBeInstanceOf(HyperEVMVRF);
    });

    it("should handle partial gas configuration", () => {
      const vrf = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        gas: { 
          maxFeePerGasGwei: 75 
          // maxPriorityFeePerGasGwei not specified
        },
      });
      expect(vrf).toBeInstanceOf(HyperEVMVRF);
    });
  });
});
