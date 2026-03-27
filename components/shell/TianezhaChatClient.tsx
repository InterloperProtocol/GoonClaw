"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { TianezhaOpportunityCard } from "@/components/shell/TianezhaOpportunityCard";
import { TianezhaQuestPanel } from "@/components/shell/TianezhaQuestPanel";
import type { SimChainSummary } from "@/lib/server/sim-chain";
import type { TianezhaOpportunity } from "@/lib/tianshi/opportunityEngine";
import type { TianezhaQuest } from "@/lib/tianshi/trainingBuilder";

type Message = {
  content: string;
  role: "assistant" | "user";
};

type RuntimeSummary = {
  note: string | null;
  simulationEnabled: boolean;
};

type StoredChatState = {
  messages: Message[];
  opportunities: TianezhaOpportunity[];
  quests: TianezhaQuest[];
  runtime: RuntimeSummary | null;
  simChain: SimChainSummary | null;
};

type TianezhaChatClientProps = {
  contextKey?: string;
  heading?: string;
  initialMessage: string;
  initialOpportunities?: TianezhaOpportunity[];
  initialQuests?: TianezhaQuest[];
  initialRuntime?: RuntimeSummary | null;
  initialSimChain?: SimChainSummary | null;
  placeholder?: string;
  variant?: "default" | "rail";
};

function buildSeedState({
  initialMessage,
  initialOpportunities,
  initialQuests,
  initialRuntime,
  initialSimChain,
}: Pick<
  TianezhaChatClientProps,
  "initialMessage" | "initialOpportunities" | "initialQuests" | "initialRuntime" | "initialSimChain"
>): StoredChatState {
  return {
    messages: [
      {
        content: initialMessage,
        role: "assistant",
      },
    ],
    opportunities: initialOpportunities || [],
    quests: initialQuests || [],
    runtime: initialRuntime || null,
    simChain: initialSimChain || null,
  };
}

export function TianezhaChatClient({
  contextKey = "anonymous",
  heading = "Ask Tianezha what the world sees",
  initialMessage,
  initialOpportunities = [],
  initialQuests = [],
  initialRuntime = null,
  initialSimChain = null,
  placeholder = "What is live right now?",
  variant = "default",
}: TianezhaChatClientProps) {
  const storageKey = useMemo(() => `tianezha-chat:${contextKey}`, [contextKey]);
  const seededState = useMemo(
    () =>
      buildSeedState({
        initialMessage,
        initialOpportunities,
        initialQuests,
        initialRuntime,
        initialSimChain,
      }),
    [initialMessage, initialOpportunities, initialQuests, initialRuntime, initialSimChain],
  );
  const [messages, setMessages] = useState<Message[]>(seededState.messages);
  const [opportunities, setOpportunities] = useState<TianezhaOpportunity[]>(
    seededState.opportunities,
  );
  const [quests, setQuests] = useState<TianezhaQuest[]>(seededState.quests);
  const [runtime, setRuntime] = useState<RuntimeSummary | null>(seededState.runtime);
  const [simChain, setSimChain] = useState<SimChainSummary | null>(seededState.simChain);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      setMessages(seededState.messages);
      setOpportunities(seededState.opportunities);
      setQuests(seededState.quests);
      setRuntime(seededState.runtime);
      setSimChain(seededState.simChain);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredChatState>;
      setMessages(parsed.messages?.length ? parsed.messages : seededState.messages);
      setOpportunities(parsed.opportunities || seededState.opportunities);
      setQuests(parsed.quests || seededState.quests);
      setRuntime(parsed.runtime || seededState.runtime);
      setSimChain(parsed.simChain || seededState.simChain);
    } catch {
      setMessages(seededState.messages);
      setOpportunities(seededState.opportunities);
      setQuests(seededState.quests);
      setRuntime(seededState.runtime);
      setSimChain(seededState.simChain);
    }
  }, [seededState, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        messages,
        opportunities,
        quests,
        runtime,
        simChain,
      } satisfies StoredChatState),
    );
  }, [messages, opportunities, quests, runtime, simChain, storageKey]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextMessage = value.trim();
    if (!nextMessage) {
      return;
    }

    setError(null);
    setMessages((current) => [...current, { content: nextMessage, role: "user" }]);
    setValue("");

    startTransition(async () => {
      const response = await fetch("/api/tianezha/chat", {
        body: JSON.stringify({ message: nextMessage }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        opportunities?: TianezhaOpportunity[];
        quests?: TianezhaQuest[];
        reply?: string;
        runtime?: RuntimeSummary;
        simChain?: SimChainSummary;
      };
      if (!response.ok || !payload.reply) {
        setError(payload.error || "Unable to answer right now.");
        return;
      }

      setMessages((current) => [...current, { content: payload.reply!, role: "assistant" }]);
      setOpportunities(payload.opportunities || []);
      setQuests(payload.quests || []);
      setRuntime(payload.runtime || null);
      setSimChain(payload.simChain || null);
    });
  }

  return (
    <section
      className={
        variant === "rail"
          ? "panel chat-shell-panel chat-shell-panel-rail"
          : "panel chat-shell-panel"
      }
    >
      <div className="panel-header">
        <div>
          <p className="eyebrow">Tianezha chat</p>
          <h2>{heading}</h2>
        </div>
      </div>

      <div className="chat-shell-feed">
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={message.role === "assistant" ? "chat-bubble assistant" : "chat-bubble user"}
          >
            <span>{message.role === "assistant" ? "Tianezha" : "You"}</span>
            <p>{message.content}</p>
          </article>
        ))}
      </div>

      {runtime || simChain ? (
        <article className="mini-item-card chat-shell-meta">
          <div>
            <span>{runtime?.simulationEnabled ? "live brain" : "paused brain"}</span>
            <strong>
              {runtime?.simulationEnabled
                ? "Tianshi can issue live opportunities"
                : "Tianshi is frozen until the admin enables it"}
            </strong>
          </div>
          <p className="route-summary compact">
            {simChain
              ? `Every ${simChain.blockIntervalMinutes} minutes the world tracks a ${Math.round(simChain.proofOfStakeShare * 100)}% holder lane and a ${Math.round(simChain.userRewardShare * 100)}% player lane.`
              : runtime?.note || "The left panel keeps the world state readable."}
          </p>
        </article>
      ) : null}

      {opportunities.length ? (
        <div className="mini-list chat-opportunity-list">
          {opportunities.map((opportunity) => (
            <TianezhaOpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : null}

      {quests.length ? <TianezhaQuestPanel quests={quests} /> : null}

      <form className="chat-shell-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Message</span>
          <textarea
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            value={value}
          />
        </label>
        <div className="chat-shell-actions">
          <button className="button button-primary" disabled={isPending} type="submit">
            {isPending ? "Thinking..." : "Send"}
          </button>
          <Link className="button button-secondary" href="/tianshi">
            Open Tianshi
          </Link>
          {error ? <p className="error-banner">{error}</p> : null}
        </div>
      </form>
    </section>
  );
}
