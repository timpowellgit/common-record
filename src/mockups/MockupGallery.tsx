import { useEffect, useState } from "react";
import "./mockups.css";
import { referenceConcepts } from "./ReferenceMockups";

type Concept = {
  id: string;
  name: string;
  source: string;
  sourceUrl?: string;
  note: string;
  render: () => React.ReactNode;
};

const campaignTitle = "What did hospitals spend on private nursing agencies?";
const campaignSummary = "A hospital-by-hospital dataset of agency staffing costs, vendors and hours across Ontario.";

function Wordmark({ compact = false }: { compact?: boolean }) {
  return <a className={`mg-wordmark ${compact ? "compact" : ""}`} href="?">Common Record</a>;
}

function CampaignLine({ number = "01", action = "View request" }: { number?: string; action?: string }) {
  return (
    <div className="mg-campaign-line">
      <span>{number}</span>
      <div><strong>{campaignTitle}</strong><small>Ontario · 5 institutions · $25 filing cost</small></div>
      <a href="#campaign">{action} →</a>
    </div>
  );
}

function Nav({ inverse = false }: { inverse?: boolean }) {
  return (
    <header className={`mg-nav ${inverse ? "inverse" : ""}`}>
      <Wordmark />
      <nav><a href="#campaign">Campaigns</a><a href="#how">How it works</a><a href="#propose">Propose a question</a></nav>
    </header>
  );
}

function MinimalEditorial() {
  return (
    <div className="mockup mock-minimal">
      <Nav />
      <main>
        <p className="mg-index">Public information, collectively commissioned.</p>
        <h1>Some questions<br />should have<br />public answers.</h1>
        <div className="mg-minimal-bottom">
          <p>Pool a few dollars with your neighbours. We file the request and publish every record.</p>
          <a className="mg-square-link" href="#campaign">See the open question <span>↘</span></a>
        </div>
      </main>
      <CampaignLine />
    </div>
  );
}

function BrowseQuiet() {
  return (
    <div className="mockup mock-browse">
      <Nav />
      <main>
        <section className="browse-note">
          <span>COMMON RECORD / 01</span>
          <h1>Public questions.<br />Useful records.</h1>
          <p>We acquire information that should already be easier to find.</p>
        </section>
        <section className="browse-focus" id="campaign">
          <span>NOW GATHERING INTEREST</span>
          <h2>{campaignTitle}</h2>
          <div><b>$0</b><small>of $25 needed</small></div>
          <a href="#support">Follow this question →</a>
        </section>
      </main>
    </div>
  );
}

function TypographicIndex() {
  return (
    <div className="mockup mock-index">
      <Nav inverse />
      <main>
        <div className="index-intro"><span>01 / A public information commons</span><p>Small contributions fund precise records requests. Everything we receive becomes public.</p></div>
        <h1>ASK.<br />FUND.<br />OPEN.</h1>
        <CampaignLine action="Open" />
      </main>
    </div>
  );
}

function EvidenceFirst() {
  return (
    <div className="mockup mock-evidence">
      <Nav />
      <main>
        <section>
          <p className="mg-index">One live pilot</p>
          <h1>Fund the request.<br />Keep the evidence.</h1>
          <p>{campaignSummary}</p>
          <a className="mg-solid-action" href="#campaign">Explore the pilot</a>
        </section>
        <figure className="record-sheet" aria-label="Preview of a public-record request">
          <figcaption>REQUEST 01 / DRAFT</figcaption>
          <b>Freedom of Information Request</b>
          <span>To: Ontario hospital</span>
          <i /> <i /> <i className="short" />
          <small>Every filed request will appear here.</small>
        </figure>
      </main>
    </div>
  );
}

function ProductList() {
  return (
    <div className="mockup mock-product">
      <Nav />
      <main>
        <header><span>3 proposed questions</span><h1>Questions waiting<br />to become records.</h1></header>
        <div className="product-list">
          <CampaignLine action="Details" />
          <CampaignLine number="02" action="Details" />
          <CampaignLine number="03" action="Details" />
        </div>
      </main>
    </div>
  );
}

function TimelineDetail() {
  const [active, setActive] = useState(0);
  const steps = ["Question proposed", "Request prepared", "Records received", "Dataset published"];
  return (
    <div className="mockup mock-detail">
      <Nav />
      <main>
        <p className="mg-index">The entire process stays visible</p>
        <h1>Follow one question<br />from curiosity to evidence.</h1>
        <div className="detail-track">
          {steps.map((step, index) => (
            <button className={active === index ? "active" : ""} key={step} onClick={() => setActive(index)}>
              <span>0{index + 1}</span><strong>{step}</strong>
            </button>
          ))}
        </div>
        <div className="detail-caption"><b>{steps[active]}</b><span>{active === 0 ? "Public interest is measured before money is collected." : active === 1 ? "A tailored request and exact filing cost become public." : active === 2 ? "Pages, fees, delays and gaps are posted as received." : "Clean data remains available for anyone to reuse."}</span></div>
      </main>
    </div>
  );
}

