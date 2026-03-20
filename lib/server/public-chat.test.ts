import { describe, expect, it } from "vitest";

import { sanitizePublicChatMessages } from "@/lib/server/public-chat";

describe("public chat sanitization", () => {
  it("keeps only valid roles, trims content, and limits context depth", () => {
    const messages = sanitizePublicChatMessages(
      Array.from({ length: 15 }, (_, index) => ({
        role: index % 2 === 0 ? "user" : "assistant",
        content: `  message ${index}  `,
      })),
    );

    expect(messages).toHaveLength(12);
    expect(messages[0]?.content).toBe("message 3");
    expect(messages.at(-1)?.content).toBe("message 14");
  });
});
