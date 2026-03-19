import { AutoblowDevice, HandyDevice } from "ive-connect";

import { DeviceCredentials, DeviceProfile, FunscriptPayload, LiveCommand } from "@/lib/types";

const AUTOBLOW_LATENCY_API = "https://latency.autoblowapi.com";

async function requestDevice(
  input: string,
  init: RequestInit,
  failureMessage: string,
) {
  const response = await fetch(input, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `${failureMessage} (${response.status})`);
  }
  return response;
}

export interface RuntimeAdapter {
  readonly id: string;
  readonly type: string;
  readonly supportsLive: boolean;
  readonly supportsScript: boolean;
  connect(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): Promise<Record<string, unknown>>;
  startLive?(command: LiveCommand, points?: Array<{ t: number; x: number }>): Promise<void>;
  updateLive?(command: LiveCommand, points?: Array<{ t: number; x: number }>): Promise<void>;
  startScript?(script: FunscriptPayload, resumeAtMs: number): Promise<void>;
}

async function getAutoblowCluster(deviceToken: string) {
  const response = await fetch(`${AUTOBLOW_LATENCY_API}/autoblow/connected`, {
    headers: { "x-device-token": deviceToken },
  });
  if (!response.ok) {
    throw new Error("Autoblow device not connected");
  }
  const payload = (await response.json()) as { connected: boolean; cluster: string };
  if (!payload.connected || !payload.cluster) {
    throw new Error("Autoblow device cluster unavailable");
  }
  return payload.cluster.startsWith("http") ? payload.cluster : `https://${payload.cluster}`;
}

class AutoblowRuntimeAdapter implements RuntimeAdapter {
  readonly type = "autoblow";
  readonly supportsLive = true;
  readonly supportsScript = true;
  private readonly device: AutoblowDevice;
  private clusterUrl: string | null = null;
  private connected = false;

  constructor(public readonly id: string, private readonly credentials: DeviceCredentials) {
    this.device = new AutoblowDevice({
      deviceToken: credentials.deviceToken ?? "",
    });
  }

  async connect() {
    if (this.connected) return;
    this.clusterUrl = await getAutoblowCluster(this.credentials.deviceToken ?? "");
    const ok = await this.device.connect();
    if (!ok) {
      throw new Error("Failed to connect Autoblow device");
    }
    this.connected = true;
  }

  async stop() {
    if (this.clusterUrl) {
      await requestDevice(
        `${this.clusterUrl}/autoblow/oscillate/stop`,
        {
          method: "PUT",
          headers: { "x-device-token": this.credentials.deviceToken ?? "" },
        },
        "Failed to stop Autoblow device",
      ).catch(() => null);
    }
    if (this.connected) {
      await this.device.stop().catch(() => false);
    }
  }

  async getStatus() {
    await this.connect();
    const state = await this.device.getState();
    return {
      connected: this.connected,
      state,
    };
  }

  async startLive(command: LiveCommand) {
    await this.updateLive(command);
  }

  async updateLive(command: LiveCommand) {
    await this.connect();
    if (!this.clusterUrl) throw new Error("Autoblow cluster unavailable");
    await requestDevice(
      `${this.clusterUrl}/autoblow/oscillate`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-device-token": this.credentials.deviceToken ?? "",
        },
        body: JSON.stringify({
          speed: command.speed,
          minY: command.minY,
          maxY: command.maxY,
        }),
      },
      "Failed to update Autoblow live motion",
    );
  }

  async startScript(script: FunscriptPayload, resumeAtMs: number) {
    await this.connect();
    const result = await this.device.prepareScript(script);
    if (!result.success) {
      throw new Error(result.error ?? "Failed to prepare Autoblow script");
    }
    const ok = await this.device.play(resumeAtMs, 1, true);
    if (!ok) throw new Error("Failed to start Autoblow script playback");
  }
}

class HandyRuntimeAdapter implements RuntimeAdapter {
  readonly type = "handy";
  readonly supportsLive = true;
  readonly supportsScript = true;
  private readonly device: HandyDevice;
  private connected = false;
  private hspReady = false;

  constructor(public readonly id: string, private readonly credentials: DeviceCredentials) {
    this.device = new HandyDevice({
      connectionKey: credentials.connectionKey ?? "",
      applicationId: "GoonClaw",
    });
  }