function NavigationLed() {
  return (
    <div className="mockup mock-nav-led">
      <header>
        <Wordmark />
        <div className="nav-led-links"><a href="#questions">Questions <sup>03</sup></a><a href="#records">Records <sup>00</sup></a><a href="#about">About</a></div>
        <a href="#propose">Propose ↗</a>
      </header>
      <main>
        <span>COMMON RECORD / ONTARIO</span>
        <h1>Better access<br />starts with a<br />better question.</h1>
        <CampaignLine action="See why it matters" />
      </main>
    </div>
  );
}

function FooterLed() {
  return (
    <div className="mockup mock-footer-led">
      <Nav />
      <main>
        <p>Common Record helps neighbours commission public-information requests together.</p>
        <CampaignLine action="View pilot" />
      </main>
      <footer>
        <span>Have a question the public should be able to answer?</span>
        <h1>Put it<br />on record.</h1>
        <a href="#propose">Propose a question ↗</a>
      </footer>
    </div>
  );
}

function ColorField() {
  return (
    <div className="mockup mock-color-field">
      <header><Wordmark compact /><a href="#campaign">View campaigns</a></header>
      <main>
        <section className="color-statement"><span>PUBLIC QUESTIONS / PUBLIC ANSWERS</span><h1>What<br />should we<br />know?</h1></section>
        <section className="color-campaign"><span>01 / ONTARIO PILOT</span><h2>{campaignTitle}</h2><p>{campaignSummary}</p><a href="#campaign">Explore →</a></section>
      </main>
    </div>
  );
}

function CuratedCalm() {
  return (
    <div className="mockup mock-curated">
      <Nav />
      <main>
        <aside><span>01</span><p>COMMON RECORD IS A PUBLIC ARCHIVE BUILT ONE QUESTION AT A TIME.</p></aside>
        <section>
          <h1>Open questions,<br />carefully pursued.</h1>
          <p>Contribute to the exact cost of obtaining a useful public record. Follow the work. Reuse the result.</p>
          <a href="#campaign">Browse the first campaign ↗</a>
        </section>
      </main>
      <CampaignLine />
    </div>
  );
}

function MetricStrip() {
  return <div className="mg-metrics"><div><strong>3</strong><span>questions open</span></div><div><strong>5</strong><span>institutions mapped</span></div><div><strong>$25</strong><span>pilot filing cost</span></div></div>;
}

function MiniDocuments() {
  return <div className="mg-documents" aria-label="Example campaign outputs"><div><span>01</span><b>Request letter</b><small>Draft · PDF</small></div><div><span>02</span><b>Released records</b><small>Pending</small></div><div><span>03</span><b>Clean dataset</b><small>Pending · CSV</small></div></div>;
}

function SectionedEditorial() {
  return <div className="mockup mock-sectioned"><Nav /><main><section className="sectioned-hero"><p className="mg-index">Public questions become permanent public resources.</p><h1>Open the answer,<br />not just the file.</h1><a href="#campaign">Explore the pilot →</a></section><section className="sectioned-campaign"><span>FEATURED / ONTARIO</span><h2>{campaignTitle}</h2><p>{campaignSummary}</p><div className="sectioned-progress"><i /><b>$0 of $25</b><small>Interest stage · no money collected</small></div></section></main><MetricStrip /></div>;
}

function EvidenceBoard() {
  return <div className="mockup mock-board"><Nav /><main><header><div><p className="mg-index">Campaign 01</p><h1>One question.<br />Every artifact.</h1></div><p>Follow the request, fees, correspondence, released pages and final dataset in one public place.</p></header><div className="board-body"><section><span>ACTIVE QUESTION</span><h2>{campaignTitle}</h2><p>{campaignSummary}</p><a href="#follow">Follow campaign →</a></section><MiniDocuments /></div></main></div>;
}

function GuidedFlow() {
  return <div className="mockup mock-flow"><Nav /><main><section><p className="mg-index">How Common Record works</p><h1>From a shared question<br />to usable evidence.</h1><p>We make the administrative work visible, fundable and reusable.</p></section><ol><li><b>1</b><div><strong>Choose a question</strong><span>Show that the answer matters.</span></div></li><li><b>2</b><div><strong>Fund the real cost</strong><span>See the filing plan before contributing.</span></div></li><li><b>3</b><div><strong>Use the answer</strong><span>Records and clean data stay public.</span></div></li></ol></main><CampaignLine action="See the first question" /></div>;
}

