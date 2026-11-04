"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  assetFormats, formatLabels, productIds, productLabels, submissionSchema,
  type Analysis, type AssetFormat, type CaseDetail, type Offer, type ProductId, type SubmissionInput,
} from "@clearpath/contracts";
import { api, errorMessage, type CatalogData } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { AnalysisSummary, CheckEvidence } from "./check-evidence";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import { ErrorMessage } from "./ui";
import { CustomSelect } from "./ui/custom-select";
import { PageHeader } from "./ui/page-header";
import { useDemoRole } from "./workspace";
import styles from "./submission-form.module.css";

const emptyInput: SubmissionInput = {
  title: "", productId: "unknown", offerId: null, publisher: "", format: "unknown",
  launchDate: "", content: "", completeAsset: true, linksToApplication: null, substantiation: "",
};

export function NewSubmission() {
  const searchParams = useSearchParams();
  const exampleId = searchParams.get("example");
  const requestedProduct = searchParams.get("product");
  const productId = productIds.find((product) => product === requestedProduct) ?? "unknown";
  const catalog = useResource<CatalogData>("/catalog");

  return (
    <div className={styles.page}>
      <PageHeader title="New submission" description="Prepare campaign copy for review." back={{ href: "/", label: "Review queue" }} />
      <NewSubmissionDraft key={exampleId ?? productId} exampleId={exampleId} productId={productId} catalog={catalog} />
    </div>
  );
}

type CatalogResource = Pick<ReturnType<typeof useResource<CatalogData>>, "data" | "loading" | "error" | "reload">;

function NewSubmissionDraft({ exampleId, productId, catalog }: { exampleId: string | null; productId: ProductId; catalog: CatalogResource }) {
  const router = useRouter();
  const [startingInput, setStartingInput] = useState<SubmissionInput | null>(null);

  // Wait for a successful catalog response before resolving a requested example.
  // Once the form is mounted, a catalog retry must not replace an unsent draft.
  useEffect(() => {
    if (catalog.loading || startingInput !== null || (exampleId && !catalog.data)) return;
    const offer = catalog.data?.offers.find((candidate) => candidate.id === exampleId);
    setStartingInput(offer ? { ...emptyInput, productId: offer.productId, offerId: offer.id, content: offer.approvedCopy } : { ...emptyInput, productId });
  }, [catalog.data, catalog.loading, exampleId, productId, startingInput]);

  if (startingInput === null) {
    const exampleError = exampleId ? catalog.error : "";
    return <>
      {exampleError && <div className={styles.exampleError}>
        <ErrorMessage message={`Could not load the requested example. ${exampleError}`} retry={catalog.reload} />
        <Link href="/new">Start a blank submission</Link>
      </div>}
      <SubmissionSkeleton paused={Boolean(exampleError)} />
    </>;
  }

  return (
    <SubmissionForm
      initial={startingInput}
      catalog={catalog}
      onCancel={() => router.push("/")}
      onSave={(input, role) => api<CaseDetail>("/cases", { body: input, role })}
      onSaved={(detail) => router.push(`/cases/${encodeURIComponent(detail.case.id)}`)}
    />
  );
}

function SubmissionSkeleton({ paused = false }: { paused?: boolean }) {
  return (
    <div className={`${styles.layout} ${paused ? styles.paused : ""}`} role={paused ? undefined : "status"} aria-label={paused ? undefined : "Loading submission form"} aria-busy={!paused}>
      <div className={styles.editor} aria-hidden="true">
        <div className={styles.section}>
          <h2>Campaign context</h2>
          <div className={styles.loadingFields}>{Array.from({ length: 7 }, (_, index) => <div className={`${styles.skeleton} ${index === 0 ? styles.wide : ""}`} key={index} />)}</div>
        </div>
        <div className={styles.section}><h2>Marketing copy</h2><div className={`${styles.skeleton} ${styles.loadingCopy}`} /></div>
      </div>
      <div className={styles.rail} aria-hidden="true"><div className={styles.checkPanel}><h2>Self-check</h2><div className={`${styles.skeleton} ${styles.loadingCheck}`} /></div></div>
    </div>
  );
}

