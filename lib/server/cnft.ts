import { getServerEnv } from "@/lib/env";

type UmiLike = {
  use(plugin: unknown): UmiLike;
  eddsa: {
    createKeypairFromSecretKey(secretKey: Uint8Array): unknown;
  };
};

type SignerLike = {
  publicKey: unknown;
};

type UmiBundleModule = {
  createUmi(endpoint: string): UmiLike;
};

type UmiLibModule = {
  createSignerFromKeypair(umi: UmiLike, keypair: unknown): SignerLike;
  keypairIdentity(signer: SignerLike): unknown;
  publicKey(value: string): unknown;
  some(value: unknown): unknown;
};

type BubblegumModule = {
  mplBubblegum(): unknown;
  mintV1(
    umi: UmiLike,
    input: Record<string, unknown>,
  ): {
    sendAndConfirm(umi: UmiLike): Promise<{ signature: Uint8Array | number[] }>;
  };
};

type MetadataModule = {
  mplTokenMetadata(): unknown;
};

function parseSecret(secret: string) {
  if (!secret) {
    throw new Error("ACCESS_CNFT_AUTHORITY_SECRET is not configured");
  }

  const trimmed = secret.trim();
  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed) as number[]);
  }

  return Uint8Array.from(Buffer.from(trimmed, "base64"));
}

export async function mintAccessCnft(wallet: string) {
  const env = getServerEnv();
  if (!env.ACCESS_CNFT_COLLECTION || !env.ACCESS_CNFT_TREE) {
    throw new Error("cNFT collection and tree must be configured");
  }

  const umiBundle = (await import(
    "@metaplex-foundation/umi-bundle-defaults"
  )) as unknown as UmiBundleModule;
  const umiLib = (await import(
    "@metaplex-foundation/umi"
  )) as unknown as UmiLibModule;
  const bubblegum = (await import(
    "@metaplex-foundation/mpl-bubblegum"
  )) as unknown as BubblegumModule;
  const metadata = (await import(
    "@metaplex-foundation/mpl-token-metadata"
  )) as unknown as MetadataModule;

  const umi = umiBundle.createUmi(env.SOLANA_RPC_URL)
    .use(bubblegum.mplBubblegum())
    .use(metadata.mplTokenMetadata());

  const authoritySecret = parseSecret(env.ACCESS_CNFT_AUTHORITY_SECRET);
  const keypair = umi.eddsa.createKeypairFromSecretKey(authoritySecret);
  const signer = umiLib.createSignerFromKeypair(umi, keypair);
  umi.use(umiLib.keypairIdentity(signer));

  const result = await bubblegum.mintV1(umi, {
    leafOwner: umiLib.publicKey(wallet),
    merkleTree: umiLib.publicKey(env.ACCESS_CNFT_TREE),
    collectionMint: umiLib.publicKey(env.ACCESS_CNFT_COLLECTION),
    collectionAuthority: signer,
    metadata: {
      name: env.ACCESS_CNFT_NAME,
      uri: env.ACCESS_CNFT_METADATA_URI,
      sellerFeeBasisPoints: 0,
      collection: umiLib.some({
        key: umiLib.publicKey(env.ACCESS_CNFT_COLLECTION),
        verified: false,
      }),
      creators: [
        {
          address: signer.publicKey,
          verified: true,
          share: 100,
        },
      ],
    },
  }).sendAndConfirm(umi);

  return {
    signature: Buffer.from(result.signature).toString("base64"),
  };
}
