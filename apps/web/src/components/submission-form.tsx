"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, FileText, Info } from "lucide-react";
import {
  assetFormats, formatLabels, productIds, productLabels, submissionSchema,
  type Analysis, type AssetFormat, type CaseDetail, type Offer, type ProductId, type SubmissionInput,
} from "@clearpath/contracts";
import { api, errorMessage, type CatalogData } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { AnalysisSummary, CheckEvidence } from "./check-evidence";
import { ErrorMessage, Loading } from "./ui";
import { useDemoRole } from "./workspace";

const emptyInput: SubmissionInput = {
  title: "", productId: "unknown", offerId: null, publisher: "", format: "unknown",
  launchDate: "", content: "", completeAsset: true, linksToApplication: null, substantiation: "",
};

export function NewSubmission() {
  const router = useRouter();
  const exampleId = useSearchParams().get("example");
  const catalog = useResource<CatalogData>("/catalog");
  const offer = catalog.data?.offers.find((candidate) => candidate.id === exampleId);
  const startingInput = offer ? { ...emptyInput, productId: offer.productId, offerId: offer.id, content: offer.approvedCopy } : emptyInput;

  return (
    <>
      <Link href="/" className="back-link"><ArrowLeft size={16} aria-hidden="true" />Review queue</Link>
      <div className="page-heading"><div><h1>New submission</h1><p>Add campaign details and the marketing copy you want reviewed.</p></div></div>
      {catalog.loading ? <Loading label="Loading submission form" /> : (
        <SubmissionForm
          key={offer?.id ?? "blank"}
          initial={startingInput}
          catalog={catalog}
          onCancel={() => router.push("/")}
          onSave={(input, role) => api<CaseDetail>("/cases", { body: input, role })}
          onSaved={(detail) => router.push(`/cases/${encodeURIComponent(detail.case.id)}`)}
        />
      )}
    </>
  );
}

type CatalogResource = Pick<ReturnType<typeof useResource<CatalogData>>, "data" | "loading" | "error" | "reload">;

