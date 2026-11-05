import type { PolicyRule } from "../contracts/mod.ts";
import { references, ruleIds, titles, type RuleId } from "./engine.ts";

// Guidance for the implemented checks; titles and citations come from the engine.
const guidance: Record<RuleId, Omit<PolicyRule, "id" | "title" | "reference">> = {
  "review-context": {
    summary: "Give the reviewer the complete picture before review starts.",
    products: ["card", "personal_loan", "mortgage", "unknown"],
    appliesWhen: "Every submission. The checker needs a known product and matching offer, the complete asset, a known format, and a launch date within the selected offer’s availability.",
    prepare: ["Select the product and offer that the copy promotes.", "Provide the complete copy and identify its format.", "Set the intended launch date; identify application links when relevant."],
    limits: "Missing context is reported as unable to evaluate. A future launch is checked against the offer dates, not the day the reviewer opens the case. Linked pages and visual layout are not inspected.",
    example: { attention: "A card headline submitted as an excerpt with an unknown format.", better: "The full landing-page copy, Everyday Credit Card offer, and an intended launch date.", explanation: "Complete context makes the bounded checks possible; it does not approve the asset." },
  },
  "offer-match": {
    summary: "Keep advertised rates and promotional periods tied to the selected offer.",
    products: ["card", "personal_loan", "mortgage", "unknown"],
    appliesWhen: "Copy states an APR or a card introductory period that can be compared with the selected offer snapshot.",
    prepare: ["Use the offer library to verify the applicable terms.", "Distinguish introductory and ongoing card APRs.", "Supply the underlying offer when advertising mortgage rates."],
    limits: "Ambiguous rates or unavailable terms cannot be verified. The mortgage prequalification offer has no rate data. Matching the catalog establishes consistency with that snapshot only.",
    example: { attention: "0% intro APR on purchases for 18 months, then 19.99% APR.", better: "0% intro APR on purchases for 12 months from account opening, then 19.99% APR.", explanation: "The Everyday Credit Card offer specifies 12 months. These examples illustrate this check only." },
  },
  "card-intro-label": {
    summary: "Make the introductory nature of a card rate explicit.",
    products: ["card"],
    appliesWhen: "Credit-card copy describes an introductory or promotional rate. The text check looks for a nearby introductory label.",
    prepare: ["Identify an introductory rate as introductory in the copy.", "Keep the label next to the rate so its meaning is clear."],
    limits: "This check assesses wording and proximity in plain text. It cannot assess equal prominence, font size, placement, or the rendered presentation.",
    example: { attention: "0% APR on purchases for 12 months, then 19.99% APR.", better: "0% intro APR on purchases for 12 months, then 19.99% APR.", explanation: "Adding the introductory label addresses this text check. Other requirements still need review." },
  },
  "card-promo-terms": {
    summary: "Show when a promotional rate ends and what rate follows.",
    products: ["card"],
    appliesWhen: "Complete, standalone card advertising promotes an introductory APR. A qualifying banner linked to an application is treated separately for this check.",
    prepare: ["Include the promotional period and the APR that follows it.", "For a banner, identify whether its destination is an application."],
    limits: "Unknown banner destinations leave applicability unresolved. The linked-banner exception is specific to this provision; it does not waive other checks. Applications and solicitations need separate assessment.",
    example: { attention: "0% intro APR on purchases. Apply today.", better: "0% intro APR on purchases for 12 months from account opening, then 19.99% APR.", explanation: "The offer supplies the period and later rate. The checker does not establish visual prominence." },
  },
  "loan-repayment": {
    summary: "Recognize repayment claims that need a fuller disclosure review.",
    products: ["personal_loan"],
    appliesWhen: "Personal-loan copy includes a specific payment count, repayment period, or payment amount recognized by the checker.",
    prepare: ["Provide the full repayment disclosures and underlying offer.", "Have a reviewer assess the triggered requirements in context."],
    limits: "This is a request for human verification. The checker does not validate amortization or certify repayment disclosures. Generic monthly-payment language and APR alone do not trigger this check.",
    example: { attention: "Repay your loan in 36 monthly payments.", better: "Monthly payments available. Subject to credit approval.", explanation: "The second example avoids a specific repayment trigger; it is not a replacement disclosure or a finding that the original claim is prohibited." },
  },
  "approval-claims": {
    summary: "Support approval promises with evidence a reviewer can evaluate.",
    products: ["card", "personal_loan", "mortgage", "unknown"],
    appliesWhen: "Copy asserts guaranteed approval, pre-approval, or that a customer is already approved, using phrasings recognized by the checker.",
    prepare: ["Provide substantiation for an approval assertion.", "Distinguish preliminary eligibility from a lending commitment.", "Ask a reviewer to evaluate the claim and supporting evidence together."],
    limits: "AC-1 is an internal ClearPath policy. A matched phrase is a concern for human judgment, not a legal conclusion. Supplied substantiation is not automatically verified. Straightforward negations should not be flagged.",
    example: { attention: "You’re already approved for your mortgage.", better: "Explore whether you may prequalify. Final approval is subject to underwriting.", explanation: "The HomeStart service offers preliminary eligibility, not a commitment to lend." },
  },
};

export const policyRules: PolicyRule[] = ruleIds.map((id) => ({
  id, title: titles[id], reference: references[id], ...guidance[id],
}));
