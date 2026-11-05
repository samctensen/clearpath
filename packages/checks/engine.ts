import type {
  Analysis,
  CheckResult,
  CheckStatus,
  Offer,
  SubmissionInput,
} from "../contracts/mod.ts";
import { getOffer, POLICY_VERSION } from "./catalog.ts";

// Bounded, deterministic text checks. Each rule recognises a small, documented set of phrasings;
// anything outside that set is reported as unknown or left to human review, never guessed.

export const ruleIds = [
  "review-context",
  "offer-match",
  "card-intro-label",
  "card-promo-terms",
  "loan-repayment",
  "approval-claims",
] as const;
export type RuleId = typeof ruleIds[number];

type Reference = CheckResult["reference"];
type Excerpt = NonNullable<CheckResult["excerpt"]>;
type Span = { start: number; end: number };
type Segment = Span & { text: string };

const REG_Z_16 = "https://www.consumerfinance.gov/rules-policy/regulations/1026/16/";
const REG_Z_24 = "https://www.consumerfinance.gov/rules-policy/regulations/1026/24/";

export const titles: Record<RuleId, string> = {
  "review-context": "Review context is complete",
  "offer-match": "Advertised terms match the selected offer",
  "card-intro-label": "Introductory card rates are labeled",
  "card-promo-terms": "Card intro rate states its period and later rate",
  "loan-repayment": "Personal-loan repayment terms need full disclosure",
  "approval-claims": "Approval claims need substantiation",
};
const kinds: Record<RuleId, CheckResult["kind"]> = {
  "review-context": "context",
  "offer-match": "mismatch",
  "card-intro-label": "disclosure",
  "card-promo-terms": "disclosure",
  "loan-repayment": "disclosure",
  "approval-claims": "human_judgment",
};
export const references: Record<RuleId, Reference> = {
  "review-context": {
    label: "ClearPath offer catalog: product, offer and availability dates",
    type: "product_fact",
  },
  "offer-match": { label: "ClearPath offer catalog: offer terms", type: "product_fact" },
  "card-intro-label": {
    label: "Regulation Z §1026.16(g)(3): stating the term “introductory”",
    type: "regulatory_reference",
    url: REG_Z_16,
  },
  "card-promo-terms": {
    label:
      "Regulation Z §1026.16(g)(4)–(5): promotional period, post-promotional rate, linked banner exclusion",
    type: "regulatory_reference",
    url: REG_Z_16,
  },
  "loan-repayment": {
    label: "Regulation Z §1026.24(d): triggering terms in closed-end credit advertising",
    type: "regulatory_reference",
    url: REG_Z_24,
  },
  "approval-claims": {
    label: "ClearPath policy AC-1: approval and pre-approval claims",
    type: "company_policy",
  },
};

const result = (
  ruleId: RuleId,
  status: CheckStatus,
  explanation: string,
  extra: { severity?: CheckResult["severity"]; excerpt?: Excerpt; suggestion?: string } = {},
): CheckResult => ({
  ruleId,
  title: titles[ruleId],
  status,
  severity: extra.severity ??
    (status === "finding" ? "high" : status === "unknown" ? "medium" : "info"),
  kind: status === "unknown" ? "missing_information" : kinds[ruleId],
  explanation,
  reference: { ...references[ruleId] },
  ...(extra.excerpt ? { excerpt: extra.excerpt } : {}),
  ...(extra.suggestion ? { suggestion: extra.suggestion } : {}),
});

// ---------------------------------------------------------------------------------------------
// Text structure

const excerptOf = (content: string, span: Span): Excerpt => ({
  text: content.slice(span.start, span.end),
  start: span.start,
  end: span.end,
});

const cut = (content: string, span: Span, points: number[]): Segment[] => {
  const bounds = [
    ...new Set([span.start, ...points.filter((p) => p > span.start && p < span.end), span.end]),
  ]
    .sort((a, b) => a - b);
  return bounds.slice(0, -1).map((start, i) => ({
    start,
    end: bounds[i + 1],
    text: content.slice(start, bounds[i + 1]),
  }));
};

const sentencesOf = (content: string): Segment[] =>
  cut(
    content,
    { start: 0, end: content.length },
    [...content.matchAll(/[.!?]+(?=\s|$)|\n/g)].map((m) => m.index + m[0].length),
  );

// Clauses break at "; ", ", ", spaced dashes, and before "then"/"thereafter".
const clausesOf = (content: string, sentence: Segment): Segment[] =>
  cut(content, sentence, [
    ...[...sentence.text.matchAll(/[;,](?=\s)|\s[—–-]\s|—/g)].map((m) =>
      sentence.start + m.index + m[0].length
    ),
    ...[...sentence.text.matchAll(/\b(?:then|thereafter)\b/gi)].map((m) =>
      sentence.start + m.index
    ),
  ]);

