import { describe, it, expect } from "vitest";
import { HyperEVMVRF } from "../src/HyperEVMVRF";
import { ConfigurationError } from "../src/errors.js";
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
  });

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
});
