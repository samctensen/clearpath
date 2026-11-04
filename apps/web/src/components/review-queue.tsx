"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight, ClipboardList, FileText, Plus, Search, TriangleAlert } from "lucide-react";
import { formatLabels, productIds, productLabels, statusLabels, type CaseStatus, type CaseSummary, type ProductId } from "@clearpath/contracts";
import { useResource } from "@/lib/use-resource";
import { CaseStatusBadge, ErrorMessage, formatDate, Loading } from "./ui";
import { useDemoRole } from "./workspace";

const statuses: ("all" | CaseStatus)[] = ["all", "ready_for_review", "needs_information", "changes_requested", "approved"];

export function ReviewQueue() {
  const role = useDemoRole();
  const resource = useResource<CaseSummary[]>("/cases");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [product, setProduct] = useState<ProductId | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const cases = resource.data ?? [];
  const visible = cases
    .filter((item) => status === "all" || item.status === status)
    .filter((item) => product === "all" || item.productId === product)
    .filter((item) => `${item.title} ${item.publisher}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (sort === "asc" ? 1 : -1) * a.launchDate.localeCompare(b.launchDate) || b.updatedAt.localeCompare(a.updatedAt));

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{role === "reviewer" ? "Review queue" : "Submissions"}</h1>
          <p>{role === "reviewer" ? "Review marketing copy and track submissions through approval." : "Submit marketing copy, see feedback, and follow each revision."}</p>
        </div>
        <Link href="/new" className="button primary"><Plus size={18} aria-hidden="true" />New submission</Link>
      </div>
      <section className="queue-panel" aria-label="Submissions">
        <div className="status-filters" role="group" aria-label="Filter by status">
          {statuses.map((option) => (
            <button type="button" key={option} aria-pressed={status === option} onClick={() => setStatus(option)}>
              {option === "all" ? "All submissions" : statusLabels[option]}
              {resource.data && <span>{option === "all" ? cases.length : cases.filter((item) => item.status === option).length}</span>}
            </button>
          ))}
        </div>
        <div className="queue-toolbar">
          <label className="search-field">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search campaigns or publishers</span>
            <input type="search" placeholder="Search campaigns or publishers" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select aria-label="Filter by product" value={product} onChange={(event) => setProduct(event.target.value as ProductId | "all")}>
            <option value="all">All products</option>
            {productIds.map((id) => <option value={id} key={id}>{productLabels[id]}</option>)}
          </select>
          <button type="button" className="button secondary small mobile-sort" aria-label={sort === "asc" ? "Sort latest launch first" : "Sort earliest launch first"} onClick={() => setSort(sort === "asc" ? "desc" : "asc")}>
            Target date {sort === "asc" ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />}
          </button>
        </div>
        {resource.loading ? <Loading label="Loading submissions" /> : resource.error ? (
          <div className="queue-error"><ErrorMessage message={resource.error} retry={resource.reload} /></div>
        ) : visible.length ? (
          <div className="table-scroll">
            <table className="queue-table">
              <thead>
                <tr>
                  <th scope="col">Campaign</th><th scope="col">Product</th><th scope="col">Format</th><th scope="col">Findings</th>
                  <th scope="col" aria-sort={sort === "asc" ? "ascending" : "descending"}>
                    <button type="button" className="sort-control" onClick={() => setSort(sort === "asc" ? "desc" : "asc")}>
                      Target date {sort === "asc" ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />}
                    </button>
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link className="campaign-link" href={`/cases/${encodeURIComponent(item.id)}`}>
                        <span className="file-mark"><FileText size={17} aria-hidden="true" /></span>
                        <span><strong>{item.title}</strong><small>{item.publisher}</small></span>
                      </Link>
                    </td>
                    <td>{productLabels[item.productId]}</td>
                    <td>{formatLabels[item.format]}</td>
                    <td>
                      <div className="queue-counts">
                        {item.findings > 0 && <span className="concern-count"><TriangleAlert size={13} aria-hidden="true" />{item.findings} {item.findings === 1 ? "finding" : "findings"}</span>}
                        {item.unknowns > 0 && <span className="muted">{item.unknowns} unknown</span>}
                        {item.findings === 0 && item.unknowns === 0 && <span className="muted">None</span>}
                      </div>
                    </td>
                    <td><time dateTime={item.launchDate}>{formatDate(item.launchDate)}</time></td>
                    <td><CaseStatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="queue-empty">
            <span className="empty-icon"><ClipboardList size={27} aria-hidden="true" /></span>
            <h2>{cases.length ? "No matching submissions" : "No submissions yet"}</h2>
            <p>{cases.length ? "Try another search or change the filters." : "Add a campaign to run copy checks and start the review."}</p>
            {cases.length ? <button className="button secondary" type="button" onClick={() => { setSearch(""); setProduct("all"); setStatus("all"); }}>Clear filters</button> : <Link href="/new" className="button secondary">Start a submission<ChevronRight size={16} aria-hidden="true" /></Link>}
          </div>
        )}
        {!resource.loading && !resource.error && <footer className="queue-footer">Showing {visible.length} of {cases.length} submissions</footer>}
      </section>
    </>
  );
}
