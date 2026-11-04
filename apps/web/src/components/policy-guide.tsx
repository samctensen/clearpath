"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { productLabels, type PolicyGuideData, type PolicyRule } from "@clearpath/contracts";
import { matchesPolicy } from "@/lib/reference-pages";
import { useResource } from "@/lib/use-resource";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import { CustomSelect } from "./ui/custom-select";
import { HeaderSearch, PageHeader } from "./ui/page-header";
import { ErrorMessage } from "./ui";
import styles from "./workspace-reference.module.css";

const sources = { product_fact: "Product references", regulatory_reference: "Regulatory references", company_policy: "Company policy" };
const productOptions = [{ value: "all", label: "All products" }, ...Object.entries(productLabels).map(([value, label]) => ({ value, label }))];

export function PolicyGuide() {
  const { data, loading, error, reload } = useResource<PolicyGuideData>("/policies");
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const indexHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const readHash = () => {
      setSelectedId(window.location.hash.slice(1));
      setQuery(""); setProduct("all");
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => { window.removeEventListener("hashchange", readHash); window.removeEventListener("popstate", readHash); };
  }, []);

  function clearSelection() {
    setSelectedId("");
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", url);
  }

  function showDetail() {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    const heading = document.getElementById("policy-detail-title");
    heading?.focus({ preventScroll: true }); heading?.scrollIntoView({ block: "start" });
  }

  function selectRule(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.hash = id;
    if (window.location.hash !== url.hash) window.history.pushState(null, "", url);
    if (id === selectedId) showDetail();
  }

  const rules = data?.rules.filter((rule) => matchesPolicy(rule, query, product)) ?? [];
  const selected = rules.find((rule) => rule.id === selectedId) ?? rules[0];
  const draftProduct = selected?.products.length === 1 ? selected.products[0] : product !== "all" ? product : null;

  useEffect(() => {
    if (selectedId && selected?.id === selectedId) showDetail();
  }, [selectedId, selected?.id]);

  return <div className={styles.page}>
    <PageHeader title="Policy guide" actions={<>
      <HeaderSearch label="Search the policy guide" placeholder="Search checks or example wording" value={query} onChange={(value) => { clearSelection(); setQuery(value); }} />
      <CustomSelect label="Filter policies by product" value={product} onChange={(value) => { clearSelection(); setProduct(value); }} options={productOptions} />
      <Link href={draftProduct ? `/new?product=${encodeURIComponent(draftProduct)}` : "/new"} className="button secondary">New submission</Link>
    </>} />
    {error && <ErrorMessage message={error} retry={reload} />}
    {loading && !data && <ReferenceLoading label="Loading policy guide" />}
    {data && rules.length === 0 && <div className={styles.empty}><DashboardIcon name="magnifying-glass" size={26} /><h2>No checks match your search</h2><p>Try another term or show all products.</p><button className="button secondary" onClick={() => { setQuery(""); setProduct("all"); }}>Clear filters</button></div>}
    {data && selected && <div className={styles.guideLayout}>
      <aside className={styles.guideIndex}>
        <div className={styles.sectionHeading}><h2 id="policy-list-title" ref={indexHeading} tabIndex={-1}>Review checks</h2><span aria-live="polite">{rules.length}</span></div>
        <nav aria-label="Review checks">{Object.entries(sources).map(([type, label]) => {
          const group = rules.filter((rule) => rule.reference.type === type);
          return group.length > 0 && <div className={styles.ruleGroup} key={type}><h3>{label}</h3>{group.map((rule) => <a key={rule.id} href={`#${rule.id}`} className={styles.ruleLink} aria-current={selected.id === rule.id ? "true" : undefined} onClick={(event) => selectRule(event, rule.id)}>{rule.title}</a>)}</div>;
        })}</nav>
        <div className={styles.indexNote}><span>Policy {data.policyVersion}</span></div>
      </aside>
      <PolicyDetail rule={selected} onBack={() => { indexHeading.current?.focus({ preventScroll: true }); indexHeading.current?.scrollIntoView({ block: "start" }); }} />
    </div>}
    <p className={styles.footerNote}>This guide covers the demo’s six text checks. A human makes the copy decision; layout and publication review remain separate.</p>
  </div>;
}

function PolicyDetail({ rule, onBack }: { rule: PolicyRule; onBack: () => void }) {
  return <article id="policy-detail" className={styles.guideDetail} aria-label={rule.title}>
    <header className={styles.guideHeader}>
      <div className={styles.sourceTag}><span>{sources[rule.reference.type]}</span>{rule.reference.type !== "regulatory_reference" && <span>Fictional demo</span>}<button type="button" className={styles.backToChecks} onClick={onBack}>Back to checks</button></div>
      <h2 id="policy-detail-title" tabIndex={-1}>{rule.title}</h2><p>{rule.summary}</p>
      <div className={styles.productTags}>{rule.products.length === 4 ? <span>All products</span> : rule.products.map((product) => <span key={product}>{productLabels[product]}</span>)}</div>
    </header>
    <section className={styles.guideSection}><h3>When this check applies</h3><p>{rule.appliesWhen}</p></section>
    <div className={styles.guidanceColumns}>
      <section className={styles.guideSection}><h3>Before you submit</h3><ul className={styles.checklist}>{rule.prepare.map((item) => <li key={item}><DashboardIcon name="check" size={12} /><span>{item}</span></li>)}</ul></section>
      <section className={styles.guideSection}><h3>What still needs judgment</h3><p>{rule.limits}</p></section>
    </div>
    <section className={styles.exampleSection}><h3>Example</h3><div className={styles.examples}>
      <div><span className={styles.attentionLabel}>{rule.id === "review-context" ? "Submitted context" : "Submitted wording"}</span><p>{rule.example.attention}</p></div>
      <div><span className={styles.exampleLabel}>{rule.id === "review-context" ? "More complete context" : "Alternative wording"}</span><p>{rule.example.better}</p></div>
    </div><p className={styles.exampleNote}>{rule.example.explanation}</p></section>
    <footer className={styles.sourceFooter}><div><h3>Source behind this check</h3><p>{rule.reference.label}</p></div>
      {rule.reference.url ? <a className="button secondary small" href={rule.reference.url} target="_blank" rel="noreferrer">Read source<DashboardIcon name="arrow-up-right" size={12} /></a> : rule.reference.type === "product_fact" ? <Link className="button secondary small" href="/catalog">Open offer library<DashboardIcon name="arrow-right" size={12} /></Link> : <span className={styles.readOnly}>Internal demo policy</span>}
    </footer>
  </article>;
}

export function ReferenceLoading({ label }: { label: string }) {
  return <div className={styles.loading} role="status" aria-label={label}><span className="sr-only">{label}</span><div /><div /><div /></div>;
}
