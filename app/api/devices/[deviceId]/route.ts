import { NextRequest, NextResponse } from "next/server";

import { encryptJson } from "@/lib/server/crypto";
import { getOrCreateGuestSession } from "@/lib/server/guest";
import { assertGuestEnabled } from "@/lib/server/internal-admin";
import {
  assertSafeRestEndpointUrl,
  assertSameOriginMutation,
} from "@/lib/server/request-security";
import { deleteDevice, getDevice, upsertDevice } from "@/lib/server/repository";
import { DeviceCredentials } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export async function PATCH(
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
    const existing = await getDevice(session.id, deviceId);
    if (!existing) {
      return NextResponse.json(
        { error: "Device not found" },
        { status: 404 },
      );
    }

    const body = (await request.json()) as {
      label?: string;
      credentials?: DeviceCredentials;
    };

    const sanitizedCredentials = body.credentials
      ? {
          ...body.credentials,
          endpointUrl:
            existing.type === "rest" && body.credentials.endpointUrl?.trim()
              ? await assertSafeRestEndpointUrl(body.credentials.endpointUrl)
              : body.credentials.endpointUrl?.trim(),
        }
      : null;

    const next = {
      ...existing,
      label: body.label?.trim() || existing.label,
      encryptedCredentials: sanitizedCredentials
        ? encryptJson(sanitizedCredentials)
        : existing.encryptedCredentials,
      updatedAt: nowIso(),
    };

    const saved = await upsertDevice(next);
    return NextResponse.json({ item: saved });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update device",
      },
      {
        status:
          error instanceof Error && error.message.includes("Cross-") ? 403 : 400,
      },
    );
  }
}

export async function DELETE(
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
    const deleted = await deleteDevice(session.id, deviceId);
    return NextResponse.json({ ok: deleted });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete device",
      },
      {
        status:
          error instanceof Error && error.message.includes("Cross-") ? 403 : 400,
      },
    );
  }
}