const within = (span: Span, outer: Span) => span.start >= outer.start && span.end <= outer.end;
const same = (a: number, b: number | undefined) => b !== undefined && Math.abs(a - b) < 0.001;
const pct = (value: number | undefined) => `${value}%`;
const quote = (text: string) => `“${text.trim()}”`;

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  "twenty-one": 21,
  "twenty-four": 24,
  "thirty-six": 36,
  "forty-eight": 48,
  sixty: 60,
};
const NUM = `(\\d{1,3}|${Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).join("|")})`;
const toNumber = (raw: string) => NUMBER_WORDS[raw.toLowerCase()] ?? Number(raw);
const MONTHS = new RegExp(`(?<![\\w.$])${NUM}[\\s-]*(?:months?|mos?\\.?)(?!\\w)`, "gi");
const HAS_MONTHS = new RegExp(MONTHS.source, "i");
const YEARS = new RegExp(`(?<![\\w.$])${NUM}[\\s-]*(?:years?|yrs?\\.?)(?!\\w)`, "gi");

type Duration = Span & { months: number; sentence: Segment; clause: Segment };
const durationsOf = (content: string, clauses: Segment[], sentences: Segment[]): Duration[] =>
  [...content.matchAll(MONTHS)].map((m) => {
    const span = { start: m.index, end: m.index + m[0].length };
    return {
      ...span,
      months: toNumber(m[1]),
      sentence: sentences.find((s) => within(span, s))!,
      clause: clauses.find((c) => within(span, c)) ?? sentences.find((s) => within(span, s))!,
    };
  });

// ---------------------------------------------------------------------------------------------
// Rate extraction. A percentage counts only when "APR" (or rate/interest wording) is adjacent,
// so cash-back, fee, and discount percentages are ignored.

const MODIFIERS =
  "intro|introductory|promotional|promo|variable|fixed|ongoing|standard|regular|purchase";
const CONNECTORS =
  "is|are|of|at|as low as|from|starting at|starts at|starting from|just|only|range|ranges|ranging|between";
const APR_AFTER = new RegExp(
  `^\\s*(?:(?:${MODIFIERS})\\s+){0,3}(?:APRs?|annual percentage rates?)\\b`,
  "i",
);
const APR_BEFORE = new RegExp(
  `\\b(?:APRs?|annual percentage rates?)\\s*(?:(?:${CONNECTORS})\\s*|[:=–—-]\\s*)*$`,
  "i",
);
const RATE_AFTER = new RegExp(
  `^\\s*(?:(?:${MODIFIERS})\\s+){0,2}(?:interest(?:\\s+rates?)?|rates?)\\b`,
  "i",
);
const RATE_BEFORE = new RegExp(
  `\\b(?:rates?|interest(?:\\s+rates?)?)\\s*(?:(?:${CONNECTORS})\\s*|[:=]\\s*)*$`,
  "i",
);
const RANGE_JOIN = /^\s*(?:APRs?\s*)?(?:-|–|—|to|and|through)\s*$/i;
const PERCENT = /(?<![\d.])(\d{1,3}(?:\.\d{1,3})?)\s?(?:%|percent\b)/gi;

type Mention = Span & {
  value: number;
  explicitApr: boolean;
  pre: string;
  post: string;
  excerpt: Span;
  sentence: Segment;
  prev?: Mention;
  next?: Mention;
};

