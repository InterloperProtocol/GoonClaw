import { createHash } from "crypto";

import { SIM_CHAIN_BLOCK_INTERVAL_MINUTES } from "@/lib/server/sim-chain";

export function buildSnapshotWindows(height: number, seed: string) {
  const base = createHash("sha256").update(`${height}:${seed}`).digest("hex");
  const offsets = [0, 1, 2].map((index) => {
    const slice = base.slice(index * 8, index * 8 + 8);
    const value = Number.parseInt(slice, 16);
    return 60 + (value % 480);
  });

  return offsets
    .sort((left, right) => left - right)
    .map((offsetSeconds, index) => ({
      id: `snapshot-window:${height}:${index}`,
      offsetSeconds,
      windowLabel: `T+${Math.floor(offsetSeconds / 60)}m ${offsetSeconds % 60}s`,
      withinBlockMinutes: SIM_CHAIN_BLOCK_INTERVAL_MINUTES,
    }));
}
