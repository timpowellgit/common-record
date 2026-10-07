import { FormEvent, useEffect, useMemo, useState } from "react";
import { demoNursingAgencyFilingPlan } from "./data/demo-filing-plan";
import { OperatorDashboard, OperatorGate } from "./operator";
import { PublicTimeline } from "./public/PublicTimeline";
import { MockupGallery } from "./mockups/MockupGallery";

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
    lead: "Common Record pilot",
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
    lead: "Exploratory concept",
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
    lead: "Exploratory concept",
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
    <article className={`campaign-card ${campaign.accent}`}>
      <div className="card-topline">
        <span>{campaign.eyebrow}</span>
        <span className={`status ${campaign.status}`}>{campaign.status}</span>
      </div>
      <h3>{campaign.title}</h3>
      <p>{campaign.summary}</p>
      <div className="card-foot">
        <span>{campaign.status === "pilot" ? `${campaign.institutions} requests · ${money.format(campaign.goal)} estimated fees` : "Early concept · scope not confirmed"}</span>
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
  const [route, setRoute] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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

  const view = new URLSearchParams(window.location.search).get("view");

  if (view === "mockups") {
    return <MockupGallery />;
  }

  if (route === "#/operator") {
    return (
      <div className="operator-view">
        <OperatorGate>
          <OperatorDashboard />
        </OperatorGate>
      </div>
    );
  }

  return (
    <div className="app-shell civic-site">
      <header className="site-header civic-header">
        <a className="brand" href="#top" aria-label="Common Record home">
          <span>Common Record</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#campaigns">Questions</a>
          <a href="#how-it-works">The method</a>
          <button className="text-button" type="button" onClick={() => setShowProposal(true)}>
            Propose a question ↗
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="civic-cover" aria-labelledby="cover-title">
          <div className="civic-cover-lead">
            <p className="civic-label">Issue 01 / Access to information</p>
            <h1 id="cover-title">Who has<br />the records<br />we need?</h1>
            <p>Common Record turns shared questions into public evidence.</p>
          </div>
          <div className="civic-cover-feature">
            <p className="civic-label">The first campaign / Ontario</p>
            <h2>{campaigns[0].title}</h2>
            <p>{campaigns[0].summary}</p>
            <button type="button" onClick={() => setSelected(campaigns[0])}>Read the campaign <ArrowIcon /></button>
          </div>
        </section>
        <section className="civic-cover-notes" aria-label="First campaign facts">
          <div><strong>5</strong><span>tailored requests</span></div>
          <div><strong>$25</strong><span>estimated initial filing fees</span></div>
          <div><strong>CSV</strong><span>planned public output</span></div>
        </section>

        <section className="campaign-section" id="campaigns">
          <div className="section-heading">
            <div>
              <p className="civic-label">The question desk / 01—03</p>
              <h2>Questions worth<br />putting on record.</h2>
            </div>
            <p>One researched pilot and two early ideas. Each answer should come with its sources, gaps and a dataset others can use.</p>
          </div>
          <div className="campaign-grid">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} onOpen={() => setSelected(campaign)} />
            ))}
          </div>
        </section>

        <section className="process-section" id="how-it-works">
          <div className="process-intro">
            <p className="civic-label">The method</p>
            <h2>Show the work.<br />Share the result.</h2>
            <p>Every step of a request should be understandable to the people it serves.</p>
          </div>
          <ol className="steps">
            <li><span>01</span><div><h3>Define the question</h3><p>Choose useful records and verify who holds them.</p></div></li>
            <li><span>02</span><div><h3>Show the plan</h3><p>Publish the scope, likely costs and intended output.</p></div></li>
            <li><span>03</span><div><h3>Request the records</h3><p>File with human approval and document the response.</p></div></li>
            <li><span>04</span><div><h3>Open the answer</h3><p>Share source files, gaps and comparable data.</p></div></li>
          </ol>
        </section>

        <section className="closing-section">
          <p className="civic-label">Have a stubborn public question?</p>
          <h2>Let's put it<br />on record.</h2>
          <button type="button" onClick={() => setShowProposal(true)}>Propose a question <ArrowIcon /></button>
        </section>
      </main>

      <footer>
        <div className="brand">Common Record</div>
        <p>A working public-information project. No money collected and no requests filed through this site.</p>
        <span><a href="?view=mockups&concept=magazine">Design archive</a></span>
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
              <>
                <div className="filing-preview">
                  <div><span className="mini-label">Supervised automation</span><strong>{active.institutions} tailored requests ready to compile</strong></div>
                  <button type="button" onClick={() => setShowFilingPlan(true)}>Compile filing plan</button>
                </div>
                <PublicTimeline campaignId={demoNursingAgencyFilingPlan.campaign.id} />
              </>
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
            <p className="prototype-note">Demo form—nothing is sent or saved.</p>
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
            <button className="button primary wide" type="button" onClick={() => { setShowContribution(false); setSelected(null); notify("Demo contribution preview complete. No payment was collected."); }}>Continue</button>
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