  async connect() {
    if (this.connected) return;
    const ok = await this.device.connect();
    if (!ok) throw new Error("Failed to connect Handy device");
    this.connected = true;
  }

  async stop() {
    await this.connect();
    await this.device.hspStop().catch(() => null);
    await this.device.stop().catch(() => false);
    this.hspReady = false;
  }

  async getStatus() {
    await this.connect();
    return {
      connected: this.connected,
      info: this.device.getDeviceInfo(),
      hspState: this.device.hspState,
    };
  }

  async startLive(command: LiveCommand, points?: Array<{ t: number; x: number }>) {
    await this.connect();
    if (!this.hspReady) {
      await this.device.hspSetup();
      this.hspReady = true;
    }
    await this.device.hspAddPoints(points ?? [], true);
    await this.device.hspPlay(0, { pauseOnStarving: true, loop: false });
    await this.device.hspSetPlaybackRate(Math.max(command.speed / 60, 0.2));
  }

  async updateLive(command: LiveCommand, points?: Array<{ t: number; x: number }>) {
    await this.connect();
    if (!this.hspReady) {
      await this.startLive(command, points);
      return;
    }
    await this.device.hspAddPoints(points ?? [], false);
    await this.device.hspSetPlaybackRate(Math.max(command.speed / 60, 0.2));
  }

  async startScript(script: FunscriptPayload, resumeAtMs: number) {
    await this.connect();
    const result = await this.device.prepareScript(script);
    if (!result.success) {
      throw new Error(result.error ?? "Failed to prepare Handy script");
    }
    const ok = await this.device.play(resumeAtMs, 1, true);
    if (!ok) throw new Error("Failed to start Handy script");
  }
}

class RestRuntimeAdapter implements RuntimeAdapter {
  readonly type = "rest";
  readonly supportsLive = true;
  readonly supportsScript = false;

  constructor(public readonly id: string, private readonly credentials: DeviceCredentials) {}

  async connect() {
    if (!this.credentials.endpointUrl) {
      throw new Error("REST device endpoint URL is required");
    }
  }

  private buildHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.credentials.extraHeaders ?? {}),
    };
    if (this.credentials.authToken) {
      headers[this.credentials.authHeaderName || "Authorization"] =
        this.credentials.authHeaderName === "Authorization"
          ? `Bearer ${this.credentials.authToken}`
          : this.credentials.authToken;
    }
    return headers;
  }

  async stop() {
    await this.connect();
    await requestDevice(
      this.credentials.endpointUrl!,
      {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({
          action: "stop",
          timestamp: new Date().toISOString(),
        }),
      },
      "Failed to stop REST device",
    );
  }

  async getStatus() {
    await this.connect();
    const response = await fetch(this.credentials.endpointUrl!, {
      method: "OPTIONS",
      headers: this.buildHeaders(),
    });
    if (!response.ok && response.status !== 405) {
      const body = await response.text().catch(() => "");
      throw new Error(body || `REST endpoint probe failed (${response.status})`);
    }

    return {
      connected: true,
      endpointUrl: this.credentials.endpointUrl,
      status: response.status,
    };
  }

  async startLive(command: LiveCommand) {
    await this.updateLive(command);
  }

  async updateLive(command: LiveCommand) {
    await this.connect();
    await requestDevice(
      this.credentials.endpointUrl!,
      {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify({
          action: "live",
          mode: "live",
          speed: command.speed,
          amplitude: command.amplitude,
          minY: command.minY,
          maxY: command.maxY,
          position: command.position,
          timestamp: new Date().toISOString(),
        }),
      },
      "Failed to update REST live motion",
    );
  }
}

export function createRuntimeAdapter(profile: DeviceProfile, credentials: DeviceCredentials): RuntimeAdapter {
  switch (profile.type) {
    case "autoblow":
      return new AutoblowRuntimeAdapter(profile.id, credentials);
    case "handy":
      return new HandyRuntimeAdapter(profile.id, credentials);
    case "rest":
      return new RestRuntimeAdapter(profile.id, credentials);
    default:
      throw new Error(`Unsupported device type: ${profile.type}`);
  }
}
