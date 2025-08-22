import { HyperEVMVRF } from "../src/HyperEVMVRF";
import {
  HyperEVMVrfError,
  VrfRequestAlreadyFulfilledError,
  VrfTargetRoundNotPublishedError,
  DrandError,
  NetworkError,
  ConfigurationError,
  ContractError,
  TransactionError,
  ERROR_CODES
} from "../src/errors.js";

async function demonstrateErrorHandling() {
  try {
    // Example 1: Configuration Error
    const vrf = new HyperEVMVRF({
      account: {
        privateKey: "invalid_key" as `0x${string}`,
      },
    });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.log("Configuration Error:", error.message);
      console.log("Field:", error.field);
      console.log("Details:", error.details);
      console.log("Error Code:", error.code);
    }
  }

  try {
    // Example 2: VRF Request Already Fulfilled
    const vrf = new HyperEVMVRF({
      account: {
        privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`,
      },
    });
    
    await vrf.fulfill(1n);
  } catch (error) {
    if (error instanceof VrfRequestAlreadyFulfilledError) {
      console.log("VRF Request Already Fulfilled:", error.message);
      console.log("Request ID:", error.requestId.toString());
      console.log("Error Code:", error.code);
    } else if (error instanceof VrfTargetRoundNotPublishedError) {
      console.log("Target Round Not Published:", error.message);
      console.log("Request ID:", error.requestId.toString());
      console.log("Target Round:", error.targetRound.toString());
      console.log("Latest Round:", error.latestRound.toString());
      console.log("Seconds Left:", error.secondsLeft.toString());
    } else if (error instanceof ContractError) {
      console.log("Contract Error:", error.message);
      console.log("Contract Address:", error.contractAddress);
      console.log("Operation:", error.operation);
      console.log("Details:", error.details);
    } else if (error instanceof TransactionError) {
      console.log("Transaction Error:", error.message);
      console.log("Transaction Hash:", error.txHash);
      console.log("Operation:", error.operation);
      console.log("Details:", error.details);
    } else if (error instanceof DrandError) {
      console.log("DRAND Error:", error.message);
      console.log("Operation:", error.operation);
      console.log("Details:", error.details);
    } else if (error instanceof NetworkError) {
      console.log("Network Error:", error.message);
      console.log("URL:", error.url);
      console.log("Status Code:", error.statusCode);
      console.log("Details:", error.details);
    } else if (error instanceof HyperEVMVrfError) {
      console.log("Generic VRF Error:", error.message);
      console.log("Error Code:", error.code);
      console.log("Details:", error.details);
    } else {
      console.log("Unknown Error:", error);
    }
  }
}

// Example of error code usage
function demonstrateErrorCodes() {
  console.log("Available Error Codes:");
  Object.entries(ERROR_CODES).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
}

// Example of custom error handling
function handleVrfError(error: unknown): void {
  if (error instanceof HyperEVMVrfError) {
    switch (error.code) {
      case ERROR_CODES.VRF_REQUEST_ERROR:
        console.log("Handling VRF request error...");
        break;
      case ERROR_CODES.DRAND_ERROR:
        console.log("Handling DRAND error...");
        break;
      case ERROR_CODES.NETWORK_ERROR:
        console.log("Handling network error...");
        break;
      case ERROR_CODES.CONFIGURATION_ERROR:
        console.log("Handling configuration error...");
        break;
      case ERROR_CODES.CONTRACT_ERROR:
        console.log("Handling contract error...");
        break;
      case ERROR_CODES.TRANSACTION_ERROR:
        console.log("Handling transaction error...");
        break;
      default:
        console.log("Handling unknown VRF error...");
    }
  } else {
    console.log("Handling non-VRF error...");
  }
}

// Export for use in other modules
export {
  demonstrateErrorHandling,
  demonstrateErrorCodes,
  handleVrfError
};