const mentionsIn = (sentence: Segment, clause: Segment): Mention[] => {
  const tokens = [...clause.text.matchAll(PERCENT)];
  const draft = tokens.map((m, i) => {
    const start = m.index, end = start + m[0].length;
    const pre = clause.text.slice(i ? tokens[i - 1].index + tokens[i - 1][0].length : 0, start);
    const post = clause.text.slice(
      end,
      i + 1 < tokens.length ? tokens[i + 1].index : clause.text.length,
    );
    const aprAfter = post.match(APR_AFTER), aprBefore = pre.match(APR_BEFORE);
    const after = aprAfter ?? post.match(RATE_AFTER), before = aprBefore ?? pre.match(RATE_BEFORE);
    return {
      start: clause.start + start,
      end: clause.start + end,
      value: Number(m[1]),
      pre,
      post,
      apr: Boolean(aprAfter || aprBefore),
      // Quote the percentage with its adjacent label ("8.99% APR", "APR of 0%", "0% interest").
      excerpt: {
        start: clause.start + start - (before ? pre.length - before.index! : 0),
        end: clause.start + end + (after ? after[0].length : 0),
      },
      rate: Boolean(after || before),
      sentence,
    };
  });
  // Ranges such as "9.99%–24.99% APR" or "from 9.99% to 24.99%" share one APR label.
  for (let changed = true; changed;) {
    changed = false;
    draft.forEach((d, i) => {
      if (d.apr) return;
      if (
        (RANGE_JOIN.test(d.post) && draft[i + 1]?.apr) ||
        (RANGE_JOIN.test(d.pre) && draft[i - 1]?.apr)
      ) {
        d.apr = changed = true;
      }
    });
  }
  // "…, then 19.99%." continues an APR statement made earlier in the same sentence.
  const continuation = /^\s*(?:then|thereafter)\b/i.test(clause.text) &&
    /\bAPRs?\b|annual percentage rate/i.test(sentence.text);
  const mentions: Mention[] = draft
    .map((d) => ({ ...d, apr: d.apr || continuation }))
    .filter((d) => d.apr || d.rate)
    .map((d) => ({
      start: d.start,
      end: d.end,
      value: d.value,
      explicitApr: d.apr,
      pre: d.pre,
      post: d.post,
      excerpt: d.excerpt,
      sentence: d.sentence,
    }));
  mentions.forEach((m, i) => {
    m.prev = mentions[i - 1];
    m.next = mentions[i + 1];
  });
  return mentions;
};

type Text = {
  content: string;
  sentences: Segment[];
  clauses: Segment[];
  mentions: Mention[];
  durations: Duration[];
};
const read = (content: string): Text => {
  const sentences = sentencesOf(content);
  const pairs = sentences.flatMap((sentence) =>
    clausesOf(content, sentence).map((clause) => ({ sentence, clause }))
  );
  const clauses = pairs.map((p) => p.clause);
  return {
    content,
    sentences,
    clauses,
    mentions: pairs.flatMap(({ sentence, clause }) => mentionsIn(sentence, clause)),
    durations: durationsOf(content, clauses, sentences),
  };
};

// ---------------------------------------------------------------------------------------------
// Card reading

const ONGOING_MARKER = new RegExp(
  [
    "\\b(?:then|thereafter|afterwards?|after that)\\b",
    "\\bafter\\s+(?:the\\s+|your\\s+|this\\s+)?(?:intro(?:ductory)?|promo(?:tional)?)\\s+(?:period|rate|APR)\\b",
    "\\bafter\\s+(?:the\\s+first\\s+)?\\d+\\s+months?\\b",
    "\\b(?:ongoing|standard|regular|go-to|variable|post-(?:intro(?:ductory)?|promo(?:tional)?))\\s+(?:purchase\\s+)?(?:APR|rate)\\b",
  ].join("|"),
  "i",
);
const INTRO_MARKER = /\b(?:intro|introductory|promotional|promo)\b/i;
const INTRO_LABEL = /\b(?:intro|introductory)\b/i;
const INTRO_CONTEXT = /\b(?:intro(?:ductory)?|promo(?:tional)?)\s+(?:APR|rate|period)\b/i;

type Role = "intro" | "ongoing" | "unqualified";
type CardRead = {
  roles: Map<Mention, Role>;
  intro: Mention[];
  ongoing: Mention[];
  unqualified: Mention[];
  introDurations: Duration[];
};

const cardRoleOf = (m: Mention): Role => {
  const window = m.pre + m.post;
  if (ONGOING_MARKER.test(window)) return "ongoing";
  if (INTRO_MARKER.test(window) || HAS_MONTHS.test(window)) return "intro";
  return "unqualified";
};

const readCard = (text: Text, offer: Offer | undefined): CardRead => {
  const roles = new Map(text.mentions.map((m) => [m, cardRoleOf(m)] as const));
  const introApr = offer?.terms.introApr;
  // With a selected offer, an unlabeled rate equal to the offer's intro rate is the intro rate.
  const valueIntro = (m: Mention) =>
    roles.get(m) === "unqualified" && introApr !== undefined &&
    !same(introApr, offer?.terms.ongoingApr) && same(m.value, introApr);
  const intro = text.mentions.filter((m) => roles.get(m) === "intro" || valueIntro(m));
  const introSentences = new Set(intro.map((m) => m.sentence));
  return {
    roles,
    intro,
    ongoing: text.mentions.filter((m) => roles.get(m) === "ongoing"),
    unqualified: text.mentions.filter((m) => roles.get(m) === "unqualified" && !valueIntro(m)),
    introDurations: text.durations.filter((d) =>
      introSentences.has(d.sentence) || INTRO_CONTEXT.test(d.clause.text)
    ),
  };
};

