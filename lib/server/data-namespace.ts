import path from "node:path";

import type { CollectionReference, Firestore } from "firebase-admin/firestore";

const DEFAULT_FIRESTORE_ROOT_COLLECTION = "tianezhaEnvironments";
const DEFAULT_MAINNET_NAMESPACE = "mainnet";
const DEFAULT_TESTNET_NAMESPACE = "testnet";
const VALID_NAMESPACE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function normalizeNamespaceCandidate(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/_/g, "-") || "";
}

function getDefaultNamespace(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "production"
    ? DEFAULT_MAINNET_NAMESPACE
    : DEFAULT_TESTNET_NAMESPACE;
}

export function resolveTianezhaDataNamespace(
  rawNamespace = process.env.TIANEZHA_DATA_NAMESPACE,
  nodeEnv = process.env.NODE_ENV,
) {
  const namespace =
    normalizeNamespaceCandidate(rawNamespace) || getDefaultNamespace(nodeEnv);

  if (!VALID_NAMESPACE_PATTERN.test(namespace)) {
    throw new Error(
      `TIANEZHA_DATA_NAMESPACE must match ${VALID_NAMESPACE_PATTERN.source}; received "${namespace}".`,
    );
  }

  return namespace;
}

export function getTianezhaDataNamespace() {
  return resolveTianezhaDataNamespace();
}

export function resolveTianezhaFirestoreRootCollection(
  rawCollection = process.env.TIANEZHA_FIRESTORE_ROOT_COLLECTION,
) {
  const collection = rawCollection?.trim() || DEFAULT_FIRESTORE_ROOT_COLLECTION;

  if (!collection || collection.includes("/")) {
    throw new Error(
      `TIANEZHA_FIRESTORE_ROOT_COLLECTION must be a single collection id; received "${collection}".`,
    );
  }

  return collection;
}

export function getTianezhaFirestoreRootCollection() {
  return resolveTianezhaFirestoreRootCollection();
}

export function getScopedFirestoreCollection(
  db: Firestore,
  collectionName: string,
): CollectionReference {
  return db
    .collection(getTianezhaFirestoreRootCollection())
    .doc(getTianezhaDataNamespace())
    .collection(collectionName);
}

export function getNamespacedFilePath(
  filePath: string,
  namespace = getTianezhaDataNamespace(),
) {
  const parsed = path.parse(filePath);
  if (parsed.name.endsWith(`.${namespace}`)) {
    return filePath;
  }

  const extension = parsed.ext || ".db";
  return path.join(parsed.dir, `${parsed.name}.${namespace}${extension}`);
}
