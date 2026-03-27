import {
  FieldValue,
  Firestore,
} from "firebase-admin/firestore";

import { getServerEnv, isFirebaseConfigured, isProductionEnv } from "@/lib/env";
import { encryptJson } from "@/lib/server/crypto";
import {
  getScopedFirestoreCollection,
  getTianezhaDataNamespace,
} from "@/lib/server/data-namespace";
import { getConfiguredFirestore } from "@/lib/server/firestore-admin";
import {
  PUBLIC_LIVESTREAM_DEVICE_ID,
  PUBLIC_LIVESTREAM_OWNER_ID,
} from "@/lib/server/runtime-constants";
import {
  DeviceProfile,
  DeviceType,
  BitClawAgentCredentialRecord,
  BitClawCommentRecord,
  BitClawFollowRecord,
  BitClawLikeRecord,
  BitClawProfile,
  EntitlementRecord,
  BitClawPostRecord,
  LivestreamRequestRecord,
  LivestreamRequestStatus,
  OrderRecord,
  PublicStreamProfile,
  SanitizedDeviceProfile,
  SessionRecord,
} from "@/lib/types";
import { nowIso } from "@/lib/utils";

type MemoryShape = {
  devices: Map<string, DeviceProfile>;
  entitlements: Map<string, EntitlementRecord>;
  orders: Map<string, OrderRecord>;
  publicStreamProfiles: Map<string, PublicStreamProfile>;
  bitClawComments: Map<string, BitClawCommentRecord>;
  bitClawFollows: Map<string, BitClawFollowRecord>;
  bitClawLikes: Map<string, BitClawLikeRecord>;
  bitClawProfiles: Map<string, BitClawProfile>;
  bitClawPosts: Map<string, BitClawPostRecord>;
  bitClawAgentCredentials: Map<string, BitClawAgentCredentialRecord>;
  sessions: Map<string, SessionRecord>;
  livestreamRequests: Map<string, LivestreamRequestRecord>;
};
type NamespacedMemoryShape = Record<string, MemoryShape>;

declare global {
  var __tianshiMemory: NamespacedMemoryShape | undefined;
}

function getMemoryStore(): MemoryShape {
  const namespace = getTianezhaDataNamespace();
  if (!global.__tianshiMemory) {
    global.__tianshiMemory = {};
  }

  if (!global.__tianshiMemory[namespace]) {
    global.__tianshiMemory[namespace] = {
      devices: new Map(),
      entitlements: new Map(),
      bitClawAgentCredentials: new Map(),
      bitClawComments: new Map(),
      bitClawFollows: new Map(),
      bitClawLikes: new Map(),
      bitClawProfiles: new Map(),
      bitClawPosts: new Map(),
      orders: new Map(),
      publicStreamProfiles: new Map(),
      sessions: new Map(),
      livestreamRequests: new Map(),
    };
  }

  return global.__tianshiMemory[namespace];
}

function getAdminDb() {
  if (!isFirebaseConfigured()) return null;
  return getConfiguredFirestore();
}

function isFirestoreUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("cloud firestore api has not been used") ||
    message.includes("firestore api") ||
    message.includes("service_disabled") ||
    message.includes("permission_denied") ||
    message.includes("failed_precondition") ||
    message.includes("the database") ||
    message.includes("firestore.googleapis.com")
  );
}

function logFirestoreFallback(action: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.warn(
    `[repository] ${action}: Firestore unavailable, falling back to in-memory store. ${detail}`,
  );
}

function shouldAllowMemoryFallback() {
  return !isProductionEnv();
}

function getRepositoryCollection(db: Firestore, collectionName: string) {
  return getScopedFirestoreCollection(db, collectionName);
}