export function SubmissionForm({ initial, catalog, revision, onSave, onSaved, onCancel }: {
  initial: SubmissionInput;
  catalog: CatalogResource;
  revision?: number;
  onSave: (input: SubmissionInput, role: ReturnType<typeof useDemoRole>) => Promise<CaseDetail>;
  onSaved: (detail: CaseDetail) => void;
  onCancel: () => void;
}) {
  const role = useDemoRole();
  const fieldId = useId();
  const [input, setInput] = useState(initial);
  const [preview, setPreview] = useState<Analysis | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [pending, setPending] = useState<"analyze" | "save" | null>(null);
  const [error, setError] = useState("");
  const [errorTarget, setErrorTarget] = useState<"analyze" | "save">("save");
  const offers: Offer[] = catalog.data?.offers ?? [];
  const matchingOffers = offers.filter((offer) => offer.productId === input.productId);
  const selectedOffer = offers.find((offer) => offer.id === input.offerId);
  const isPending = Boolean(pending);

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
    setErrorTarget(mode);
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
        setHasChecked(true);
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
  const offerOptions = [
    { value: "", label: "Unknown offer" },
    ...(input.offerId && !matchingOffers.some((offer) => offer.id === input.offerId) ? [{ value: input.offerId, label: `Current offer (${input.offerId})` }] : []),
    ...matchingOffers.map((offer) => ({ value: offer.id, label: offer.name, description: `Version ${offer.version}` })),
  ];

  return (
    <form className={styles.layout} onSubmit={submit}>
      <div className={styles.editor}>
        <fieldset disabled={isPending} className={styles.fields}>
          <section className={styles.section} aria-labelledby={`${fieldId}-context`}>
            <div className={styles.sectionHeading}>
              <div><h2 id={`${fieldId}-context`}>Campaign context</h2><p>Give your reviewer the details behind the copy.</p></div>
              {revision !== undefined && <span className={styles.revision}>Revision {revision + 1}</span>}
            </div>
            <div className={styles.fieldGrid}>
              <label className={`${styles.field} ${styles.wide}`}>Campaign title
                <input required minLength={3} maxLength={160} value={input.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Spring card launch" />
              </label>
              <label className={styles.field}>Publisher or partner
                <input required minLength={2} maxLength={100} value={input.publisher} onChange={(event) => update("publisher", event.target.value)} placeholder="e.g. ClearPath Marketing" />
              </label>
              <label className={styles.field}>Target launch date
                <input type="date" required value={input.launchDate} onChange={(event) => update("launchDate", event.target.value)} />
              </label>
              <div className={styles.field}><label htmlFor={`${fieldId}-product`}>Product</label>
                <CustomSelect id={`${fieldId}-product`} label="Product" value={input.productId} options={productIds.map((product) => ({ value: product, label: productLabels[product] }))} onChange={(value) => changeProduct(value as ProductId)} disabled={isPending} />
              </div>
              <div className={styles.field}><label htmlFor={`${fieldId}-offer`}>Offer</label>
                <CustomSelect id={`${fieldId}-offer`} label="Offer" value={input.offerId ?? ""} options={offerOptions} onChange={(value) => update("offerId", value || null)} disabled={isPending} />
              </div>
              <div className={styles.field}><label htmlFor={`${fieldId}-format`}>Asset format</label>
                <CustomSelect id={`${fieldId}-format`} label="Asset format" value={input.format} options={assetFormats.map((format) => ({ value: format, label: formatLabels[format] }))} onChange={(value) => changeFormat(value as AssetFormat)} disabled={isPending} />
              </div>
              <div className={styles.field}><label htmlFor={`${fieldId}-complete`}>Copy provided</label>
                <CustomSelect id={`${fieldId}-complete`} label="Copy provided" value={input.completeAsset ? "complete" : "excerpt"} options={[{ value: "complete", label: "Complete asset" }, { value: "excerpt", label: "Excerpt only" }]} onChange={(value) => update("completeAsset", value === "complete")} disabled={isPending} />
              </div>
              {input.format === "banner" && <div className={`${styles.field} ${styles.wide}`}><label htmlFor={`${fieldId}-application`}>Does the banner link to an application?</label>
                <CustomSelect id={`${fieldId}-application`} label="Does the banner link to an application?" value={input.linksToApplication === null ? "" : String(input.linksToApplication)} options={[{ value: "", label: "Unknown" }, { value: "true", label: "Yes" }, { value: "false", label: "No" }]} onChange={(value) => update("linksToApplication", value === "" ? null : value === "true")} disabled={isPending} />
              </div>}
            </div>
            {catalog.error && <div className={styles.catalogError}><ErrorMessage message={`Offer library unavailable. ${catalog.error}`} retry={catalog.reload} /></div>}
          </section>
          <section className={styles.section} aria-labelledby={`${fieldId}-copy-heading`}>
            <div className={styles.sectionHeading}><div><h2 id={`${fieldId}-copy-heading`}>Copy and evidence</h2><p>Include the exact wording customers will see, with disclosures.</p></div><DashboardIcon name="file-lines" size={19} /></div>
            <label className={styles.field}><span className={styles.fieldLabel}>Marketing copy <small aria-hidden="true">{input.content.length.toLocaleString()} / 20,000</small></span>
              <textarea className={styles.copyInput} required minLength={10} maxLength={20000} rows={6} value={input.content} onChange={(event) => update("content", event.target.value)} placeholder="Paste the marketing copy here…" />
            </label>
            <label className={`${styles.field} ${styles.evidenceField}`}><span className={styles.fieldLabel}>Supporting evidence <small>Optional</small></span>
              <textarea maxLength={4000} rows={3} value={input.substantiation} onChange={(event) => update("substantiation", event.target.value)} placeholder="Add source details or supporting context for claims that need human review." />
            </label>
          </section>
        </fieldset>
        <div className={styles.formFooter}>
          {cannotRevise && <p className={styles.roleNote}>Switch to Submitter to submit this revision.</p>}
          {errorTarget === "save" && <ErrorMessage message={error} />}
          <div className={styles.submitRow}>
            <button className="button ghost" type="button" disabled={isPending} onClick={onCancel}>Cancel</button>
            <button className="button primary" type="submit" disabled={isPending || cannotRevise}>
              {pending === "save" ? "Submitting…" : revision === undefined ? "Submit for review" : "Submit new revision"}<DashboardIcon name="arrow-right" size={14} />
            </button>
          </div>
        </div>
      </div>
      <aside className={styles.rail} aria-label="Self-check and reference">
        <section className={styles.checkPanel} aria-labelledby={`${fieldId}-check`} aria-busy={pending === "analyze"}>
          <div className={styles.checkHeading}><span className={styles.checkIcon}><DashboardIcon name="list-check" size={18} /></span><h2 id={`${fieldId}-check`}>Self-check</h2></div>
          <p className={styles.checkIntro}>Check your draft for missing information and potential issues before review.</p>
          <button className={`button secondary ${styles.checkButton}`} type="button" disabled={isPending} onClick={(event) => {
            if (event.currentTarget.form?.reportValidity()) void run("analyze");
          }}><DashboardIcon name="list-check" size={15} />{pending === "analyze" ? "Running checks…" : preview ? "Run checks again" : "Run checks"}</button>
          {errorTarget === "analyze" && error && <div className={styles.checkError}><ErrorMessage message={error} /></div>}
          {!preview && <div className={styles.checkEmpty} role="status">
            {pending === "analyze" ? <><p>Checking your current draft…</p><div className={styles.checkSkeleton} aria-hidden="true">{Array.from({ length: 3 }, (_, index) => <span key={index} className={styles.skeleton} />)}</div></> : <><span className={styles.emptyDot} /><p>{hasChecked ? "Run checks again to see findings for the current draft." : "No checks run yet. Findings will appear here."}</p></>}
          </div>}
          {preview && (
            <div className={styles.previewBody} aria-live="polite">
              <p className={styles.scope}>{preview.scope}</p>
              <AnalysisSummary analysis={preview} />
              <div className={styles.checkVersions}><span>Policy {preview.policyVersion}</span><span>Offer version {preview.offerVersion ?? "unknown"}</span></div>
              <div className="check-list">{preview.checks.map((check) => <CheckEvidence key={check.ruleId} check={check} />)}</div>
            </div>
          )}
        </section>
        <section className={styles.reference}>
          <h3><DashboardIcon name="book-open" size={15} />Offer reference</h3>
          {selectedOffer ? <><p className={styles.offerName}>{selectedOffer.name}</p><p>Version {selectedOffer.version}</p><Link href={`/catalog#${encodeURIComponent(selectedOffer.id)}`} target="_blank" rel="noreferrer">View terms and example <DashboardIcon name="arrow-up-right" size={12} /><span className="sr-only"> (opens in a new tab)</span></Link></> : <><p>{input.offerId ? "This offer is not available in the loaded library." : "Choose an offer when known. Missing context may leave checks unable to evaluate."}</p><Link href="/catalog" target="_blank" rel="noreferrer">Browse offer library <DashboardIcon name="arrow-up-right" size={12} /><span className="sr-only"> (opens in a new tab)</span></Link></>}
        </section>
        <div className={styles.scopeNote}><DashboardIcon name="circle-info" size={16} /><p>Checks cover submitted text. Visual placement and presentation require separate review.</p></div>
      </aside>
    </form>
  );
}

const fieldNames: Record<keyof SubmissionInput, string> = {
  title: "Campaign title", productId: "Product", offerId: "Offer", publisher: "Publisher", format: "Asset format",
  launchDate: "Target launch date", content: "Marketing copy", completeAsset: "Copy provided", linksToApplication: "Application link", substantiation: "Supporting evidence",
};
