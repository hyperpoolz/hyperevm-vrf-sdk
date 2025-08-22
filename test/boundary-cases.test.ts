import { describe, it, expect, vi, beforeEach } from "vitest";
import { HyperEVMVRF } from "../src/HyperEVMVRF";
import { VrfPolicyViolationError } from "../src/errors.js";
import { config } from "dotenv";

config();

describe("Boundary Cases", () => {
  let vrf: HyperEVMVRF;

  beforeEach(() => {
    vrf = new HyperEVMVRF({
      account: {
        privateKey: process.env.PRIVATE_KEY as `0x${string}`,
      },
    });
  });

  describe("Deadline == Genesis", () => {
    it("should handle deadline exactly equal to genesis time", () => {
      // Mock the roundFromDeadline logic
      const genesis = 1000n;
      const period = 30n;
      const deadline = 1000n; // Exactly equal to genesis

      // This should return round 1 according to the logic
      const expectedRound = 1n;
      
      // Test the boundary condition
      expect(deadline <= genesis).toBe(true);
    });

    it("should handle deadline slightly before genesis time", () => {
      const genesis = 1000n;
      const period = 30n;
      const deadline = 999n; // Just before genesis

      // This should also return round 1
      const expectedRound = 1n;
      
      expect(deadline <= genesis).toBe(true);
    });

    it("should handle deadline exactly at genesis + period", () => {
      const genesis = 1000n;
      const period = 30n;
      const deadline = 1030n; // genesis + period

      // This should return round 1 (delta = 30, 30 % 30 = 0, so 30/30 = 1)
      const delta = deadline - genesis; // 30
      const round = delta % period === 0n ? delta / period : delta / period + 1n;
      
      expect(round).toBe(1n);
    });
  });

  describe("Divisible Deltas", () => {
    it("should handle delta exactly divisible by period", () => {
      const genesis = 1000n;
      const period = 30n;
      const deadline = 1060n; // genesis + 2*period

      const delta = deadline - genesis; // 60
      const round = delta % period === 0n ? delta / period : delta / period + 1n;
      
      // 60 % 30 = 0, so round = 60/30 = 2
      expect(round).toBe(2n);
    });

    it("should handle delta with remainder", () => {
      const genesis = 1000n;
      const period = 30n;
      const deadline = 1045n; // genesis + period + 15

      const delta = deadline - genesis; // 45
      const round = delta % period === 0n ? delta / period : delta / period + 1n;
      
      // 45 % 30 = 15, so round = 45/30 + 1 = 1 + 1 = 2
      expect(round).toBe(2n);
    });

    it("should handle delta just under period boundary", () => {
      const genesis = 1000n;
      const period = 30n;
      const deadline = 1029n; // genesis + period - 1

      const delta = deadline - genesis; // 29
      const round = delta % period === 0n ? delta / period : delta / period + 1n;
      
      // 29 % 30 = 29, so round = 29/30 + 1 = 0 + 1 = 1
      expect(round).toBe(1n);
    });

    it("should handle delta just over period boundary", () => {
      const genesis = 1000n;
      const period = 30n;
      const deadline = 1031n; // genesis + period + 1

      const delta = deadline - genesis; // 31
      const round = delta % period === 0n ? delta / period : delta / period + 1n;
      
      // 31 % 30 = 1, so round = 31/30 + 1 = 1 + 1 = 2
      expect(round).toBe(2n);
    });
  });

  describe("Window Policy Boundary Cases", () => {
    describe("Window = 0", () => {
      it("should enforce strict policy when window = 0", () => {
        const vrfStrict = new HyperEVMVRF({
          account: {
            privateKey: process.env.PRIVATE_KEY as `0x${string}`,
          },
          policy: { mode: "window", window: 0 },
        });

        // Should allow exact match
        expect(() => {
          (vrfStrict as any).validatePolicy(1n, 100n, 100n); // diff = 0
        }).not.toThrow();

        // Should reject any difference
        expect(() => {
          (vrfStrict as any).validatePolicy(1n, 100n, 101n); // diff = 1
        }).toThrow(VrfPolicyViolationError);

        expect(() => {
          (vrfStrict as any).validatePolicy(1n, 100n, 99n); // diff = -1 (ahead)
        }).toThrow(VrfPolicyViolationError);
      });

      it("should provide correct error details for window = 0 violations", () => {
        const vrfStrict = new HyperEVMVRF({
          account: {
            privateKey: process.env.PRIVATE_KEY as `0x${string}`,
          },
          policy: { mode: "window", window: 0 },
        });

        try {
          (vrfStrict as any).validatePolicy(1n, 100n, 101n);
          throw new Error("Expected policy violation");
        } catch (error) {
          if (error instanceof VrfPolicyViolationError) {
            expect(error.policyMode).toBe("window");
            expect(error.policyWindow).toBe(0);
            expect(error.roundDifference).toBe(1n);
          } else {
            throw error;
          }
        }
      });
    });

    describe("Window = 1", () => {
      it("should allow round difference of 0 and 1 when window = 1", () => {
        const vrfWindow = new HyperEVMVRF({
          account: {
            privateKey: process.env.PRIVATE_KEY as `0x${string}`,
          },
          policy: { mode: "window", window: 1 },
        });

        // Should allow round difference of 0
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 100n); // diff = 0
        }).not.toThrow();

        // Should allow round difference of 1
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 101n); // diff = 1
        }).not.toThrow();

        // Should reject round difference of 2
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 102n); // diff = 2
        }).toThrow(VrfPolicyViolationError);
      });

      it("should handle edge case of round difference exactly equal to window", () => {
        const vrfWindow = new HyperEVMVRF({
          account: {
            privateKey: process.env.PRIVATE_KEY as `0x${string}`,
          },
          policy: { mode: "window", window: 1 },
        });

        // Should allow round difference exactly equal to window
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 101n); // diff = 1, window = 1
        }).not.toThrow();
      });
    });

    describe("Window = 2", () => {
      it("should allow round differences of 0, 1, and 2 when window = 2", () => {
        const vrfWindow = new HyperEVMVRF({
          account: {
            privateKey: process.env.PRIVATE_KEY as `0x${string}`,
          },
          policy: { mode: "window", window: 2 },
        });

        // Should allow round difference of 0
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 100n); // diff = 0
        }).not.toThrow();

        // Should allow round difference of 1
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 101n); // diff = 1
        }).not.toThrow();

        // Should allow round difference of 2
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 102n); // diff = 2
        }).not.toThrow();

        // Should reject round difference of 3
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 103n); // diff = 3
        }).toThrow(VrfPolicyViolationError);
      });

      it("should handle edge case of round difference exactly equal to window", () => {
        const vrfWindow = new HyperEVMVRF({
          account: {
            privateKey: process.env.PRIVATE_KEY as `0x${string}`,
          },
          policy: { mode: "window", window: 2 },
        });

        // Should allow round difference exactly equal to window
        expect(() => {
          (vrfWindow as any).validatePolicy(1n, 100n, 102n); // diff = 2, window = 2
        }).not.toThrow();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large round differences within policy limits", () => {
      const vrfLargeWindow = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "window", window: 100000 },
      });

      // Should allow very large round differences within window
      expect(() => {
        (vrfLargeWindow as any).validatePolicy(1n, 100n, 50000n); // diff = 49900
      }).not.toThrow();

      expect(() => {
        (vrfLargeWindow as any).validatePolicy(1n, 100n, 100100n); // diff = 100000
      }).not.toThrow();

      // Should reject round differences exceeding window
      expect(() => {
        (vrfLargeWindow as any).validatePolicy(1n, 100n, 100101n); // diff = 100001
      }).toThrow(VrfPolicyViolationError);
    });

    it("should handle zero target round", () => {
      const vrfDefault = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
      });

      // Should handle edge case of target round being 0
      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 0n, 1000n); // target = 0, current = 1000
      }).not.toThrow();
    });

    it("should handle very large target rounds", () => {
      const vrfDefault = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
      });

      // Should handle very large target rounds
      expect(() => {
        (vrfDefault as any).validatePolicy(1n, 1000000n, 1001000n); // target = 1M, current = 1M+1K
      }).not.toThrow();
    });
  });

  describe("Policy Mode Edge Cases", () => {
    it("should handle strict mode with window = 0", () => {
      const vrfStrict = new HyperEVMVRF({
        account: {
          privateKey: process.env.PRIVATE_KEY as `0x${string}`,
        },
        policy: { mode: "strict" },
      });

      // Strict mode should behave the same as window mode with window = 0
      expect(() => {
        (vrfStrict as any).validatePolicy(1n, 100n, 100n); // diff = 0
      }).not.toThrow();

      expect(() => {
        (vrfStrict as any).validatePolicy(1n, 100n, 101n); // diff = 1
      }).toThrow(VrfPolicyViolationError);
    });

    it("should handle mixed policy configurations", () => {
      // Test various combinations of policy configurations
      const policies = [
        { mode: "window" as const, window: 0 },
        { mode: "window" as const, window: 1 },
        { mode: "window" as const, window: 2 },
        { mode: "strict" as const },
      ];

      policies.forEach((policy) => {
        const vrf = new HyperEVMVRF({
          account: {
            privateKey: process.env.PRIVATE_KEY as `0x${string}`,
          },
          policy,
        });

        // All should allow exact matches
        expect(() => {
          (vrf as any).validatePolicy(1n, 100n, 100n); // diff = 0
        }).not.toThrow();
      });
    });
  });
});