async function withRepositoryBackend<T>(
  action: string,
  fallback: () => Promise<T> | T,
  dbAction: (db: Firestore) => Promise<T>,
) {
  const db = getAdminDb();
  if (!db) {
    return await fallback();
  }

  try {
    return await dbAction(db);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      if (!shouldAllowMemoryFallback()) {
        throw new Error(
          `Persistent storage is unavailable during ${action}; refusing unsafe in-memory fallback in production.`,
        );
      }

      logFirestoreFallback(action, error);
      return await fallback();
    }
    throw error;
  }
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sanitizeDevice(profile: DeviceProfile): SanitizedDeviceProfile {
  return {
    id: profile.id,
    wallet: profile.wallet,
    type: profile.type,
    label: profile.label,
    supportsLive: profile.supportsLive,
    supportsScript: profile.supportsScript,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function buildPublicLivestreamDevice(type: DeviceType = "autoblow") {
  const env = getServerEnv();
  if (!env.PUBLIC_AUTOBLOW_DEVICE_TOKEN || type !== "autoblow") {
    return null;
  }

  const timestamp = nowIso();
  return {
    id: PUBLIC_LIVESTREAM_DEVICE_ID,
    wallet: PUBLIC_LIVESTREAM_OWNER_ID,
    type: "autoblow" as const,
    label: env.PUBLIC_AUTOBLOW_DEVICE_LABEL,
    encryptedCredentials: encryptJson({
      deviceToken: env.PUBLIC_AUTOBLOW_DEVICE_TOKEN,
    }),
    supportsLive: true,
    supportsScript: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies DeviceProfile;
}

function matchesPublicLivestreamDevice(wallet: string, id: string) {
  return (
    wallet === PUBLIC_LIVESTREAM_OWNER_ID && id === PUBLIC_LIVESTREAM_DEVICE_ID
  );
}

export async function listDevices(wallet: string) {
  const synthetic = wallet === PUBLIC_LIVESTREAM_OWNER_ID
    ? buildPublicLivestreamDevice()
    : null;

  return withRepositoryBackend(
    "listDevices",
    () => {
      const items = [...getMemoryStore().devices.values()].filter(
        (device) => device.wallet === wallet,
      );
      if (synthetic) items.unshift(synthetic);
      return items.map(sanitizeDevice);
    },
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "deviceProfiles")
        .where("wallet", "==", wallet)
        .orderBy("updatedAt", "desc")
        .get();

      const items = snapshot.docs.map((doc) =>
        sanitizeDevice(doc.data() as DeviceProfile),
      );
      return synthetic ? [sanitizeDevice(synthetic), ...items] : items;
    },
  );
}

export async function getDevice(wallet: string, id: string) {
  if (matchesPublicLivestreamDevice(wallet, id)) {
    return buildPublicLivestreamDevice();
  }

  return withRepositoryBackend(
    "getDevice",
    () => {
      const device = getMemoryStore().devices.get(id);
      if (!device || device.wallet !== wallet) return null;
      return device;
    },
    async (db) => {
      const doc = await getRepositoryCollection(db, "deviceProfiles").doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data() as DeviceProfile;
      if (data.wallet !== wallet) return null;
      return data;
    },
  );
}

export async function upsertDevice(profile: DeviceProfile) {
  return withRepositoryBackend(
    "upsertDevice",
    () => {
      getMemoryStore().devices.set(profile.id, profile);
      return sanitizeDevice(profile);
    },
    async (db) => {
      await getRepositoryCollection(db, "deviceProfiles")
        .doc(profile.id)
        .set(profile, { merge: true });
      return sanitizeDevice(profile);
    },
  );
}

export async function deleteDevice(wallet: string, id: string) {
  const existing = await getDevice(wallet, id);
  if (!existing || matchesPublicLivestreamDevice(wallet, id)) return false;

  return withRepositoryBackend(
    "deleteDevice",
    () => {
      getMemoryStore().devices.delete(id);
      return true;
    },
    async (db) => {
      await getRepositoryCollection(db, "deviceProfiles").doc(id).delete();
      return true;
    },
  );
}

export async function getEntitlement(wallet: string) {
  return withRepositoryBackend(
    "getEntitlement",
    () => getMemoryStore().entitlements.get(wallet) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "entitlements").doc(wallet).get();
      return doc.exists ? (doc.data() as EntitlementRecord) : null;
    },
  );
}

