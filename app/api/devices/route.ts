import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { encryptJson } from "@/lib/server/crypto";
import { getOrCreateGuestSession } from "@/lib/server/guest";
import { assertGuestEnabled } from "@/lib/server/internal-admin";
import {
  assertSafeRestEndpointUrl,
  assertSameOriginMutation,
} from "@/lib/server/request-security";
import { listDevices, upsertDevice } from "@/lib/server/repository";
import { DeviceCredentials, DeviceProfile, DeviceType } from "@/lib/types";
import { nowIso } from "@/lib/utils";

function supports(type: DeviceType) {
  switch (type) {
    case "autoblow":
    case "handy":
      return { supportsLive: true, supportsScript: true };
    case "rest":
      return { supportsLive: true, supportsScript: false };
    default:
      return { supportsLive: false, supportsScript: false };
  }
}

async function validateDevicePayload(
  type: DeviceType,
  label: string,
  credentials: DeviceCredentials,
) {
  if (!label.trim()) {
    return "Device label is required";
  }

  switch (type) {
    case "autoblow":
      return credentials.deviceToken?.trim()
        ? null
        : "Autoblow requires a device token";
    case "handy":
      return credentials.connectionKey?.trim()
        ? null
        : "Handy requires a connection key";
    case "rest":
      if (!credentials.endpointUrl?.trim()) {
        return "REST devices require an endpoint URL";
      }

      await assertSafeRestEndpointUrl(credentials.endpointUrl);
      return null;
    default:
      return "Unsupported device type";
  }
}

export async function GET() {
  try {
    const session = await getOrCreateGuestSession();
    await assertGuestEnabled(session.id);
    const devices = await listDevices(session.id);
    return NextResponse.json({ items: devices });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load devices",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    const session = await getOrCreateGuestSession();
    await assertGuestEnabled(session.id);

    const body = (await request.json()) as {
      type?: DeviceType;
      label?: string;
      credentials?: DeviceCredentials;
    };

    if (!body.type || !body.label || !body.credentials) {
      return NextResponse.json(
        { error: "type, label, and credentials are required" },
        { status: 400 },
      );
    }

    const validationError = validateDevicePayload(
      body.type,
      body.label,
      body.credentials,
    );
    const resolvedValidationError = await validationError;
    if (resolvedValidationError) {
      return NextResponse.json({ error: resolvedValidationError }, { status: 400 });
    }

    const endpointUrl =
      body.type === "rest" && body.credentials.endpointUrl
        ? await assertSafeRestEndpointUrl(body.credentials.endpointUrl)
        : body.credentials.endpointUrl?.trim();

    const profile: DeviceProfile = {
      id: randomUUID(),
      wallet: session.id,
      type: body.type,
      label: body.label.trim(),
      encryptedCredentials: encryptJson({
        deviceToken: body.credentials.deviceToken?.trim(),
        connectionKey: body.credentials.connectionKey?.trim(),
        endpointUrl,
        authToken: body.credentials.authToken?.trim(),
        authHeaderName: body.credentials.authHeaderName?.trim(),
        extraHeaders: body.credentials.extraHeaders,
      }),
      ...supports(body.type),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    const saved = await upsertDevice(profile);
    return NextResponse.json({ item: saved });
  } catch (error) {
    const status =
      error instanceof Error &&
      error.message.includes("Cross-")
        ? 403
        : 500;
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save device",
      },
      { status },
    );
  }
}
