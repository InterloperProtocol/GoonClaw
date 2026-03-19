"use client";

import { useEffect, useMemo, useState } from "react";

type EmbedConfig =
  | {
      kind: "video";
      src: string;
    }
  | {
      kind: "iframe";
      src: string;
    };

function extractYouTubeId(url: URL) {
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.split("/").filter(Boolean)[0] ?? "";
  }

  if (url.pathname.startsWith("/shorts/")) {
    return url.pathname.split("/")[2] ?? "";
  }

  return url.searchParams.get("v") ?? "";
}

function buildEmbedConfig(value: string, parentHost: string): EmbedConfig | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const lowerHost = url.hostname.toLowerCase();

    if (lowerHost.includes("youtube.com") || lowerHost.includes("youtu.be")) {
      const id = extractYouTubeId(url);
      return id
        ? {
            kind: "iframe" as const,
            src: `https://www.youtube.com/embed/${id}`,
          }
        : null;
    }

    if (lowerHost.includes("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id
        ? {
            kind: "iframe" as const,
            src: `https://player.vimeo.com/video/${id}`,
          }
        : null;
    }

    if (lowerHost.includes("twitch.tv")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "videos" && parts[1]) {
        return {
          kind: "iframe",
          src: `https://player.twitch.tv/?video=v${parts[1]}&parent=${parentHost}`,
        };
      }

      if (parts[0]) {
        return {
          kind: "iframe",
          src: `https://player.twitch.tv/?channel=${parts[0]}&parent=${parentHost}`,
        };
      }
    }

    if (/\.(mp4|webm|ogg|mov|m3u8)(\?|$)/i.test(url.pathname)) {
      return {
        kind: "video" as const,
        src: url.toString(),
      };
    }

    return {
      kind: "iframe" as const,
      src: url.toString(),
    };
  } catch {
    return null;
  }
}

export function MediaEmbedPanel({
  title,
  eyebrow = "Media",
  description,
  defaultUrl = "",
  storageKey,
  readOnly = false,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  defaultUrl?: string;
  storageKey: string;
  readOnly?: boolean;
}) {
  const [draftUrl, setDraftUrl] = useState(defaultUrl);
  const [activeUrl, setActiveUrl] = useState(defaultUrl);
  const [parentHost, setParentHost] = useState("localhost");

  useEffect(() => {
    if (typeof window === "undefined") return;

    setParentHost(window.location.hostname || "localhost");

    if (readOnly) {
      setDraftUrl(defaultUrl);
      setActiveUrl(defaultUrl);
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    const next = stored || defaultUrl;
    setDraftUrl(next);
    setActiveUrl(next);
  }, [defaultUrl, readOnly, storageKey]);

  const embed = useMemo(
    () => buildEmbedConfig(activeUrl, parentHost),
    [activeUrl, parentHost],
  );

  function applyUrl() {
    setActiveUrl(draftUrl.trim());
    if (typeof window !== "undefined" && !readOnly) {
      window.localStorage.setItem(storageKey, draftUrl.trim());
    }
  }

  function clearUrl() {
    setDraftUrl("");
    setActiveUrl("");
    if (typeof window !== "undefined" && !readOnly) {
      window.localStorage.removeItem(storageKey);
    }
  }

  return (
    <section className="panel media-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>

      {description ? <p className="hero-summary compact">{description}</p> : null}

      {!readOnly ? (
        <div className="media-toolbar">
          <label className="field">
            <span>Video or stream URL</span>
            <input
              value={draftUrl}
              onChange={(event) => setDraftUrl(event.target.value)}
              placeholder="Paste YouTube, Twitch, Vimeo, MP4, HLS, or iframe-ready URL"
            />
          </label>
          <div className="button-row">
            <button className="button button-primary small" onClick={applyUrl} type="button">
              Load Media
            </button>
            <button className="button button-ghost small" onClick={clearUrl} type="button">
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {embed ? (
        embed.kind === "video" ? (
          <div className="embed-shell">
            <video
              className="media-video"
              controls
              playsInline
              src={embed.src}
            />
          </div>
        ) : (
          <div className="embed-shell">
            <iframe
              src={embed.src}
              className="embed-frame"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )
      ) : (
        <div className="embed-placeholder">
          <strong>No media source loaded yet.</strong>
          <p>
            Paste any direct video file or stream/embed URL. Some third-party
            sites may block iframing, but YouTube, Twitch, Vimeo, and direct
            video files should work cleanly.
          </p>
        </div>
      )}
    </section>
  );
}