export async function upsertEntitlement(record: EntitlementRecord) {
  return withRepositoryBackend(
    "upsertEntitlement",
    () => {
      getMemoryStore().entitlements.set(record.wallet, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "entitlements")
        .doc(record.wallet)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function saveOrder(record: OrderRecord) {
  return withRepositoryBackend(
    "saveOrder",
    () => {
      getMemoryStore().orders.set(record.signature, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "orders")
        .doc(record.signature)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function getOrder(signature: string) {
  return withRepositoryBackend(
    "getOrder",
    () => getMemoryStore().orders.get(signature) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "orders").doc(signature).get();
      return doc.exists ? (doc.data() as OrderRecord) : null;
    },
  );
}

export async function getPublicStreamProfile(guestId: string) {
  return withRepositoryBackend(
    "getPublicStreamProfile",
    () => getMemoryStore().publicStreamProfiles.get(guestId) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "publicStreamProfiles")
        .doc(guestId)
        .get();
      return doc.exists ? (doc.data() as PublicStreamProfile) : null;
    },
  );
}

export async function getPublicStreamProfileBySlug(slug: string) {
  return withRepositoryBackend(
    "getPublicStreamProfileBySlug",
    () =>
      [...getMemoryStore().publicStreamProfiles.values()].find(
        (item) => item.slug === slug,
      ) ?? null,
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "publicStreamProfiles")
        .where("slug", "==", slug)
        .limit(1)
        .get();

      return snapshot.empty
        ? null
        : (snapshot.docs[0].data() as PublicStreamProfile);
    },
  );
}

export async function listPublicStreamProfiles() {
  return withRepositoryBackend(
    "listPublicStreamProfiles",
    () =>
      [...getMemoryStore().publicStreamProfiles.values()].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "publicStreamProfiles").get();
      return snapshot.docs
        .map((doc) => doc.data() as PublicStreamProfile)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
  );
}

export async function upsertPublicStreamProfile(record: PublicStreamProfile) {
  return withRepositoryBackend(
    "upsertPublicStreamProfile",
    () => {
      getMemoryStore().publicStreamProfiles.set(record.guestId, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "publicStreamProfiles")
        .doc(record.guestId)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function getBitClawPost(id: string) {
  return withRepositoryBackend(
    "getBitClawPost",
    () => getMemoryStore().bitClawPosts.get(id) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "bitClawPosts").doc(id).get();
      return doc.exists ? (doc.data() as BitClawPostRecord) : null;
    },
  );
}

export async function getBitClawProfile(id: string) {
  return withRepositoryBackend(
    "getBitClawProfile",
    () => getMemoryStore().bitClawProfiles.get(id) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "bitClawProfiles").doc(id).get();
      return doc.exists ? (doc.data() as BitClawProfile) : null;
    },
  );
}

export async function getBitClawAgentCredential(id: string) {
  return withRepositoryBackend(
    "getBitClawAgentCredential",
    () => getMemoryStore().bitClawAgentCredentials.get(id) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "bitClawAgentCredentials")
        .doc(id)
        .get();
      return doc.exists ? (doc.data() as BitClawAgentCredentialRecord) : null;
    },
  );
}

export async function listBitClawProfiles() {
  return withRepositoryBackend(
    "listBitClawProfiles",
    () =>
      [...getMemoryStore().bitClawProfiles.values()].sort((a, b) =>
        a.displayName.localeCompare(b.displayName),
      ),
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "bitClawProfiles").get();
      return snapshot.docs
        .map((doc) => doc.data() as BitClawProfile)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    },
  );
}

