import { FormEvent, useMemo, useState } from "react";
import { demoNursingAgencyFilingPlan } from "./data/demo-filing-plan";
import { OperatorDashboard } from "./operator";

type Campaign = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  raised: number;
  goal: number;
  supporters: number;
  interested: number;
  institutions: number;
  accent: string;
  status: "pilot" | "concept";
  lead: string;
  output: string;
};

const campaigns: Campaign[] = [
  {
    id: "agency-nursing",
    eyebrow: "Researched pilot · Ontario",
    title: "What did hospitals spend on private nursing agencies?",
    summary:
      "Build a hospital-by-hospital dataset of agency staffing costs, vendors, and hours for 2022–26.",
    raised: 0,
    goal: 25,
    supporters: 0,
    interested: 0,
    institutions: demoNursingAgencyFilingPlan.totals.requestCount,
    accent: "coral",
    status: "pilot",
    lead: "Proposed with a health-policy researcher",
    output: "A normalized CSV, request archive, methodology, and plain-language findings note.",
  },
  {
    id: "heat-plans",
    eyebrow: "Concept campaign · Municipal",
    title: "Which cities are ready for the next extreme heat emergency?",
    summary:
      "Compare heat-response plans, cooling-centre capacity, and post-event reviews across large Ontario cities.",
    raised: 0,
    goal: 620,
    supporters: 0,
    interested: 0,
    institutions: 8,
    accent: "yellow",
    status: "concept",
    lead: "Community proposal",
    output: "A city-by-city comparison, source documents, and reusable emergency-planning dataset.",
  },
  {
    id: "school-repairs",
    eyebrow: "Concept campaign · Toronto",
    title: "Where are urgent school repairs still waiting?",
    summary:
      "Open up the project lists, condition scores, and deferred repair costs behind the headline backlog number.",
    raised: 0,
    goal: 900,
    supporters: 0,
    interested: 0,
    institutions: 4,
    accent: "blue",
    status: "concept",
    lead: "Parent-led proposal",
    output: "A school-level repair dataset with project status, estimated cost, and record provenance.",
  },
];

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function Progress({ campaign }: { campaign: Campaign }) {
  const percent = Math.min((campaign.raised / campaign.goal) * 100, 100);
  return (
    <div className="progress-wrap">
      <div className="progress-meta">
        <strong>{money.format(campaign.raised)}</strong>
        <span>{percent === 100 ? "Funded" : `${Math.round(percent)}% of ${money.format(campaign.goal)}`}</span>
      </div>
      <div className="progress-track" aria-label={`${Math.round(percent)} percent funded`}>
        <div className="progress-value" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onOpen }: { campaign: Campaign; onOpen: () => void }) {
  return (
    <article className={`campaign-card ${campaign.accent}`} onClick={onOpen}>
      <div className="card-topline">
        <span>{campaign.eyebrow}</span>
        <span className={`status ${campaign.status}`}>{campaign.status}</span>
      </div>
      <h3>{campaign.title}</h3>
      <p>{campaign.summary}</p>
      <Progress campaign={campaign} />
      <div className="card-foot">
        <span>{campaign.supporters} contributors</span>
        <button type="button" onClick={onOpen} aria-label={`View ${campaign.title}`}>
          <ArrowIcon />
        </button>
      </div>
    </article>
  );
}

