import type { Offer } from "../contracts/mod.ts";

export const POLICY_VERSION = "CP-2026.11-v1";
export const offers: Offer[] = [
  {
    id: "everyday-card", productId: "card", name: "Everyday Credit Card", version: "CARD-2026.11-v1",
    description: "A purchase-only card for everyday spending.",
    terms: { introApr: 0, introMonths: 12, ongoingApr: 19.99, annualFee: 0 },
    availableFrom: "2026-01-01", availableUntil: "2027-12-31",
    approvedCopy: "Meet the ClearPath Everyday Credit Card. 0% intro APR on purchases for 12 months from account opening, then 19.99% APR. No annual fee. Subject to credit approval.",
    notes: ["Purchase-only; no cash advances, balance transfers, or additional finance charges on this offer.", "Text checks do not assess visual prominence or all legal requirements."]
  },
  {
    id: "flex-personal", productId: "personal_loan", name: "Flex Personal Loan", version: "LOAN-2026.11-v1",
    description: "Fixed-rate installment loans for planned expenses.",
    terms: { aprMin: 9.99, aprMax: 24.99, minMonths: 24, maxMonths: 60 },
    availableFrom: "2026-01-01", availableUntil: "2027-12-31",
    approvedCopy: "Make room for your next chapter with a ClearPath Flex Personal Loan. Rates from 9.99% APR to 24.99% APR. Your rate depends on creditworthiness. Subject to credit approval.",
    notes: ["Payment amounts or specific terms require a separate repayment-disclosure review."]
  },
  {
    id: "home-start", productId: "mortgage", name: "HomeStart Prequalification", version: "HOME-2026.11-v1",
    description: "A preliminary eligibility check for a future home loan.",
    terms: {}, availableFrom: "2026-01-01", availableUntil: "2027-12-31",
    approvedCopy: "A clearer first step toward home. Explore whether you may prequalify for a mortgage with ClearPath HomeStart. Prequalification is not a commitment to lend. Final approval is subject to underwriting.",
    notes: ["This service supplies no mortgage rates.", "Rate and repayment claims require the underlying loan offer; the checker cannot verify them from this offer."]
  }
];
export const getOffer = (id: string | null): Offer | undefined => offers.find((offer) => offer.id === id);