export async function upsertBitClawProfile(record: BitClawProfile) {
  return withRepositoryBackend(
    "upsertBitClawProfile",
    () => {
      getMemoryStore().bitClawProfiles.set(record.id, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "bitClawProfiles")
        .doc(record.id)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function upsertBitClawAgentCredential(
  record: BitClawAgentCredentialRecord,
) {
  return withRepositoryBackend(
    "upsertBitClawAgentCredential",
    () => {
      getMemoryStore().bitClawAgentCredentials.set(record.id, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "bitClawAgentCredentials")
        .doc(record.id)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function listBitClawPosts(
  limit = 80,
  options?: { includeHidden?: boolean },
) {
  return withRepositoryBackend(
    "listBitClawPosts",
    () =>
      [...getMemoryStore().bitClawPosts.values()]
        .filter((item) => options?.includeHidden || !item.isHidden)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit),
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "bitClawPosts")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs
        .map((doc) => doc.data() as BitClawPostRecord)
        .filter((item) => options?.includeHidden || !item.isHidden);
    },
  );
}

export async function upsertBitClawPost(record: BitClawPostRecord) {
  return withRepositoryBackend(
    "upsertBitClawPost",
    () => {
      getMemoryStore().bitClawPosts.set(record.id, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "bitClawPosts")
        .doc(record.id)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function listBitClawCommentsForPostIds(postIds: string[]) {
  const normalizedIds = [...new Set(postIds.map((id) => id.trim()).filter(Boolean))];
  if (!normalizedIds.length) {
    return [];
  }

  return withRepositoryBackend(
    "listBitClawCommentsForPostIds",
    () =>
      [...getMemoryStore().bitClawComments.values()]
        .filter((record) => normalizedIds.includes(record.postId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    async (db) => {
      const chunks = chunkArray(normalizedIds, 10);
      const snapshots = await Promise.all(
        chunks.map((chunk) =>
          getRepositoryCollection(db, "bitClawComments")
            .where("postId", "in", chunk)
            .get(),
        ),
      );

      return snapshots
        .flatMap((snapshot) =>
          snapshot.docs.map((doc) => doc.data() as BitClawCommentRecord),
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  );
}

export async function upsertBitClawComment(record: BitClawCommentRecord) {
  return withRepositoryBackend(
    "upsertBitClawComment",
    () => {
      getMemoryStore().bitClawComments.set(record.id, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "bitClawComments")
        .doc(record.id)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function listBitClawLikeRecordsForPostIds(postIds: string[]) {
  const normalizedIds = [...new Set(postIds.map((id) => id.trim()).filter(Boolean))];
  if (!normalizedIds.length) {
    return [];
  }

  return withRepositoryBackend(
    "listBitClawLikeRecordsForPostIds",
    () =>
      [...getMemoryStore().bitClawLikes.values()]
        .filter((record) => normalizedIds.includes(record.postId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    async (db) => {
      const chunks = chunkArray(normalizedIds, 10);
      const snapshots = await Promise.all(
        chunks.map((chunk) =>
          getRepositoryCollection(db, "bitClawLikes")
            .where("postId", "in", chunk)
            .get(),
        ),
      );

      return snapshots
        .flatMap((snapshot) =>
          snapshot.docs.map((doc) => doc.data() as BitClawLikeRecord),
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  );
}

export async function getBitClawLikeRecord(id: string) {
  return withRepositoryBackend(
    "getBitClawLikeRecord",
    () => getMemoryStore().bitClawLikes.get(id) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "bitClawLikes").doc(id).get();
      return doc.exists ? (doc.data() as BitClawLikeRecord) : null;
    },
  );
}

export async function upsertBitClawLikeRecord(record: BitClawLikeRecord) {
  return withRepositoryBackend(
    "upsertBitClawLikeRecord",
    () => {
      getMemoryStore().bitClawLikes.set(record.id, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "bitClawLikes")
        .doc(record.id)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function deleteBitClawLikeRecord(id: string) {
  return withRepositoryBackend(
    "deleteBitClawLikeRecord",
    () => {
      getMemoryStore().bitClawLikes.delete(id);
      return true;
    },
    async (db) => {
      await getRepositoryCollection(db, "bitClawLikes").doc(id).delete();
      return true;
    },
  );
}

export async function listBitClawFollowRecords() {
  return withRepositoryBackend(
    "listBitClawFollowRecords",
    () =>
      [...getMemoryStore().bitClawFollows.values()].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      ),
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "bitClawFollows").get();
      return snapshot.docs
        .map((doc) => doc.data() as BitClawFollowRecord)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  );
}

export async function getBitClawFollowRecord(id: string) {
  return withRepositoryBackend(
    "getBitClawFollowRecord",
    () => getMemoryStore().bitClawFollows.get(id) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "bitClawFollows").doc(id).get();
      return doc.exists ? (doc.data() as BitClawFollowRecord) : null;
    },
  );
}

export async function upsertBitClawFollowRecord(record: BitClawFollowRecord) {
  return withRepositoryBackend(
    "upsertBitClawFollowRecord",
    () => {
      getMemoryStore().bitClawFollows.set(record.id, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "bitClawFollows")
        .doc(record.id)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function deleteBitClawFollowRecord(id: string) {
  return withRepositoryBackend(
    "deleteBitClawFollowRecord",
    () => {
      getMemoryStore().bitClawFollows.delete(id);
      return true;
    },
    async (db) => {
      await getRepositoryCollection(db, "bitClawFollows").doc(id).delete();
      return true;
    },
  );
}

export async function getSession(id: string) {
  return withRepositoryBackend(
    "getSession",
    () => getMemoryStore().sessions.get(id) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "sessions").doc(id).get();
      return doc.exists ? (doc.data() as SessionRecord) : null;
    },
  );
}

export async function listSessions(wallet: string) {
  return withRepositoryBackend(
    "listSessions",
    () =>
      [...getMemoryStore().sessions.values()]
        .filter((session) => session.wallet === wallet)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "sessions")
        .where("wallet", "==", wallet)
        .orderBy("updatedAt", "desc")
        .get();

      return snapshot.docs.map((doc) => doc.data() as SessionRecord);
    },
  );
}

export async function listRecoverableSessions() {
  return withRepositoryBackend(
    "listRecoverableSessions",
    () =>
      [...getMemoryStore().sessions.values()]
        .filter(
          (session) => session.status === "starting" || session.status === "active",
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "sessions")
        .where("status", "in", ["starting", "active"])
        .get();

      return snapshot.docs
        .map((doc) => doc.data() as SessionRecord)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
  );
}

export async function upsertSession(record: SessionRecord) {
  return withRepositoryBackend(
    "upsertSession",
    () => {
      getMemoryStore().sessions.set(record.id, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "sessions")
        .doc(record.id)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function acquireSessionLease(
  record: SessionRecord,
  ownerId: string,
  ttlMs: number,
) {
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();

  return withRepositoryBackend(
    "acquireSessionLease",
    () => {
      const current = getMemoryStore().sessions.get(record.id) ?? record;
      const currentLeaseExpiresAt = current.runtimeLeaseExpiresAt
        ? new Date(current.runtimeLeaseExpiresAt).getTime()
        : 0;
      const leaseActive =
        current.runtimeOwnerId &&
        current.runtimeOwnerId !== ownerId &&
        currentLeaseExpiresAt > Date.now();
      if (leaseActive) return null;

      const next: SessionRecord = {
        ...current,
        runtimeOwnerId: ownerId,
        runtimeLeaseExpiresAt: expiresAt,
        updatedAt: nowIso(),
      };
      getMemoryStore().sessions.set(next.id, next);
      return next;
    },
    async (db) => {
      const ref = getRepositoryCollection(db, "sessions").doc(record.id);
      return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists ? (snapshot.data() as SessionRecord) : record;
        const currentLeaseExpiresAt = current.runtimeLeaseExpiresAt
          ? new Date(current.runtimeLeaseExpiresAt).getTime()
          : 0;
        const leaseActive =
          current.runtimeOwnerId &&
          current.runtimeOwnerId !== ownerId &&
          currentLeaseExpiresAt > Date.now();
        if (leaseActive) {
          return null;
        }

        const next: SessionRecord = {
          ...current,
          runtimeOwnerId: ownerId,
          runtimeLeaseExpiresAt: expiresAt,
          updatedAt: nowIso(),
        };
        transaction.set(ref, next, { merge: true });
        return next;
      });
    },
  );
}

export async function renewSessionLease(
  sessionId: string,
  ownerId: string,
  ttlMs: number,
) {
  const current = await getSession(sessionId);
  if (!current) return null;
  if (current.runtimeOwnerId && current.runtimeOwnerId !== ownerId) {
    const currentLeaseExpiresAt = current.runtimeLeaseExpiresAt
      ? new Date(current.runtimeLeaseExpiresAt).getTime()
      : 0;
    if (currentLeaseExpiresAt > Date.now()) {
      return null;
    }
  }

  return acquireSessionLease(current, ownerId, ttlMs);
}

export async function markSessionStopped(id: string, lastError?: string) {
  const existing = await getSession(id);
  if (!existing) return null;

  const stoppedAt = nowIso();
  const next: SessionRecord = {
    ...existing,
    status: lastError ? "error" : "stopped",
    lastError,
    updatedAt: stoppedAt,
    stoppedAt,
  };
  delete next.runtimeOwnerId;
  delete next.runtimeLeaseExpiresAt;

  return withRepositoryBackend(
    "markSessionStopped",
    () => {
      getMemoryStore().sessions.set(id, next);
      return next;
    },
    async (db) => {
      await getRepositoryCollection(db, "sessions").doc(id).set(
        {
          ...next,
          runtimeOwnerId: FieldValue.delete(),
          runtimeLeaseExpiresAt: FieldValue.delete(),
        },
        { merge: true },
      );
      return next;
    },
  );
}

export async function upsertLivestreamRequest(record: LivestreamRequestRecord) {
  return withRepositoryBackend(
    "upsertLivestreamRequest",
    () => {
      getMemoryStore().livestreamRequests.set(record.id, record);
      return record;
    },
    async (db) => {
      await getRepositoryCollection(db, "livestreamRequests")
        .doc(record.id)
        .set(record, { merge: true });
      return record;
    },
  );
}

export async function getLivestreamRequest(id: string) {
  return withRepositoryBackend(
    "getLivestreamRequest",
    () => getMemoryStore().livestreamRequests.get(id) ?? null,
    async (db) => {
      const doc = await getRepositoryCollection(db, "livestreamRequests")
        .doc(id)
        .get();
      return doc.exists ? (doc.data() as LivestreamRequestRecord) : null;
    },
  );
}

export async function getLivestreamRequestByMemo(memo: string) {
  return withRepositoryBackend(
    "getLivestreamRequestByMemo",
    () =>
      [...getMemoryStore().livestreamRequests.values()].find(
        (item) => item.memo === memo,
      ) ?? null,
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "livestreamRequests")
        .where("memo", "==", memo)
        .limit(1)
        .get();

      return snapshot.empty
        ? null
        : (snapshot.docs[0].data() as LivestreamRequestRecord);
    },
  );
}

export async function getLivestreamRequestBySignature(signature: string) {
  return withRepositoryBackend(
    "getLivestreamRequestBySignature",
    () =>
      [...getMemoryStore().livestreamRequests.values()].find(
        (item) => item.signature === signature,
      ) ?? null,
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "livestreamRequests")
        .where("signature", "==", signature)
        .limit(1)
        .get();

      return snapshot.empty
        ? null
        : (snapshot.docs[0].data() as LivestreamRequestRecord);
    },
  );
}

function sortLivestreamRequests(
  items: LivestreamRequestRecord[],
  direction: "asc" | "desc" = "asc",
) {
  return items.sort((a, b) =>
    direction === "asc"
      ? a.createdAt.localeCompare(b.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  );
}

export async function listLivestreamRequests(statuses?: LivestreamRequestStatus[]) {
  return withRepositoryBackend(
    "listLivestreamRequests",
    () => {
      const items = [...getMemoryStore().livestreamRequests.values()].filter(
        (item) => !statuses || statuses.includes(item.status),
      );
      return sortLivestreamRequests(items, "asc");
    },
    async (db) => {
      if (statuses?.length === 1) {
        const snapshot = await getRepositoryCollection(db, "livestreamRequests")
          .where("status", "==", statuses[0])
          .orderBy("createdAt", "asc")
          .get();
        return snapshot.docs.map((doc) => doc.data() as LivestreamRequestRecord);
      }

      if (statuses && statuses.length > 1) {
        const snapshot = await getRepositoryCollection(db, "livestreamRequests")
          .where("status", "in", statuses)
          .orderBy("createdAt", "asc")
          .get();
        return snapshot.docs.map((doc) => doc.data() as LivestreamRequestRecord);
      }

      const snapshot = await getRepositoryCollection(db, "livestreamRequests")
        .orderBy("createdAt", "asc")
        .get();
      return snapshot.docs.map((doc) => doc.data() as LivestreamRequestRecord);
    },
  );
}

export async function listLivestreamRequestsForGuest(guestId: string, limit = 10) {
  return withRepositoryBackend(
    "listLivestreamRequestsForGuest",
    () => {
      const items = [...getMemoryStore().livestreamRequests.values()].filter(
        (item) => item.guestId === guestId,
      );
      return sortLivestreamRequests(items, "desc").slice(0, limit);
    },
    async (db) => {
      const snapshot = await getRepositoryCollection(db, "livestreamRequests")
        .where("guestId", "==", guestId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data() as LivestreamRequestRecord);
    },
  );
}
