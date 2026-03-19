import { describe, expect, it } from "vitest";

import { decryptJson, encryptJson } from "@/lib/server/crypto";

describe("device credential crypto", () => {
  it("round-trips encrypted payloads", () => {
    const original = {
      endpointUrl: "https://device.example/api/live",
      authToken: "secret-token",
      authHeaderName: "Authorization",
    };

    const ciphertext = encryptJson(original);

    expect(ciphertext).not.toContain("secret-token");
    expect(decryptJson<typeof original>(ciphertext)).toEqual(original);
  });

  it("produces different ciphertext for the same payload", () => {
    const payload = { connectionKey: "handy-key" };

    const first = encryptJson(payload);
    const second = encryptJson(payload);

    expect(first).not.toEqual(second);
    expect(decryptJson(first)).toEqual(payload);
    expect(decryptJson(second)).toEqual(payload);
  });
});
