import { createMerkleRoot } from "@/lib/simulation/merkle";
import type { MerkleSnapshotKind } from "@/lib/simulation/types";

export function buildSimChainCheckpoint(kind: MerkleSnapshotKind, leaves: string[]) {
  return {
    kind,
    leafCount: leaves.length,
    root: createMerkleRoot(kind, leaves),
  };
}
