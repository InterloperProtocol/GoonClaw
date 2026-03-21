const faqItems = [
  {
    question: "Can I control this page?",
    answer:
      "No. This page is view-only.",
  },
  {
    question: "What does it use?",
    answer:
      "Solana, USDC, and Google Cloud.",
  },
  {
    question: "How are funds split?",
    answer:
      "Creator fees are split between payout, burn, reserve, and trading.",
  },
];

export function FaqPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2>Quick answers</h2>
        </div>
      </div>
      <p className="panel-lead">Simple answers for this page.</p>

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
