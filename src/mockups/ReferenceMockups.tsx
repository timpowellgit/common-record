import { useState, type ReactNode } from "react";
import "./reference-mockups.css";

const questions = [
  { topic: "Health", title: "The cost of agency nursing", description: "What did Ontario hospitals pay private nursing agencies?", scope: "5 hospitals · Ontario", status: "Pilot draft" },
  { topic: "Climate", title: "A city's plan for extreme heat", description: "Which public spaces are ready for the next heat wave?", scope: "Municipal records", status: "Proposed question" },
  { topic: "Education", title: "The repairs our schools need", description: "Which school repairs are still waiting to be funded?", scope: "School board records", status: "Proposed question" },
];

function Brand() { return <a className="ref-brand" href="?">Common Record</a>; }
function Header({ children }: { children?: ReactNode }) {
  return <header className="ref-header"><Brand /><nav aria-label="Mockup navigation">{children || <><a href="#ref-question">The pilot</a><a href="#ref-method">Our approach</a></>}</nav></header>;
}
function Fineprint() { return <p className="ref-fineprint">Design prototype. No payments collected; no requests filed.</p>; }
function Method() {
  return <details className="ref-method" id="ref-method"><summary>How a question becomes a public record <span>+</span></summary><p>Define a precise question. Review the request and its costs. File it with the institution. Publish the response, including any gaps or refusals. This pilot is still at the draft stage.</p></details>;
}
function QuestionDetails({ title = "Read the request plan" }: { title?: string }) {
  return <details className="ref-disclosure"><summary>{title}<span aria-hidden="true">↗</span></summary><div><p>Proposed scope: agency nursing spending, vendors and hours across five Ontario hospitals.</p><p>Estimated initial filing fees: $25 total. Additional search or processing fees may apply. No requests have been filed.</p><p>Planned publication: request text, responses and a comparable CSV, with missing information clearly marked.</p></div></details>;
}
function Paper({ kind = "request" }: { kind?: "request" | "data" | "log" }) {
  return <div className={`ref-paper ref-paper-${kind}`}>
    <div className="ref-paper-top"><span>COMMON RECORD</span><span>DRAFT / 001</span></div>
    <h3>{kind === "request" ? "Request for access\nto public records" : kind === "data" ? "Agency nursing\nData dictionary" : "A record of\nevery step"}</h3>
    <p>{kind === "request" ? "Subject: private agency nursing" : kind === "data" ? "Proposed fields for comparison" : "Public request log · proposed format"}</p>
    <dl>{(kind === "request" ? [["Scope", "Spending, vendors, hours"], ["Institutions", "Five Ontario hospitals"], ["Stage", "Not yet filed"]] : kind === "data" ? [["hospital", "Institution name"], ["agency_spend", "Reported amount, CAD"], ["period", "Reporting period"]] : [["01", "Draft the request"], ["02", "Confirm scope and cost"], ["03", "Publish the response"]]).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <small>Sample structure · not a released record</small>
  </div>;
}
function Shell({ name, children }: { name: string; children: ReactNode }) { return <div className={`mockup ref-mockup ref-${name}`}>{children}<Fineprint /></div>; }

function PublicGoods() {
  return <Shell name="goods"><Header /><main><div className="ref-goods-intro"><h1>Good questions.<br />Public answers.</h1><p>We help people ask for the records that matter.<br />Then make the answers available to everyone.</p></div><div className="ref-goods-grid" id="ref-question">{questions.map((q, i) => <article key={q.topic}><div className="ref-row"><span>0{i + 1}</span><span>{q.topic}</span></div><h2>{q.title}</h2><p>{q.description}</p><small>{q.status}</small>{i === 0 ? <QuestionDetails /> : <details className="ref-disclosure"><summary>About this question<span>↗</span></summary><p>Early concept only. The institutions, time period and cost would be defined before any request is filed.</p></details>}</article>)}</div><Method /></main></Shell>;
}
function Masthead() {
  return <Shell name="masthead"><header className="ref-masthead-title"><a href="?">Common Record</a><span>A public information project</span></header><main><section className="ref-masthead-intro"><p>Information about public life<br />should be part of public life.<br />We turn shared questions into<br />carefully documented requests.</p><nav aria-label="Page sections"><a href="#ref-question">The first question,</a><a href="#ref-method">How we work.</a></nav></section><section className="ref-masthead-feature" id="ref-question"><span>Selected inquiry / 01</span><div><h1>What does agency<br />nursing really cost?</h1><p>Five Ontario hospitals. One comparable set of records.</p><QuestionDetails /></div><aside><b>$25</b><span>Estimated initial filing fees</span><span>Draft · not yet filed</span></aside></section><Method /></main></Shell>;
}
function Collection() {
  const [mode, setMode] = useState("overview");
  return <Shell name="collection"><Header><div className="ref-switch" aria-label="Collection view">{["overview", "index"].map(m => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>)}</div></Header><main><div className="ref-collection-heading"><h1>Questions worth<br />keeping a record of.</h1><p>A small collection of public-interest inquiries.<br />Start with one. Make the result useful.</p></div><section className={`ref-collection-${mode}`} aria-live="polite" id="ref-question">{questions.map((q, i) => <article key={q.topic}><span className="ref-collection-number">(0{i + 1})</span><div><small>{q.topic} / {q.status}</small><h2>{q.title}</h2><p>{q.description}</p>{i === 0 && <QuestionDetails />}</div></article>)}</section><Method /></main></Shell>;
}
function Plainspoken() {
  return <Shell name="plainspoken"><Header /><main><h1>Common Record is a small public-interest project. We ask <a href="#ref-question">specific questions</a>, request the evidence, and put what we learn in public.</h1><section className="ref-plain-bottom" id="ref-question"><p>First inquiry<br /><span>Health / Ontario</span></p><div><h2>Private agency nursing,<br />hospital by hospital.</h2><QuestionDetails /></div><p>Public by default.<br />Gaps included.</p></section><Method /></main></Shell>;
}
function Fieldwork() {
  return <Shell name="fieldwork"><Header /><main><div className="ref-fieldwork-copy"><div className="ref-row"><span>Ontario, Canada</span><span>Pilot № 01</span></div><h1>A QUESTION<br />WORTH<br />FOLLOWING.</h1><p>What did hospitals spend on private nursing agencies? A shared inquiry, with a paper trail you can read.</p><a className="ref-text-link" href="#ref-question">Open the working file ↗</a></div><section className="ref-fieldwork-file" id="ref-question"><Paper /><QuestionDetails title="Scope & estimated cost" /></section></main><Method /></Shell>;
}
function OpenOffice() {
  return <Shell name="office"><Header /><main><div className="ref-office-meta"><span>INDEPENDENT<br />PUBLIC INFORMATION</span><span>ASK / DOCUMENT / SHARE</span></div><section className="ref-office-feature" id="ref-question"><div><small>Inquiry 001 · Pilot draft</small><h1>The public paid.<br />What did it cost?</h1><p>Opening the books on Ontario's private agency nursing spend.</p></div><aside><span>THE WORKING BRIEF</span><p>5 hospitals<br />Spending, vendors, hours<br />$25 estimated filing fees</p><QuestionDetails title="Read the brief" /></aside></section><div className="ref-office-wordmark" aria-hidden="true">ON THE RECORD.</div><Method /></main></Shell>;
}
function ReadingRoom() {
  const [selected, setSelected] = useState<"request" | "data" | "log">("request");
  return <Shell name="reading"><Header /><main><div className="ref-reading-title"><span>The reading room</span><h1>Not just an answer.<br /><em>The evidence behind it.</em></h1><p>A preview of how the nursing-agency inquiry could be published.</p></div><div className="ref-reading-workspace" id="ref-question"><div className="ref-reading-selector" aria-label="Document preview">{([['request','01','The request'],['data','02','The dataset'],['log','03','The paper trail']] as const).map(([key,n,label]) => <button key={key} aria-pressed={selected===key} onClick={()=>setSelected(key)}><span>{n}</span>{label}<span>↗</span></button>)}<small>Draft structures only.<br />No records received yet.</small></div><div aria-live="polite"><Paper kind={selected} /></div></div><Method /></main></Shell>;
}
function CommonTable() {
  return <Shell name="table"><header className="ref-table-header"><a href="#ref-method">About the project</a><Brand /><a href="#ref-question">First inquiry ↗</a></header><main><div className="ref-table-intro"><span>PUBLIC INFORMATION, SHARED.</span><h1>A place for<br /><em>better questions.</em></h1><p>Some things are easier to find out together.</p></div><section className="ref-table-feature" id="ref-question"><div className="ref-table-label">At the table<br /><span>№ 001</span></div><div><small>Ontario / Health</small><h2>What are hospitals paying<br />for private agency nurses?</h2><p>A modest first inquiry into a public expense.</p></div><div><span>Five hospitals.<br />One open record.</span><QuestionDetails title="Take a closer look" /></div></section><Method /></main></Shell>;
}
function PublicUtility() {
  return <Shell name="utility"><div className="ref-utility-banner">THE FIRST PILOT · FIVE ONTARIO HOSPITALS · DRAFT STAGE</div><Header /><main><section className="ref-utility-hero"><h1>Less guessing.<br /><span>More on record.</span></h1><div><p>Public spending shouldn't take a private investigation to understand.</p><a className="ref-utility-action" href="#ref-question">Explore the first inquiry ↗</a></div></section><section className="ref-utility-base" id="ref-question"><div className="ref-row"><h2>The agency nursing inquiry</h2><span>Pilot 01</span></div><div className="ref-utility-steps"><article><span>01 / ASK</span><h3>What did it cost?</h3><p>Spending, vendors and hours across five hospitals.</p></article><article><span>02 / REQUEST</span><h3>Follow the source.</h3><p>Publish the request text and track each response.</p></article><article><span>03 / SHARE</span><h3>Make it useful.</h3><p>An open dataset, with gaps and limitations intact.</p></article></div><QuestionDetails /></section><Method /></main></Shell>;
}
function WorkingFile() {
  const [section, setSection] = useState("Overview");
  return <Shell name="working"><Header><span className="ref-working-status">Prototype / Draft</span></Header><div className="ref-working-shell"><aside className="ref-working-sidebar"><span>WORKSPACE</span><h2>Agency nursing</h2><nav aria-label="Working file sections">{["Overview","Request draft","Publication plan"].map(label=><button key={label} aria-current={section===label ? "page" : undefined} onClick={()=>setSection(label)}>{label}<span>↗</span></button>)}</nav><p>Ontario pilot<br />Five institutions<br />Not yet filed</p></aside><main id="ref-question" aria-live="polite"><div className="ref-working-breadcrumb">Public inquiries / 001 / {section}</div>{section === "Overview" ? <><h1>The agency nursing<br />working file.</h1><p className="ref-working-lede">A clear view of what we want to find out,<br />what it might cost, and what comes next.</p><div className="ref-working-facts"><div><small>Initial filing estimate</small><b>$25</b></div><div><small>Institutions in scope</small><b>5 hospitals</b></div><div><small>Current stage</small><b>Draft</b></div></div><section className="ref-working-next"><span>NEXT STEP</span><h2>Check the scope before filing.</h2><p>Confirm the institutions, reporting period and wording. The request should be precise enough to return comparable records.</p><button onClick={()=>setSection("Request draft")}>Review the draft →</button></section></> : section === "Request draft" ? <><h1>Request draft</h1><Paper /><QuestionDetails title="Read scope and fee assumptions" /></> : <><h1>Publication plan</h1><p className="ref-working-lede">Keep the source material alongside the conclusions.</p><ol className="ref-publication-list"><li><h2>Original correspondence</h2><p>Publish request text and institution responses, with required redactions.</p></li><li><h2>Comparable data</h2><p>Provide a CSV and explain where reporting periods or definitions differ.</p></li><li><h2>Limitations</h2><p>Identify missing records, refusals and unresolved questions.</p></li></ol></>}<Method /></main></div></Shell>;
}

// These are original coded interpretations, not copies of template source or assets.
// Discovery trail: Designeer → Minimal Gallery → Templates → each live demo.
export const referenceConcepts = [
  { id: "public-goods", name: "21 Public goods", source: "Pulp", sourceUrl: "https://readymag.com/designs/6148389/", note: "Red type, fine rules and an equal-width catalogue; adapted from Pulp's product grid.", render: PublicGoods },
  { id: "masthead", name: "22 The masthead", source: "Clara", sourceUrl: "https://readymag.com/designs/6268201/", note: "A wide typographic nameplate, ruled sections and large underlined navigation.", render: Masthead },
  { id: "collection", name: "23 The collection", source: "Éponyme Club", sourceUrl: "https://eponyme-club.webflow.io/", note: "Numbered entries and an overview/index switch, translated from a photography portfolio.", render: Collection },
  { id: "plainspoken", name: "24 Plainspoken", source: "Dok / Kade", sourceUrl: "https://dok.framer.ai/", note: "A direct, sentence-led introduction instead of a conventional marketing hero.", render: Plainspoken },
  { id: "fieldwork", name: "25 Fieldwork", source: "Skørd", sourceUrl: "https://skord.framer.website/", note: "Condensed uppercase, stone tones and compact metadata; the request replaces the hero photograph.", render: Fieldwork },
  { id: "open-office", name: "26 Open office", source: "Sorae", sourceUrl: "https://sorae.framer.website/", note: "Cool blue, scattered small labels and a bottom-anchored nameplate, without the video background.", render: OpenOffice },
  { id: "reading-room", name: "27 Reading room", source: "Focus", sourceUrl: "https://focus-theme.pages.dev/", note: "Dark surround and a centred object display; documents replace the photographic collage.", render: ReadingRoom },
  { id: "common-table", name: "28 Common table", source: "Maravilla", sourceUrl: "https://maravilla.framer.website/", note: "A centred masthead and generous italic serif, scaled down into a calm civic publication.", render: CommonTable },
  { id: "public-utility", name: "29 Public utility", source: "Helios", sourceUrl: "https://helios-template.webflow.io/", note: "A narrow announcement band, split message/action and a pale inset lower section.", render: PublicUtility },
  { id: "working-file", name: "30 Working file", source: "Queue", sourceUrl: "https://queue.framer.ai/", note: "The framed workspace preview becomes the actual page; no SaaS hero or promotional badges.", render: WorkingFile },
];
