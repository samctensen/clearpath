"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CreditCard, House, Landmark } from "lucide-react";
import { productLabels, type Offer } from "@clearpath/contracts";
import type { CatalogData } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { ErrorMessage, formatDate, Loading } from "./ui";

const icons = { card: CreditCard, personal_loan: Landmark, mortgage: House };
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

export function OfferTerms({ offer }: { offer: Offer }) {
  const keys = (Object.keys(terms) as (keyof typeof terms)[]).filter((key) => offer.terms[key] !== undefined);
  return keys.length ? (
    <dl className="offer-terms">
      {keys.map((key) => {
        const [label, unit] = terms[key];
        return <div key={key}><dt>{label}</dt><dd>{key === "annualFee" ? "$" : ""}{offer.terms[key]}{unit}</dd></div>;
      })}
    </dl>
  ) : null;
}

export function Catalog() {
  const { data, loading, error, reload } = useResource<CatalogData>("/catalog");
  useEffect(() => {
    if (!data || !window.location.hash) return;
    const offer = data.offers.find((item) => `#${encodeURIComponent(item.id)}` === window.location.hash);
    if (offer) document.getElementById(offer.id)?.scrollIntoView({ block: "start" });
  }, [data]);
  return (
    <>
      <div className="page-heading">
        <div><h1>Offer library</h1><p>Look up fictional offer terms and approved example copy.</p></div>
        {data && <span className="version-label"><BookOpen size={15} aria-hidden="true" />Policy {data.policyVersion}</span>}
      </div>
      {loading ? <Loading label="Loading offers" /> : <ErrorMessage message={error} retry={reload} />}
      {data && (
        <div className="catalog-list">
          {data.offers.length === 0 && <div className="state-block">No offers are available in the library.</div>}
          {data.offers.map((offer) => {
            const Icon = icons[offer.productId];
            return (
              <article key={offer.id} id={offer.id} className="panel offer-card">
                <header className="offer-heading">
                  <span className="file-mark"><Icon size={21} aria-hidden="true" /></span>
                  <div><span className="muted">{productLabels[offer.productId]}</span><h2>{offer.name}</h2></div>
                  <span className="version-label">Version {offer.version}</span>
                </header>
                <p>{offer.description}</p>
                <p className="muted">Offer dates {formatDate(offer.availableFrom)} – {formatDate(offer.availableUntil)}</p>
                <OfferTerms offer={offer} />
                <div className="approved-example">
                  <h3>Approved example copy</h3>
                  <blockquote>{offer.approvedCopy}</blockquote>
                </div>
                {offer.notes.length > 0 && <ul className="offer-notes">{offer.notes.map((note) => <li key={note}>{note}</li>)}</ul>}
                <Link className="button secondary" href={`/new?example=${encodeURIComponent(offer.id)}`}>Use example in a submission<ArrowUpRight size={16} aria-hidden="true" /></Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