const hasIntroLabel = (m: Mention) =>
  INTRO_LABEL.test(`${m.pre.slice(-30)} ${m.post.slice(0, 30)}`);

// ---------------------------------------------------------------------------------------------
// Rules

type Context = {
  input: SubmissionInput;
  text: Text;
  selected: Offer | undefined; // offer that exists and matches the product
  card: CardRead;
};

const unknownProduct = (ruleId: RuleId, what: string) =>
  result(
    ruleId,
    "unknown",
    `The product is not identified, so whether ${what} applies cannot be determined. Select the product to evaluate this check.`,
  );

const reviewContext = ({ input }: Context, offer: Offer | undefined): CheckResult => {
  const gaps: string[] = [];
  if (input.productId === "unknown") gaps.push("the product is not identified");
  if (!input.offerId) gaps.push("no offer is selected");
  else if (!offer) gaps.push(`offer “${input.offerId}” is not in the catalog`);
  else if (input.productId !== "unknown" && offer.productId !== input.productId) {
    gaps.push(`the selected offer (${offer.name}) is for a different product`);
  }
  if (!input.completeAsset) gaps.push("only an excerpt was supplied, not the complete asset");
  if (input.format === "unknown") gaps.push("the asset format is unknown");

  const matched = offer && offer.productId === input.productId ? offer : undefined;
  const outside = matched &&
    (input.launchDate < matched.availableFrom || input.launchDate > matched.availableUntil);
  const gapText = gaps.length ? ` Also missing: ${gaps.join("; ")}.` : "";
  if (matched && outside) {
    return result(
      "review-context",
      "finding",
      `Planned launch ${input.launchDate} is outside ${matched.name} (${matched.version}) availability, ${matched.availableFrom} to ${matched.availableUntil}.${gapText}`,
      {
        suggestion:
          `Choose a launch date from ${matched.availableFrom} to ${matched.availableUntil}, or select the offer that will be available then.`,
      },
    );
  }
  if (gaps.length) {
    return result(
      "review-context",
      "unknown",
      `Context needed before the copy can be fully checked: ${gaps.join("; ")}.`,
      { suggestion: "Provide the missing product, offer, format, or complete asset." },
    );
  }
  return result(
    "review-context",
    "passed",
    `${matched!.name} (${
      matched!.version
    }) matches the product; the complete asset and its format were provided; planned launch ${input.launchDate} is within ${
      matched!.availableFrom
    } to ${matched!.availableUntil}.`,
  );
};

type Issue = { span: Span; message: string };
const byStart = (a: Issue, b: Issue) => a.span.start - b.span.start;