export function SubmissionForm({ initial, catalog, revision, onSave, onSaved, onCancel }: {
  initial: SubmissionInput;
  catalog: CatalogResource;
  revision?: number;
  onSave: (input: SubmissionInput, role: ReturnType<typeof useDemoRole>) => Promise<CaseDetail>;
  onSaved: (detail: CaseDetail) => void;
  onCancel: () => void;
}) {
  const role = useDemoRole();
  const [input, setInput] = useState(initial);
  const [preview, setPreview] = useState<Analysis | null>(null);
  const [pending, setPending] = useState<"analyze" | "save" | null>(null);
  const [error, setError] = useState("");
  const offers: Offer[] = catalog.data?.offers ?? [];
  const matchingOffers = offers.filter((offer) => offer.productId === input.productId);

  function update<K extends keyof SubmissionInput>(key: K, value: SubmissionInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
    setPreview(null);
  }

  function changeProduct(productId: ProductId) {
    setInput((current) => ({
      ...current,
      productId,
      offerId: offers.find((offer) => offer.productId === productId)?.id ?? null,
    }));
    setPreview(null);
  }

  function changeFormat(format: AssetFormat) {
    setInput((current) => ({
      ...current,
      format,
      linksToApplication: format === "banner" ? current.linksToApplication : null,
    }));
    setPreview(null);
  }

  async function run(mode: "analyze" | "save") {
    if (pending) return;
    setError("");
    const parsed = submissionSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${fieldNames[issue.path[0] as keyof SubmissionInput] ?? "Submission"}: ${issue.message}`);
      return;
    }
    setPending(mode);
    try {
      if (mode === "analyze") {
        setPreview(null);
        setPreview(await api<Analysis>("/analyze", { body: parsed.data, role }));
      } else {
        onSaved(await onSave(parsed.data, role));
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(null);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (revision === undefined || role === "submitter") void run("save");
  }

  const cannotRevise = revision !== undefined && role !== "submitter";
  return (
    <div className="submission-layout">
      <form className="panel submission-form" onSubmit={submit}>
        <fieldset disabled={Boolean(pending)} className="form-fields">
          <section className="form-section">
            <div className="section-title"><FileText size={19} aria-hidden="true" /><h2>Campaign details</h2></div>
            <div className="form-grid">
              <label className="field field-wide">Campaign title
                <input required minLength={3} maxLength={160} value={input.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Spring card launch" />
              </label>
              <label className="field">Publisher or partner
                <input required minLength={2} maxLength={100} value={input.publisher} onChange={(event) => update("publisher", event.target.value)} placeholder="e.g. ClearPath Marketing" />
              </label>
              <label className="field">Target launch date
                <input type="date" required value={input.launchDate} onChange={(event) => update("launchDate", event.target.value)} />
              </label>
              <label className="field">Product
                <select value={input.productId} onChange={(event) => changeProduct(event.target.value as ProductId)}>
                  {productIds.map((product) => <option value={product} key={product}>{productLabels[product]}</option>)}
                </select>
              </label>
              <label className="field">Offer
                <select value={input.offerId ?? ""} onChange={(event) => update("offerId", event.target.value || null)}>
                  <option value="">Unknown offer</option>
                  {input.offerId && !matchingOffers.some((offer) => offer.id === input.offerId) && <option value={input.offerId}>Current offer ({input.offerId})</option>}
                  {matchingOffers.map((offer) => <option value={offer.id} key={offer.id}>{offer.name}</option>)}
                </select>
              </label>
              <label className="field">Asset format
                <select value={input.format} onChange={(event) => changeFormat(event.target.value as AssetFormat)}>
                  {assetFormats.map((format) => <option value={format} key={format}>{formatLabels[format]}</option>)}
                </select>
              </label>
              <label className="field">Copy provided
                <select value={input.completeAsset ? "complete" : "excerpt"} onChange={(event) => update("completeAsset", event.target.value === "complete")}>
                  <option value="complete">Complete asset</option><option value="excerpt">Excerpt only</option>
                </select>
              </label>
              {input.format === "banner" && <label className="field field-wide">Does the banner link to an application?
                <select value={input.linksToApplication === null ? "" : String(input.linksToApplication)} onChange={(event) => update("linksToApplication", event.target.value === "" ? null : event.target.value === "true")}>
                  <option value="">Unknown</option><option value="true">Yes</option><option value="false">No</option>
                </select>
              </label>}
            </div>
            {catalog.error && <ErrorMessage message={`Offer library unavailable. ${catalog.error}`} retry={catalog.reload} />}
          </section>
          <section className="form-section">
            <div className="section-title"><ClipboardCheck size={19} aria-hidden="true" /><h2>Copy and evidence</h2></div>
            <label className="field">Marketing copy
              <textarea required minLength={10} maxLength={20000} rows={8} value={input.content} onChange={(event) => update("content", event.target.value)} placeholder="Paste the text as it will appear to customers, including disclosures." />
            </label>
            <label className="field"><span>Supporting evidence <small>Optional</small></span>
              <textarea maxLength={4000} rows={3} value={input.substantiation} onChange={(event) => update("substantiation", event.target.value)} placeholder="Include supporting context for claims that need human review." />
            </label>
          </section>
        </fieldset>
        <div className="form-actions">
          {cannotRevise && <p className="muted">Switch to Submitter to submit this revision.</p>}
          <ErrorMessage message={error} />
          <div className="action-row">
            <button className="button ghost" type="button" disabled={Boolean(pending)} onClick={onCancel}>Cancel</button>
            <button className="button secondary" type="button" disabled={Boolean(pending)} onClick={(event) => {
              if (event.currentTarget.form?.reportValidity()) void run("analyze");
            }}><ClipboardCheck size={17} aria-hidden="true" />{pending === "analyze" ? "Running checks…" : "Run checks"}</button>
            <button className="button primary" type="submit" disabled={Boolean(pending) || cannotRevise}>
              {pending === "save" ? "Submitting…" : revision === undefined ? "Submit for review" : "Submit new revision"}<ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>
      <aside className="submission-side" aria-label="Self-check">
        <div className="panel side-note">
          <Info size={19} aria-hidden="true" /><div><h2>Copy review only</h2><p>Checks cover submitted text. Visual placement and presentation require separate review.</p></div>
        </div>
        <section className="panel preview-panel">
          <h2>Self-check</h2>
          {!preview && <p className="muted" role="status">{pending === "analyze" ? "Running checks against your current draft…" : "Run checks to see findings before sending this copy to a reviewer."}</p>}
          {preview && (
            <div aria-live="polite">
              <p className="muted">{preview.scope}</p>
              <AnalysisSummary analysis={preview} />
              <p className="panel-caption muted">Policy {preview.policyVersion} · Offer version {preview.offerVersion ?? "unknown"}</p>
              <div className="check-list">{preview.checks.map((check) => <CheckEvidence key={check.ruleId} check={check} />)}</div>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}

const fieldNames: Record<keyof SubmissionInput, string> = {
  title: "Campaign title", productId: "Product", offerId: "Offer", publisher: "Publisher", format: "Asset format",
  launchDate: "Target launch date", content: "Marketing copy", completeAsset: "Copy provided", linksToApplication: "Application link", substantiation: "Supporting evidence",
};
