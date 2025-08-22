import { httpsGet } from "./utils";
import { DrandSignatureError, DrandRoundMismatchError } from "./errors.js";

const DRAND_BASE_URL = "https://api.drand.sh/v2";

export const getBeaconInfo = async () => {
  const info = await httpsGet(`${DRAND_BASE_URL}/beacons/evmnet/info`);
  return info as { genesis_time: string; period: string };
};

function roundFromDeadline(
  genesis: bigint,
  period: bigint,
  deadline: bigint
) {
  if (deadline <= genesis) return 1n;
  const delta = deadline - genesis;
  return delta % period === 0n ? delta / period : delta / period + 1n;
}

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(" ");
}

export const calculateTargetRound = async (
  deadline: bigint,
  minRound: bigint
) => {
  console.log("\n3. Calculating target round...");

  const info = await getBeaconInfo();
  const genesis = BigInt(info.genesis_time);
  const period = BigInt(info.period);

  const r = roundFromDeadline(genesis, period, deadline);
  const targetRound = r < minRound ? minRound : r;
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const latestRound = (nowSec - genesis) / period + 1n;
  const notBefore = genesis + (targetRound - 1n) * period; // earliest publish time
  const secondsLeft = notBefore > nowSec ? notBefore - nowSec : 0n;

  console.log("- Calculated round from deadline:", r.toString());
  console.log(
    "- Target round (max of calculated and min):",
    targetRound.toString()
  );
  console.log("- Latest published round:", latestRound.toString());
  console.log(
    "- Not-before time:",
    new Date(Number(notBefore) * 1000).toISOString()
  );
  console.log(
    "- Time until required round:",
    `${formatDuration(Number(secondsLeft))} (${secondsLeft.toString()}s)`
  );

  return {
    targetRound,
    latestRound,
    notBefore,
    secondsLeft,
  };
};

function hexToBigIntPair(sigHex: string) {
  const h = sigHex.startsWith("0x") ? sigHex.slice(2) : sigHex;
  if (h.length !== 128)
    throw new DrandSignatureError(sigHex, 128, h.length);
  const x = BigInt("0x" + h.slice(0, 64));
  const y = BigInt("0x" + h.slice(64));
  return [x, y];
}

export const fetchRoundSignature = async (round: bigint) => {
  const roundData = (await httpsGet(
    `${DRAND_BASE_URL}/beacons/evmnet/rounds/${round}`
  )) as { round: string; signature: string };

  if (BigInt(roundData.round) !== round) {
    throw new DrandRoundMismatchError(round, roundData.round);
  }

  const signature = hexToBigIntPair(roundData.signature);

  return signature;
};