const offerMatch = ({ input, text, selected, card }: Context): CheckResult => {
  if (!selected) {
    return result(
      "offer-match",
      "unknown",
      "No catalog offer matching the product is selected, so advertised terms cannot be compared. Rates are not judged against a guessed offer.",
    );
  }
  const mismatches: Issue[] = [];
  const ambiguous: Issue[] = [];
  const matched: string[] = [];
  const t = selected.terms;
  const rateWording = (m: Mention) =>
    ambiguous.push({
      span: m.excerpt,
      message: `${
        quote(text.content.slice(m.excerpt.start, m.excerpt.end))
      } is worded as a rate or interest, not an APR`,
    });

  if (selected.productId === "card") {
    for (const m of text.mentions) {
      const role = card.roles.get(m)!;
      const shown = quote(text.content.slice(m.excerpt.start, m.excerpt.end));
      if (!m.explicitApr) rateWording(m);
      else if (role === "intro") {
        if (same(m.value, t.introApr)) matched.push(`intro APR ${pct(m.value)}`);
        else {mismatches.push({
            span: m.excerpt,
            message: `${shown} is advertised as the intro APR; the offer's intro APR is ${
              pct(t.introApr)
            }`,
          });}
      } else if (role === "ongoing") {
        if (same(m.value, t.ongoingApr)) matched.push(`ongoing APR ${pct(m.value)}`);
        else {mismatches.push({
            span: m.excerpt,
            message: `${shown} is advertised as the ongoing APR; the offer's ongoing APR is ${
              pct(t.ongoingApr)
            }`,
          });}
      } else if (same(m.value, t.ongoingApr)) matched.push(`APR ${pct(m.value)}`);
      else if (same(m.value, t.introApr)) {
        ambiguous.push({
          span: m.excerpt,
          message:
            `${shown} equals the intro APR but is not presented as introductory, so its role is unclear (see the intro-label check)`,
        });
      } else {
        mismatches.push({
          span: m.excerpt,
          message: `${shown} matches neither the intro APR (${
            pct(t.introApr)
          }) nor the ongoing APR (${pct(t.ongoingApr)})`,
        });
      }
    }
    for (const d of card.introDurations) {
      if (d.months === t.introMonths) matched.push(`${d.months}-month intro period`);
      else {mismatches.push({
          span: d,
          message: `${
            quote(text.content.slice(d.start, d.end))
          } is given as the intro period; the offer's intro period is ${t.introMonths} months`,
        });}
    }
  } else if (
    selected.productId === "personal_loan" && t.aprMin !== undefined && t.aprMax !== undefined
  ) {
    const LOWER =
      /\b(?:from|as low as|starting at|starts at|starting from|low as|minimum(?: of)?|min\.?|between)\s*(?:just\s*|only\s*)?$/i;
    const UPPER = /\b(?:up to|as high as|maximum(?: of)?|max\.?|no more than)\s*$/i;
    for (const m of text.mentions) {
      const shown = quote(text.content.slice(m.excerpt.start, m.excerpt.end));
      if (!m.explicitApr) {
        rateWording(m);
        continue;
      }
      const upper = UPPER.test(m.pre) || (Boolean(m.prev) && RANGE_JOIN.test(m.pre));
      const lower = !upper && (LOWER.test(m.pre) || (Boolean(m.next) && RANGE_JOIN.test(m.post)));
      if (m.value < t.aprMin - 0.001 || m.value > t.aprMax + 0.001) {
        mismatches.push({
          span: m.excerpt,
          message: `${shown} is outside the offer's APR range of ${pct(t.aprMin)} to ${
            pct(t.aprMax)
          }`,
        });
      } else if (lower && !same(m.value, t.aprMin)) {
        mismatches.push({
          span: m.excerpt,
          message: `${shown} is advertised as the lowest APR; the offer's lowest APR is ${
            pct(t.aprMin)
          }`,
        });
      } else if (upper && !same(m.value, t.aprMax)) {
        mismatches.push({
          span: m.excerpt,
          message: `${shown} is advertised as the highest APR; the offer's highest APR is ${
            pct(t.aprMax)
          }`,
        });
      } else if (lower || upper) {
        matched.push(`${lower ? "lowest" : "highest"} APR ${pct(m.value)}`);
      } else {
        ambiguous.push({
          span: m.excerpt,
          message:
            `${shown} is a single APR within the range; the catalog does not say which borrowers receive it`,
        });
      }
    }
  } else {
    for (const m of text.mentions) {
      ambiguous.push({
        span: m.excerpt,
        message: `${
          quote(text.content.slice(m.excerpt.start, m.excerpt.end))
        } cannot be verified because the catalog does not supply rates for ${selected.name}`,
      });
    }
  }

  const suggestion = selected.productId === "card"
    ? `Use the catalog terms: ${pct(t.introApr)} intro APR for ${t.introMonths} months, then ${
      pct(t.ongoingApr)
    } APR.`
    : selected.productId === "personal_loan"
    ? `Use the catalog range: ${pct(t.aprMin)} to ${pct(t.aprMax)} APR.`
    : undefined;
  if (mismatches.length) {
    mismatches.sort(byStart);
    return result(
      "offer-match",
      "finding",
      `Compared with ${selected.name} (${selected.version}): ${
        mismatches.map((i) => i.message).join("; ")
      }.`,
      { excerpt: excerptOf(text.content, mismatches[0].span), suggestion },
    );
  }
  if (ambiguous.length) {
    ambiguous.sort(byStart);
    return result(
      "offer-match",
      "unknown",
      `Terms could not be compared reliably with ${selected.name} (${selected.version}): ${
        ambiguous.map((i) => i.message).join("; ")
      }. A reviewer should verify them.`,
      { excerpt: excerptOf(text.content, ambiguous[0].span) },
    );
  }
  if (matched.length) {
    return result(
      "offer-match",
      "passed",
      `Advertised terms match ${selected.name} (${selected.version}): ${matched.join(", ")}.`,
    );
  }
  if (!input.completeAsset) {
    return result(
      "offer-match",
      "unknown",
      "No APR or intro period was found in the excerpt; the rest of the asset was not provided.",
    );
  }
  return result(
    "offer-match",
    "passed",
    `No APR or intro period is advertised, so nothing contradicts ${selected.name} (${selected.version}).`,
  );
};

