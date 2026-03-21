import { NextRequest, NextResponse } from "next/server";

import { decryptJson } from "@/lib/server/crypto";
import { createRuntimeAdapter } from "@/lib/server/devices";
import { getOrCreateGuestSession } from "@/lib/server/guest";
import { assertGuestEnabled } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";
import { getDevice } from "@/lib/server/repository";
import { DeviceCredentials } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  try {
    assertSameOriginMutation(request);
    const session = await getOrCreateGuestSession();
    const denied = await assertGuestEnabled(session.id)
      .then(() => null)
      .catch((error) =>
        NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "This user has been disabled by the admin.",
          },
          { status: 403 },
        ),
      );
    if (denied) return denied;

    const { deviceId } = await params;
    const device = await getDevice(session.id, deviceId);
    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    const adapter = createRuntimeAdapter(
      device,
      decryptJson<DeviceCredentials>(device.encryptedCredentials),
    );
    await adapter.connect();
    const status = await adapter.getStatus();
    await adapter.stop();
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Device test failed" },
      {
        status:
          error instanceof Error && error.message.includes("Cross-") ? 403 : 400,
      },
    );
  }
}
