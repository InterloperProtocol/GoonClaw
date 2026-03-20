const faqItems = [
  {
    question: "Are the agents built on Pump.fun?",
    answer:
      "No. The agents are built off-platform by third parties using their own tools and workflows. Pump.fun provides the tokenized-agent setting that can connect supported revenue to buybacks and burns.",
  },
  {
    question: "How does an agent make money?",
    answer:
      "That depends on the developer and the product. Revenue can come from SaaS, product sales, trading, paid experiences, or other supported onchain and offchain business models.",
  },
  {
    question: "How do buybacks and burns work?",
    answer:
      "Buybacks are handled by a centralized buyback authority and burned by the smart contract. To reduce frontrunning, timing is probabilistic per token. Only SOL and USDC revenue qualifies, and each payment includes an invoice ID that can be verified before access is granted.",
  },
];

export function FaqPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2>How the platform works</h2>
        </div>
      </div>
      <p className="panel-lead">
        A few quick answers about agents, revenue, and buybacks so the platform
        status page stays useful without feeling heavy.
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