const cardIntroLabel = ({ input, text, selected, card }: Context): CheckResult => {
  if (input.productId === "unknown") {
    return unknownProduct("card-intro-label", "the credit-card intro-rate label requirement");
  }
  if (input.productId !== "card") {
    return result("card-intro-label", "not_applicable", "Applies only to credit-card copy.");
  }
  const unlabeled = card.intro.filter((m) => !hasIntroLabel(m));
  if (unlabeled.length) {
    const first = excerptOf(text.content, unlabeled[0].excerpt);
    return result(
      "card-intro-label",
      "finding",
      `${
        unlabeled.map((m) => quote(text.content.slice(m.excerpt.start, m.excerpt.end))).join(", ")
      } appears to be an introductory rate but “intro” or “introductory” is not immediately next to it. This is a text-proximity check, not a legal certification.`,
      {
        excerpt: first,
        suggestion: `Label the rate as introductory, e.g. ${
          quote(text.content.slice(unlabeled[0].start, unlabeled[0].end))
        } intro APR.`,
      },
    );
  }
  if (!selected && card.unqualified.length && !card.intro.length) {
    return result(
      "card-intro-label",
      "unknown",
      `${
        card.unqualified.map((m) => quote(text.content.slice(m.excerpt.start, m.excerpt.end))).join(
          ", ",
        )
      } may be an introductory rate; without a selected offer this cannot be determined.`,
      { excerpt: excerptOf(text.content, card.unqualified[0].excerpt) },
    );
  }
  if (card.intro.length) {
    return result(
      "card-intro-label",
      "passed",
      "Each introductory rate found has “intro” or “introductory” next to it (text proximity only).",
    );
  }
  if (!input.completeAsset) {
    return result(
      "card-intro-label",
      "unknown",
      "No introductory rate was found in the excerpt; the rest of the asset was not provided.",
    );
  }
  return result("card-intro-label", "passed", "No introductory rate is advertised in the text.");
};

const cardPromoTerms = ({ input, text, selected, card }: Context): CheckResult => {
  if (input.productId === "unknown") {
    return unknownProduct("card-promo-terms", "the credit-card promotional-terms requirement");
  }
  if (input.productId !== "card") {
    return result("card-promo-terms", "not_applicable", "Applies only to credit-card copy.");
  }
  if (input.format === "banner" && input.linksToApplication === true) {
    return result(
      "card-promo-terms",
      "not_applicable",
      "Banner confirmed as linked to an electronic application, which §1026.16(g)(5) excludes from the (g)(4) period and post-promotional-rate statement. Other checks still apply.",
    );
  }
  if (!card.intro.length) {
    if (!selected && card.unqualified.length) {
      return result(
        "card-promo-terms",
        "unknown",
        "Without a selected offer it cannot be determined whether the advertised rate is introductory.",
      );
    }
    if (!input.completeAsset) {
      return result(
        "card-promo-terms",
        "unknown",
        "No introductory rate was found in the excerpt; the rest of the asset was not provided.",
      );
    }
    return result(
      "card-promo-terms",
      "passed",
      "No introductory rate is advertised, so promotional terms are not required by this check.",
    );
  }
  const introValues = card.intro.map((m) => m.value);
  const hasPeriod = card.introDurations.length > 0;
  const hasLater = card.ongoing.length > 0 ||
    card.unqualified.some((m) => m.explicitApr && !introValues.some((v) => same(m.value, v)));
  if (hasPeriod && hasLater) {
    return result(
      "card-promo-terms",
      "passed",
      "The intro rate is accompanied by its period and the APR that applies afterward (text only; placement and prominence are not assessed).",
    );
  }
  const missing = [
    !hasPeriod && "how long the intro period lasts",
    !hasLater && "the APR that applies after the intro period",
  ]
    .filter(Boolean).join(" and ");
  const advertised = card.intro.map((m) =>
    quote(text.content.slice(m.excerpt.start, m.excerpt.end))
  ).join(", ");
  if (input.format === "banner" && input.linksToApplication === null) {
    return result(
      "card-promo-terms",
      "unknown",
      `${advertised} lacks ${missing}, but whether this banner links to an electronic application (the §1026.16(g)(5) exclusion) is unknown. Confirm the destination.`,
    );
  }
  if (input.format === "unknown") {
    return result(
      "card-promo-terms",
      "unknown",
      `${advertised} lacks ${missing}, but the asset format is unknown, so whether the linked-banner exclusion applies cannot be determined.`,
    );
  }
  if (!input.completeAsset) {
    return result(
      "card-promo-terms",
      "unknown",
      `The excerpt advertises ${advertised} without ${missing}; the rest of the asset was not provided, so they may appear elsewhere.`,
    );
  }
  const t = selected?.terms;
  return result(
    "card-promo-terms",
    "finding",
    `The text advertises ${advertised} but does not state ${missing}. Searched the complete submitted text.`,
    {
      suggestion: t?.introMonths !== undefined && t.ongoingApr !== undefined
        ? `State near the intro rate that it lasts ${t.introMonths} months and that ${
          pct(t.ongoingApr)
        } APR applies afterward.`
        : "State near the intro rate when it ends and the APR that applies afterward.",
    },
  );
};

