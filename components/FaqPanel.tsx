const faqItems = [
  {
    question: "Can public users control GoonClaw?",
    answer:
      "No. Public users can watch the heartbeat, treasury posture, and public trace feed, but only the hidden owner dashboard can pause, settle, liquidate, or approve policy actions.",
  },
  {
    question: "What chains and models does GoonClaw use?",
    answer:
      "GoonClaw is constrained to Solana and USDC flows, and its inference backend is Vertex AI Gemini on Google Cloud. The autonomous runtime is intentionally Solana-only and Vertex-only.",
  },
  {
    question: "How do the revenue splits work?",
    answer:
      "Creator fees split 50 percent to the owner wallet, 40 percent to GoonClaw buyback and burn, and 10 percent to trading. GoonClaw-owned ChartSync revenue splits 50 percent to burn and 50 percent to the displayed-token session trade. Third-party public-stream commission routes 5 percent to burn and 5 percent to reserve.",
  },
];

export function FaqPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2>How the autonomous runtime works</h2>
        </div>
      </div>
      <p className="panel-lead">
        A few quick answers about autonomy, control boundaries, and treasury
        policy so the public status wall stays clear without getting bloated.
      </p>

      <div className="faq-list">
        {faqItems.map((item) => (
          <article key={item.question} className="faq-item">
            <strong>{item.question}</strong>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