function CampaignRoom() {
  return <div className="mockup mock-room"><Nav /><main><aside><span>CR / 001</span><h1>{campaignTitle}</h1><p>{campaignSummary}</p><a href="#interest">I want this answered</a></aside><section><header><span>CURRENT STAGE</span><strong>Research complete</strong><small>Ready to test public interest</small></header><div className="room-progress"><div><b>01</b><span>Scope</span></div><div className="active"><b>02</b><span>Interest</span></div><div><b>03</b><span>Fund</span></div><div><b>04</b><span>File</span></div><div><b>05</b><span>Publish</span></div></div><dl><div><dt>Institutions</dt><dd>5 Ontario hospitals</dd></div><div><dt>Estimated fees</dt><dd>$25 total</dd></div><div><dt>Public output</dt><dd>CSV + request archive</dd></div></dl></section></main></div>;
}

function OnePageRhythm() {
  return <div className="mockup mock-rhythm"><Nav /><main><section className="rhythm-a"><span>COMMON RECORD</span><h1>Fund useful<br />public knowledge.</h1><p>Collectively commission the records people need.</p></section><section className="rhythm-b"><span>01 / LIVE PILOT</span><h2>{campaignTitle}</h2><a href="#campaign">View campaign ↗</a></section><section className="rhythm-c"><div><b>PROPOSE</b><span>Start with a stubborn question.</span></div><div><b>REQUEST</b><span>Track the filing in public.</span></div><div><b>PUBLISH</b><span>Reuse every answer.</span></div></section></main></div>;
}

function ProductStory() {
  return <div className="mockup mock-story"><Nav /><main><section className="story-copy"><p className="mg-index">A small public-information utility</p><h1>See exactly<br />what your<br />contribution opens.</h1><p>Costs, requests and results are visible before, during and after every campaign.</p><a href="#campaign">Browse open questions</a></section><section className="story-panel"><header><span>ONTARIO PILOT</span><strong>Agency nursing spending</strong></header><div className="story-chart"><i /><span>0%</span></div><dl><div><dt>Goal</dt><dd>$25</dd></div><div><dt>Requests</dt><dd>5</dd></div><div><dt>Output</dt><dd>Open CSV</dd></div></dl><MiniDocuments /></section></main></div>;
}

function NarrativeGrid() {
  return <div className="mockup mock-narrative"><Nav /><main><section className="narrative-title"><span>WHY COMMON RECORD</span><h1>Public information is more useful when the path to it is public too.</h1></section><section className="narrative-copy"><p>Questions become scoped campaigns. Campaigns become records. Records become reusable data.</p><a href="#how">See how it works →</a></section><section className="narrative-campaign"><span>OPEN QUESTION 01</span><h2>{campaignTitle}</h2><small>Ontario · Interest stage</small></section><section className="narrative-output"><span>WHAT BECOMES PUBLIC</span><ul><li>Every tailored request</li><li>Every invoice and response</li><li>One normalized dataset</li></ul></section></main></div>;
}

function ResponsiveRows() {
  const rows = [["01", "Private nursing agency spending", "Ontario", "$25"], ["02", "Extreme-heat readiness", "8 cities", "$620"], ["03", "Urgent school repairs", "Toronto", "$900"]];
  return <div className="mockup mock-rows"><Nav /><main><header><p className="mg-index">Questions currently gathering interest</p><h1>Choose what<br />we open next.</h1></header><div className="rows-list">{rows.map((row) => <a href="#campaign" key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong><small>{row[2]}</small><b>{row[3]}</b><i>↗</i></a>)}</div></main></div>;
}

function PublicArchive() {
  return <div className="mockup mock-archive"><Nav /><main><header><div><p className="mg-index">The public archive starts here</p><h1>Questions,<br />requests & records.</h1></div><div className="archive-search"><span>Search the archive</span><b>⌕</b></div></header><div className="archive-filters"><button>All stages</button><button>Ontario</button><button>Newest first</button></div><div className="archive-table"><CampaignLine action="Open campaign" /><CampaignLine number="02" action="Preview" /><CampaignLine number="03" action="Preview" /></div></main></div>;
}

function CivicMagazine() {
  return <div className="mockup mock-magazine"><Nav inverse /><main><section className="magazine-lead"><span>ISSUE 01 / ACCESS TO INFORMATION</span><h1>Who has<br />the records<br />we need?</h1><p>Common Record turns shared questions into public evidence.</p></section><section className="magazine-feature"><span>THE FIRST CAMPAIGN</span><h2>{campaignTitle}</h2><p>{campaignSummary}</p><a href="#campaign">Read the campaign →</a></section><section className="magazine-notes"><div><b>5</b><span>tailored requests</span></div><div><b>$25</b><span>estimated filing fees</span></div><div><b>CSV</b><span>planned public output</span></div></section></main></div>;
}

