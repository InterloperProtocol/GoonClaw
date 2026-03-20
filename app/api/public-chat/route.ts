import { NextResponse } from "next/server";

import {
  generatePublicChatReply,
  reservePublicChatTurn,
  sanitizePublicChatMessages,
} from "@/lib/server/public-chat";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: Array<{
        role?: "user" | "assistant";
        content?: string;
      }>;
    };

    const messages = sanitizePublicChatMessages(
      (body.messages ?? []).map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content ?? "",
      })),
    );

    if (!messages.length || messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json(
        { error: "Send a user message to continue the chat" },
        { status: 400 },
      );
    }

    const turn = await reservePublicChatTurn();
    if (!turn.allowed) {
      return NextResponse.json(
        {
          error: "You have reached the 20-message limit for the current 24-hour window.",
          remainingMessages: turn.remainingMessages,
          resetAt: turn.resetAt,
        },
        { status: 429 },
      );
    }

    const reply = await generatePublicChatReply(messages);
    return NextResponse.json({
      reply,
      remainingMessages: turn.remainingMessages,
      resetAt: turn.resetAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The public chat could not answer right now.",
      },
      { status: 500 },
    );
  }
}