function App() {
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [showProposal, setShowProposal] = useState(false);
  const [showContribution, setShowContribution] = useState(false);
  const [showFilingPlan, setShowFilingPlan] = useState(false);
  const [amount, setAmount] = useState(5);
  const [toast, setToast] = useState("");

  const active = useMemo(() => selected ?? campaigns[0], [selected]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowProposal(false);
    notify("Proposal saved for review — this is a prototype, so nothing was submitted.");
  }

  if (new URLSearchParams(window.location.search).get("view") === "operator") {
    return (
      <div className="operator-view">
        <a className="operator-back" href="?">← Return to public site</a>
        <OperatorDashboard />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Common Record home">
          <span className="brand-mark">CR</span>
          <span>Common Record</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#campaigns">Campaigns</a>
          <a href="#how-it-works">How it works</a>
          <button className="text-button" type="button" onClick={() => setShowProposal(true)}>
            Propose a question
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">Public information, collectively commissioned.</p>
            <h1>Fund the questions.<br /><em>Open the answers.</em></h1>
            <p className="hero-intro">
              Chip in a few dollars with your neighbours. We turn public questions into precise records requests—and messy releases into useful, permanent datasets.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#campaigns">Explore campaigns <ArrowIcon /></a>
              <button className="button secondary" type="button" onClick={() => setShowProposal(true)}>Propose yours</button>
            </div>
          </div>
          <div className="hero-art" aria-label="Illustration of many contributions becoming an open record">
            <div className="question-card">
              <span className="mini-label">A public question</span>
              <strong>Who has the records<br />we need?</strong>
              <div className="avatars"><i>T</i><i>A</i><i>M</i><i>+326</i></div>
            </div>
            <div className="line one" />
            <div className="line two" />
            <div className="record-stamp">OPEN<br />RECORD</div>
            <div className="dot-grid" />
          </div>
        </section>

        <section className="trust-strip" aria-label="Project principles">
          <span>Every dollar traceable</span><b>•</b><span>Every request public</span><b>•</b><span>Every dataset reusable</span>
        </section>

        <section className="campaign-section" id="campaigns">
          <div className="section-heading">
            <div>
            <p className="kicker">Prototype campaign board · no money collected</p>
              <h2>What should the public know?</h2>
            </div>
            <p>Interest shows demand. Contributions pay for filing, follow-up, and turning records into something people can actually use.</p>
          </div>
          <div className="campaign-grid">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} onOpen={() => setSelected(campaign)} />
            ))}
          </div>
        </section>

        <section className="process-section" id="how-it-works">
          <div className="process-intro">
            <p className="kicker light">From curiosity to commons</p>
            <h2>One question.<br />Many records.<br />A public answer.</h2>
          </div>
          <ol className="steps">
            <li><span>01</span><div><h3>Propose</h3><p>Describe what is missing and why it matters.</p></div></li>
            <li><span>02</span><div><h3>Fund</h3><p>People signal interest and share the real acquisition cost.</p></div></li>
            <li><span>03</span><div><h3>Request</h3><p>Tailored requests are prepared, checked, filed, and tracked.</p></div></li>
            <li><span>04</span><div><h3>Publish</h3><p>Records, costs, gaps, and a clean dataset become public.</p></div></li>
          </ol>
        </section>

        <section className="closing-section">
          <p className="kicker">Have a stubborn public question?</p>
          <h2>It might be a campaign.</h2>
          <button className="button primary dark" type="button" onClick={() => setShowProposal(true)}>Tell us about it <ArrowIcon /></button>
        </section>
      </main>

      <footer>
        <div className="brand"><span className="brand-mark">CR</span><span>Common Record</span></div>
        <p>A working concept for better access to public information in Canada.</p>
        <span>Ontario · 2026 · <a href="?view=operator">Operator demo</a></span>
      </footer>

      {selected && (
        <div className="overlay" role="presentation" onMouseDown={() => setSelected(null)}>
          <article className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="campaign-title" onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <p className="kicker">{active.eyebrow}</p>
            <h2 id="campaign-title">{active.title}</h2>
            <p className="detail-summary">{active.summary}</p>
            <Progress campaign={active} />
            <div className="stat-grid">
              <div><strong>{active.interested.toLocaleString()}</strong><span>interested</span></div>
              <div><strong>{active.supporters}</strong><span>contributors</span></div>
              <div><strong>{active.institutions}</strong><span>institutions</span></div>
            </div>
            <div className="detail-block"><span>Campaign lead</span><p>{active.lead}</p></div>
            <div className="detail-block"><span>What becomes public</span><p>{active.output}</p></div>
            {active.id === "agency-nursing" ? (
              <div className="filing-preview">
                <div><span className="mini-label">Supervised automation</span><strong>{active.institutions} tailored requests ready to compile</strong></div>
                <button type="button" onClick={() => setShowFilingPlan(true)}>Compile filing plan</button>
              </div>
            ) : (
              <div className="filing-preview muted">
                <div><span className="mini-label">Concept only</span><strong>This campaign has not been researched or prepared for filing.</strong></div>
              </div>
            )}
            <button className="button primary wide" type="button" onClick={() => setShowContribution(true)}>Contribute to this campaign</button>
            <p className="prototype-note">Prototype only—no payment will be collected.</p>
          </article>
        </div>
      )}

      {showProposal && (
        <div className="overlay" role="presentation" onMouseDown={() => setShowProposal(false)}>
          <form className="form-panel" onSubmit={submitProposal} onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" type="button" onClick={() => setShowProposal(false)} aria-label="Close">×</button>
            <p className="kicker">Propose a public question</p>
            <h2>What should we try to open?</h2>
            <label>Your question<textarea required placeholder="What do you want to know?" /></label>
            <label>Why it matters<textarea required placeholder="Who would use the answer, and how?" /></label>
            <label>Your email<input required type="email" placeholder="you@example.ca" /></label>
            <button className="button primary wide" type="submit">Save proposal</button>
            <p className="prototype-note">Demo form—your information stays in this browser session.</p>
          </form>
        </div>
      )}

      {showContribution && (
        <div className="overlay nested" role="presentation" onMouseDown={() => setShowContribution(false)}>
          <div className="contribution-panel" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" type="button" onClick={() => setShowContribution(false)} aria-label="Close">×</button>
            <p className="kicker">Back this question</p>
            <h2>Choose an amount</h2>
            <div className="amounts">
              {[1, 5, 10, 25].map((value) => <button className={amount === value ? "active" : ""} type="button" key={value} onClick={() => setAmount(value)}>${value}</button>)}
            </div>
            <p>Your <strong>{money.format(amount)}</strong> demo contribution helps cover filing and records-processing costs.</p>
            <button className="button primary wide" type="button" onClick={() => { setShowContribution(false); setSelected(null); notify("Demo contribution recorded. No payment was collected."); }}>Continue</button>
            <p className="prototype-note">No account or payment required in this prototype.</p>
          </div>
        </div>
      )}

      {showFilingPlan && (
        <div className="overlay nested" role="presentation" onMouseDown={() => setShowFilingPlan(false)}>
          <article className="filing-panel" role="dialog" aria-modal="true" aria-labelledby="filing-plan-title" onMouseDown={(e) => e.stopPropagation()}>
            <button className="close" type="button" onClick={() => setShowFilingPlan(false)} aria-label="Close">×</button>
            <p className="kicker">Supervised draft · no submissions</p>
            <h2 id="filing-plan-title">Filing plan compiled.</h2>
            <div className="plan-summary">
              <div><strong>{demoNursingAgencyFilingPlan.totals.requestCount}</strong><span>tailored drafts</span></div>
              <div><strong>{money.format(demoNursingAgencyFilingPlan.totals.estimatedApplicationFeesCents / 100)}</strong><span>estimated filing fees</span></div>
              <div><strong>5</strong><span>approval gates each</span></div>
            </div>
            <div className="plan-warning">
              <strong>Human review required</strong>
              <p>{demoNursingAgencyFilingPlan.warnings[0]}</p>
            </div>
            <div className="request-list">
              {demoNursingAgencyFilingPlan.requests.map((request, index) => (
                <details key={request.id}>
                  <summary>
                    <span className="request-number">{String(index + 1).padStart(2, "0")}</span>
                    <span><strong>{request.institutionName}</strong><small>{request.submission.kind.replace("-", " ")} · {money.format(request.estimatedApplicationFeeCents / 100)}</small></span>
                    <span className="draft-badge">Draft</span>
                  </summary>
                  <div className="request-detail">
                    <div><span>Subject</span><p>{request.subject}</p></div>
                    <div><span>Approval gates</span><ul>{request.approvalGates.map((gate) => <li key={gate.kind}>{gate.label}</li>)}</ul></div>
                    <div><span>Generated request preview</span><pre>{request.body}</pre></div>
                  </div>
                </details>
              ))}
            </div>
            <p className="prototype-note">This plan prepares drafts only. It cannot file requests, send messages, or make payments.</p>
          </article>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

export default App;