type Trigger = Span & { labels: Set<string> };
const loanTriggers = (content: string): Trigger[] => {
  const found: Trigger[] = [];
  const add = (start: number, end: number, label: string) =>
    found.push({ start, end, labels: new Set([label]) });
  const payments = new RegExp(
    `(?<![\\w.$])${NUM}\\s+(?:(?:equal|fixed|monthly|bi-?weekly|weekly|easy|low|affordable)\\s+){0,2}(?:payments|installments)\\b`,
    "gi",
  );
  for (const m of content.matchAll(payments)) {
    add(m.index, m.index + m[0].length, "number of payments");
  }
  for (const re of [MONTHS, YEARS]) {
    for (const m of content.matchAll(re)) {
      const end = m.index + m[0].length;
      const before = content.slice(Math.max(0, m.index - 80), m.index);
      const after = content.slice(end, end + 40);
      // A duration alone can describe company age or a service cadence. Require
      // adjacent repayment/term wording, not merely a loan mentioned elsewhere.
      const repaymentContext =
        /\b(?:repay(?:ment)?|pay(?:\s+it)?\s+back|pay\s+off|payments?)\s+(?:in|over|within|for)\s+(?:up\s+to\s+)?$/i
          .test(before) ||
        /\b(?:(?:repayment|loan|payment)\s+(?:terms?|periods?)|terms?)\s*(?:(?:of|is|are|up\s+to)\s+|:\s*)?$/i
          .test(before) ||
        /^\s+(?:(?:repayment|personal|loan)\s+)?(?:terms?|loans?)\b/i.test(after);
      if (repaymentContext) add(m.index, end, "repayment period");
    }
  }
  for (
    const m of content.matchAll(
      /\$\s?\d[\d,]*(?:\.\d{1,2})?\s*(?:\/\s*mo(?:nth)?|per\s+month|a\s+month|each\s+month|monthly)(?!\w)/gi,
    )
  ) {
    add(m.index, m.index + m[0].length, "payment amount");
  }
  for (
    const m of content.matchAll(
      /\b(?:payments?|installments?)\s+(?:(?:of|as\s+low\s+as|from|starting\s+at|starts\s+at|just|only|around|about|under)\s+)+(\$\s?\d[\d,]*(?:\.\d{1,2})?)/dgi,
    )
  ) {
    const span = m.indices?.[1];
    if (!span) continue;
    const [start, end] = span;
    add(start, end, "payment amount");
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  return found.reduce<Trigger[]>((merged, t) => {
    const last = merged.at(-1);
    if (last && t.start < last.end) {
      last.end = Math.max(last.end, t.end);
      t.labels.forEach((l) => last.labels.add(l));
    } else merged.push(t);
    return merged;
  }, []);
};

const loanRepayment = ({ input, text }: Context): CheckResult => {
  if (input.productId === "unknown") {
    return unknownProduct("loan-repayment", "the personal-loan repayment-disclosure check");
  }
  if (input.productId !== "personal_loan") {
    return result("loan-repayment", "not_applicable", "Applies only to personal-loan copy.");
  }
  const triggers = loanTriggers(text.content);
  if (triggers.length) {
    const listed = triggers.map((t) =>
      `${quote(text.content.slice(t.start, t.end))} (${[...t.labels].join(", ")})`
    ).join("; ");
    return result(
      "loan-repayment",
      "finding",
      `Specific repayment terms found: ${listed}. A number of payments, repayment period, or payment amount triggers additional closed-end credit disclosures, such as the terms of repayment and the APR. A reviewer must verify the full repayment disclosure; this check only detects the trigger and does not validate payment amounts or amortization.`,
      {
        severity: "medium",
        excerpt: excerptOf(text.content, triggers[0]),
        suggestion:
          "Confirm the copy includes the complete repayment terms and APR, or remove the specific term.",
      },
    );
  }
  if (!input.completeAsset) {
    return result(
      "loan-repayment",
      "unknown",
      "No specific repayment terms were found in the excerpt; the rest of the asset was not provided.",
    );
  }
  return result(
    "loan-repayment",
    "passed",
    "No specific number of payments, repayment period, or payment amount was found. APR statements and generic payment wording are not triggers for this check.",
  );
};

const APPROVAL_PATTERNS = [
  /\bguaranteed\s+(?:approval|acceptance|approved|to\s+(?:be\s+)?(?:approved|qualify))\b/gi,
  /\b(?:approval|acceptance)\s+(?:is\s+)?guaranteed\b/gi,
  /\bguarantees?\s+(?:your\s+)?approval\b/gi,
  /\bguarantees?\s+(?:that\s+)?you(?:['’]ll|\s+will)\s+(?:be|get)\s+approved\b/gi,
  /\bpre[-\s]?approved\b/gi,
  /\balready\s+(?:been\s+)?approved\b/gi,
  /\byou(?:['’]re|\s+are|['’]ve\s+been|\s+have\s+been)\s+(?:already\s+)?approved\b/gi,
  /\b(?:everyone|anyone|all\s+applicants)\s+(?:is|are|gets?|will\s+be)\s+approved\b/gi,
];
const NEGATOR =
  /^(?:not|no|never|isn['’]t|aren['’]t|wasn['’]t|weren['’]t|won['’]t|don['’]t|doesn['’]t|cannot|can['’]t|without|nor|neither)$/i;

const approvalClaims = ({ input, text }: Context): CheckResult => {
  const spans = APPROVAL_PATTERNS.flatMap((re) =>
    [...text.content.matchAll(re)].map((m) => ({ start: m.index, end: m.index + m[0].length }))
  )
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce<Span[]>((merged, s) => {
      const last = merged.at(-1);
      if (last && s.start < last.end) last.end = Math.max(last.end, s.end);
      else merged.push({ ...s });
      return merged;
    }, []);
  const uncertain: Span[] = [];
  // Skip straightforward negations, and distinguish bounded questions or
  // invitations from assertions. A separate affirmative clause still wins.
  const claims = spans.filter((s) => {
    const clause = text.clauses.find((c) => s.start >= c.start && s.start < c.end);
    const before = text.content.slice(clause?.start ?? 0, s.start);
    if (
      before.trim().split(/\s+/).slice(-4).some((word) =>
        NEGATOR.test(word.replace(/[^\w'’]/g, ""))
      )
    ) return false;
    const invitation =
      /\b(?:see|check|find\s+out)\s+(?:if|whether)\s+(?:you(?:['’]re|\s+are|['’]ve\s+been|\s+have\s+been)?\s+)?$/i
        .test(before);
    if (invitation || (clause && /\?\s*$/.test(clause.text))) {
      uncertain.push(s);
      return false;
    }
    return true;
  });
  if (claims.length) {
    const substantiation = input.substantiation.trim()
      ? " Substantiation was supplied; a reviewer must evaluate it. The checker never treats substantiation as verifying the claim."
      : " No substantiation was supplied.";
    return result(
      "approval-claims",
      "finding",
      `Asserts guaranteed or existing approval: ${
        claims.map((s) => quote(text.content.slice(s.start, s.end))).join(", ")
      }. ClearPath policy AC-1 requires human review of substantiation for such claims; this is not a legal conclusion.${substantiation}`,
      {
        excerpt: excerptOf(text.content, claims[0]),
        suggestion:
          "Remove the approval assertion, or describe the actual step (for example, checking whether the customer may prequalify).",
      },
    );
  }
  if (uncertain.length) {
    return result(
      "approval-claims",
      "unknown",
      "Approval wording appears in a question or an invitation to check status, rather than a clear affirmative assertion. This bounded check cannot establish an approval claim; a reviewer should confirm the intended meaning.",
      { excerpt: excerptOf(text.content, uncertain[0]) },
    );
  }
  if (!input.completeAsset) {
    return result(
      "approval-claims",
      "unknown",
      "No approval claim was found in the excerpt; the rest of the asset was not provided.",
    );
  }
  return result(
    "approval-claims",
    "passed",
    "No guaranteed-approval or already/pre-approved assertion was found. Negated statements and prequalification wording are not flagged.",
  );
};

// ---------------------------------------------------------------------------------------------

export const analyze = (input: SubmissionInput): Analysis => {
  const offer = getOffer(input.offerId);
  const selected = offer && offer.productId === input.productId ? offer : undefined;
  const text = read(input.content);
  const context: Context = { input, text, selected, card: readCard(text, selected) };
  return {
    checks: [
      reviewContext(context, offer),
      offerMatch(context),
      cardIntroLabel(context),
      cardPromoTerms(context),
      loanRepayment(context),
      approvalClaims(context),
    ],
    policyVersion: POLICY_VERSION,
    offerVersion: selected?.version ?? null,
    scope: `Text-only: six bounded, deterministic checks of the submitted copy against ${
      selected ? `${selected.name} (${selected.version})` : "no matched catalog offer"
    } and policy ${POLICY_VERSION}. Visual presentation, prominence, linked destinations, and overall legal compliance are not assessed; results support, not replace, human review.`,
  };
};
