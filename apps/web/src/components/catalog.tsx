"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productLabels, type Offer } from "@clearpath/contracts";
import type { CatalogData } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import { ErrorMessage, buttonClass, cn, formatDate } from "./ui";
import { PageHeader } from "./ui/page-header";
import { useDemoRole } from "./workspace";
import { styles } from "./catalog.styles";

const icons = { card: "credit-card", personal_loan: "landmark", mortgage: "house" };
const terms = {
  aprMin: ["Minimum APR", "%"],
  aprMax: ["Maximum APR", "%"],
  introApr: ["Intro APR", "%"],
  introMonths: ["Intro period", " months"],
  ongoingApr: ["Ongoing APR", "%"],
  annualFee: ["Annual fee", ""],
  minMonths: ["Minimum term", " months"],
  maxMonths: ["Maximum term", " months"],
} as const;

/** `stacked` is the label-and-value rows used in the library's own terms column. */
export function OfferTerms({ offer, stacked = false }: { offer: Offer; stacked?: boolean }) {
  const keys = (Object.keys(terms) as (keyof typeof terms)[]).filter((key) => offer.terms[key] !== undefined);
  return keys.length ? (
    <dl className={stacked ? styles.termsStacked : styles.termsGrid}>
      {keys.map((key) => {
        const [label, unit] = terms[key];
        return <div key={key}><dt>{label}</dt><dd>{key === "annualFee" ? "$" : ""}{offer.terms[key]}{unit}</dd></div>;
      })}
    </dl>
  ) : null;
}

export function Catalog() {
  const role = useDemoRole();
  const { data, loading, error, reload } = useResource<CatalogData>("/catalog");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const offer = data?.offers.find((item) => item.id === selectedId) ?? data?.offers[0];

  useEffect(() => {
    function selectFromHash() {
      if (!data) return;
      const linkedOffer = data.offers.find((item) => `#${encodeURIComponent(item.id)}` === window.location.hash);
      setSelectedId(linkedOffer?.id ?? data.offers[0]?.id ?? null);
    }
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [data]);

  useEffect(() => {
    if (offer && window.location.hash === `#${encodeURIComponent(offer.id)}`) {
      document.getElementById(offer.id)?.scrollIntoView({ block: "start" });
    }
  }, [offer?.id]);

  return (
    <div className={styles.page}>
      <PageHeader title="Offer library" description="Current offer terms and approved example copy." actions={data ? <Link href="/policies" className={styles.policy}><DashboardIcon name="shield-check" size={14} />Policy {data.policyVersion}<DashboardIcon name="arrow-right" size={11} /></Link> : undefined} />
      {error && <div className={styles.error}><ErrorMessage message={error} retry={reload} /></div>}
      {loading && !data && <CatalogSkeleton />}
      {data && data.offers.length === 0 && <div className={styles.empty}><DashboardIcon name="book-open" size={27} /><h2>No offers in the library</h2><p>{role === "submitter" ? "You can still prepare a submission using unknown offer context." : "Submissions are reviewed against unknown offer context until the library is filled."}</p>{role === "submitter" && <Link href="/new" className={buttonClass({ variant: "secondary" })}>Start a submission<DashboardIcon name="arrow-right" size={14} /></Link>}</div>}
      {data && offer && (
        <div className={styles.layout}>
          <aside className={styles.index}>
            <div className={styles.indexHeading}><h2>Browse offers</h2><span>{data.offers.length}</span></div>
            <nav aria-label="Choose an offer" className={styles.indexNav}>
              {data.offers.map((item) => <a href={`#${encodeURIComponent(item.id)}`} key={item.id} className={styles.indexLink} aria-current={item.id === offer.id ? "true" : undefined}><DashboardIcon name={icons[item.productId]} size={17} /><span><small>{productLabels[item.productId]}</small><strong>{item.name}</strong></span><DashboardIcon name="chevron-right" size={11} /></a>)}
            </nav>
            <p className={styles.indexNote}>{role === "submitter" ? "Use these terms to check a claim, or start a submission from an example." : "Use these terms to check a claim against the approved example copy."}</p>
          </aside>
          <div className={styles.references}>
              <article key={offer.id} id={offer.id} className={styles.offer} aria-labelledby={`${offer.id}-title`}>
                <header className={styles.offerHeader}>
                  <div className={styles.productMark}><DashboardIcon name={icons[offer.productId]} size={20} /></div>
                  <div className={styles.offerTitle}><span>{productLabels[offer.productId]}</span><h2 id={`${offer.id}-title`}>{offer.name}</h2></div>
                  <span className={styles.version}>Version {offer.version}</span>
                </header>
                <div className={styles.offerIntro}><p>{offer.description}</p><div className={styles.dates}><DashboardIcon name="calendar-days" size={14} /><span>Offer dates <time dateTime={offer.availableFrom}>{formatDate(offer.availableFrom)}</time> – <time dateTime={offer.availableUntil}>{formatDate(offer.availableUntil)}</time></span></div></div>
                <div className={styles.referenceBody}>
                  <section className={styles.termSection} aria-label={`${offer.name} terms`}><h3>Offer terms</h3>{Object.values(offer.terms).some((value) => value !== undefined) ? <OfferTerms offer={offer} stacked /> : <p className={styles.noTerms}>No numeric terms are supplied for this offer.</p>}</section>
                  <section className={styles.example} aria-label={`${offer.name} approved example`}>
                    <h3>Approved example copy</h3>
                    <blockquote>{offer.approvedCopy}</blockquote>
                    {offer.notes.length > 0 && <div className={styles.notes}><h4>Keep in mind</h4><ul>{offer.notes.map((note) => <li key={note}>{note}</li>)}</ul></div>}
                  </section>
                </div>
                {role === "submitter" && <footer className={styles.offerFooter}><p>Adapt the example to your campaign, then submit it for review.</p><Link className={buttonClass({ variant: "secondary" })} href={`/new?example=${encodeURIComponent(offer.id)}`}>Start with this example<DashboardIcon name="arrow-up-right" size={14} /></Link></footer>}
              </article>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className={styles.layout} role="status" aria-label="Loading offers" aria-busy="true">
      <div className={styles.index} aria-hidden="true"><div className={styles.indexHeading}><h2>Browse offers</h2></div><div className={styles.loadingIndex}>{Array.from({ length: 3 }, (_, index) => <span key={index} className={styles.skeleton} />)}</div></div>
      <div className={styles.references} aria-hidden="true"><div className={styles.offer}><div className={styles.loadingOffer}><span className={cn(styles.skeleton, styles.loadingTitle)} /><span className={styles.skeleton} /><div className={styles.loadingColumns}><span className={styles.skeleton} /><span className={styles.skeleton} /></div></div></div></div>
    </div>
  );
}