const concepts: Concept[] = [
  { id: "minimal", name: "01 Minimal editorial", source: "Minimal Gallery", note: "Large quiet field, one statement, one campaign.", render: MinimalEditorial },
  { id: "browse", name: "02 Quiet asymmetry", source: "Browse.cool", note: "Whitespace and a single offset object create the character.", render: BrowseQuiet },
  { id: "index", name: "03 Typographic index", source: "SiteInspire", note: "The verbs become the identity; everything else recedes.", render: TypographicIndex },
  { id: "evidence", name: "04 Evidence first", source: "Land-book", note: "One conversion path, grounded by the actual request artifact.", render: EvidenceFirst },
  { id: "product", name: "05 Product list", source: "Screenlane", note: "A plain, useful product surface with no marketing theatre.", render: ProductList },
  { id: "detail", name: "06 Process detail", source: "Details", note: "One interaction explains the entire service.", render: TimelineDetail },
  { id: "navigation", name: "07 Navigation led", source: "navbar.design", note: "A strong information architecture carries the page.", render: NavigationLed },
  { id: "footer", name: "08 Ending first", source: "footer.design", note: "A restrained page builds to one oversized closing invitation.", render: FooterLed },
  { id: "color", name: "09 Colour field", source: "A1 Gallery", note: "Two flat fields, sharp type, zero ornament.", render: ColorField },
  { id: "curated", name: "10 Curated calm", source: "Curated Design", note: "Small index, measured type and editorial pacing.", render: CuratedCalm },
  { id: "sectioned", name: "11 Sectioned editorial", source: "SEESAW", note: "A calm hero, one featured campaign and a restrained fact strip.", render: SectionedEditorial },
  { id: "board", name: "12 Evidence board", source: "UIBook", note: "The campaign and its three concrete outputs share the stage.", render: EvidenceBoard },
  { id: "flow", name: "13 Guided flow", source: "Mobbin", note: "A simple three-step product explanation with one next action.", render: GuidedFlow },
  { id: "room", name: "14 Campaign room", source: "Nicelydone", note: "A focused campaign page with stage, cost and output details.", render: CampaignRoom },
  { id: "rhythm", name: "15 One-page rhythm", source: "One Page Love", note: "Three restrained bands form a complete compact story.", render: OnePageRhythm },
  { id: "story", name: "16 Product story", source: "SaaSFrame", note: "A persuasive split layout grounded in a real campaign panel.", render: ProductStory },
  { id: "narrative", name: "17 Narrative grid", source: "Layers", note: "Four unequal editorial modules add substance without clutter.", render: NarrativeGrid },
  { id: "rows", name: "18 Responsive rows", source: "Hover States", note: "A spare campaign index whose rows reveal hierarchy on hover.", render: ResponsiveRows },
  { id: "archive", name: "19 Public archive", source: "Collect UI", note: "Search, three light filters and an uncluttered records list.", render: PublicArchive },
  { id: "magazine", name: "20 Civic magazine", source: "Godly", note: "Editorial energy with one feature, one thesis and three facts.", render: CivicMagazine },
  ...referenceConcepts,
];

export function MockupGallery() {
  const params = new URLSearchParams(window.location.search);
  const initial = Math.max(0, concepts.findIndex((concept) => concept.id === params.get("concept")));
  const [current, setCurrent] = useState(initial);
  const concept = concepts[current];
  const ConceptView = concept.render;

  useEffect(() => {
    const next = new URL(window.location.href);
    next.searchParams.set("view", "mockups");
    next.searchParams.set("concept", concept.id);
    window.history.replaceState({}, "", next);
  }, [concept.id]);

  return (
    <div className="mockup-gallery">
      <div className="gallery-toolbar">
        <a href="?" className="gallery-back">← Current site</a>
        <div className="gallery-picker">
          <button onClick={() => setCurrent((current - 1 + concepts.length) % concepts.length)} aria-label="Previous concept">←</button>
          <label><span>Concept</span><select value={current} onChange={(event) => setCurrent(Number(event.target.value))}>{concepts.map((item, index) => <option value={index} key={item.id}>{item.name}</option>)}</select></label>
          <button onClick={() => setCurrent((current + 1) % concepts.length)} aria-label="Next concept">→</button>
        </div>
        <div className="gallery-source"><span>{concept.sourceUrl ? "Template studied" : "Reference lens"}</span><strong>{concept.sourceUrl ? <a href={concept.sourceUrl} target="_blank" rel="noreferrer">{concept.source} ↗</a> : concept.source}</strong><small>{concept.note}</small></div>
      </div>
      <div className="gallery-stage"><ConceptView /></div>
    </div>
  );
}
