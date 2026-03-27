import { NextResponse } from "next/server";

import { assertSameOriginMutation } from "@/lib/server/request-security";
import {
  getBitClawMainState,
  getBolClawState,
  getCurrentLoadedIdentity,
  getNezhaState,
  getTianziState,
  upsertBotBindingForCurrentLoadedIdentity,
} from "@/lib/server/tianezha-simulation";

type PublicBotCommand =
  | "bind_chat"
  | "view_feed"
  | "view_markets"
  | "view_nezha"
  | "view_profile";

export async function GET() {
  try {
    const [loadedIdentity, tianzi, nezha, bolclaw] = await Promise.all([
      getCurrentLoadedIdentity(),
      getTianziState(),
      getNezhaState(),
      getBolClawState(),
    ]);

    return NextResponse.json({
      actions: ["bind_chat", "view_profile", "view_markets", "view_nezha", "view_feed"],
      loadedIdentity,
      preview: {
        bolclaw: bolclaw.feed.slice(0, 4),
        nezha: nezha.markets.slice(0, 2),
        tianzi: {
          book: tianzi.book,
          question: tianzi.question,
        },
      },
      transport: "telegram-adapter",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load the public bot summary.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    const payload = (await request.json()) as {
      command?: PublicBotCommand;
      displayName?: string;
      externalUserId?: string;
    };

    if (!payload.command) {
      return NextResponse.json({ error: "A bot command is required." }, { status: 400 });
    }

    if (payload.command === "bind_chat") {
      if (!payload.externalUserId?.trim()) {
        return NextResponse.json({ error: "externalUserId is required." }, { status: 400 });
      }

      const binding = await upsertBotBindingForCurrentLoadedIdentity({
        displayName: payload.displayName?.trim() || null,
        externalUserId: payload.externalUserId,
        platform: "telegram",
      });

      return NextResponse.json({ binding, ok: true });
    }

    if (payload.command === "view_profile") {
      const [loadedIdentity, bitclaw] = await Promise.all([
        getCurrentLoadedIdentity(),
        getBitClawMainState(),
      ]);
      return NextResponse.json({
        bitclaw: {
          loadedIdentity,
          profiles: bitclaw.profiles.slice(0, 6),
        },
        ok: true,
      });
    }

    if (payload.command === "view_markets") {
      const tianzi = await getTianziState();
      return NextResponse.json({ ok: true, tianzi });
    }

    if (payload.command === "view_nezha") {
      const nezha = await getNezhaState();
      return NextResponse.json({ nezha, ok: true });
    }

    if (payload.command === "view_feed") {
      const bolclaw = await getBolClawState();
      return NextResponse.json({ feed: bolclaw.feed.slice(0, 8), ok: true });
    }

    return NextResponse.json({ error: "Unsupported bot command." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't run the public bot command.";
    const status = message.includes("Cross-") ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
