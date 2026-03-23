import type { Metadata } from "next";
import Link from "next/link";

import { SiteNav } from "@/components/SiteNav";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getGoonclawDoc,
  getGoonclawDocHref,
  getGoonclawDocsBySection,
} from "@/lib/goonclaw-docs";

export const metadata: Metadata = {
  title: "Docs | GoonClaw",
  description: "Operator, builder, API, and FAQ docs for GoonClaw.",
};

const faqSlug = ["support", "goonclaw-faq"];

export default function GoonclawDocsIndexPage() {
  const docsBySection = getGoonclawDocsBySection();
  const faqDoc = getGoonclawDoc(faqSlug);
  const faqItems =
    faqDoc?.blocks
      .filter((block) => block.id !== "intro")
      .slice(0, 6)
      .map((block) => ({
        answer: block.body?.[0] || "",
        question: block.heading,
      })) || [];

  return (
    <div className="app-shell">
      <SiteNav />

      <section className="panel home-hero-panel">
        <div className="home-hero-copy">
          <p className="eyebrow">Docs</p>
          <h1>Operator docs, builder docs, and the FAQ are back.</h1>
          <p className="route-summary">
            This is the docs front door for GoonClaw. Start here for product context,
            integration references, and the plain-language FAQ.
          </p>
          <div className="route-badges">
            <StatusBadge tone="success">Docs restored</StatusBadge>
            <StatusBadge tone="accent">FAQ live</StatusBadge>
            <StatusBadge tone="warning">Machine docs linked</StatusBadge>
          </div>
          <div className="home-cta-row">
            <Link
              className="button button-primary home-uniform-button"
              href={getGoonclawDocHref(["introduction", "what-is-goonclaw"])}
            >
              Start with the Overview
            </Link>
            <Link
              className="button button-secondary home-uniform-button"
              href={getGoonclawDocHref(faqSlug)}
            >
              Open the Full FAQ
            </Link>
          </div>
        </div>

        <aside className="home-hero-rail">
          <div className="rail-grid">
            <div className="rail-card">
              <p className="eyebrow">What lives here</p>
              <strong>Operators, builders, and agents</strong>
              <span>
                Product explanations, integration paths, machine docs, and policy-facing FAQ.
              </span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Fastest path</p>
              <strong>Read the overview, then the FAQ</strong>
              <span>
                The docs are structured so a human or another model can get oriented quickly.
              </span>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel home-section-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Browse docs</p>
            <h2>Pick a section</h2>
          </div>
        </div>

        <div className="home-card-grid">
          {docsBySection.map((group) => (
            <article key={group.section} className="surface-card">
              <p className="eyebrow">{group.section}</p>
              <h3>{group.docs[0]?.title || group.section}</h3>
              <p>
                {group.docs.map((doc) => doc.title).join(" • ")}
              </p>
              <div className="home-copy-stack">
                {group.docs.map((doc) => (
                  <Link key={doc.slug.join("/")} href={getGoonclawDocHref(doc.slug)}>
                    {doc.title}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel home-section-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Questions, answered plainly</h2>
          </div>
        </div>

        <div className="home-faq-preview">
          <div className="faq-list">
            {faqItems.map((item) => (
              <article key={item.question} className="faq-item">
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>

          <div className="home-inline-actions">
            <Link
              className="button button-primary home-uniform-button"
              href={getGoonclawDocHref(faqSlug)}
            >
              Read the Full FAQ
            </Link>
          </div>
        </div>
      </section>

      <section className="panel home-section-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Machine docs</p>
            <h2>LLM-readable entry points</h2>
          </div>
        </div>

        <div className="home-inline-actions">
          <Link className="button button-ghost small" href="/llms.txt">
            llms.txt
          </Link>
          <Link className="button button-ghost small" href="/llms-full.txt">
            llms-full.txt
          </Link>
          <Link className="button button-ghost small" href="/install.md">
            install.md
          </Link>
        </div>
      </section>
    </div>
  );
}
