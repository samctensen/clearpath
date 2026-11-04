# Claude review: Decision log and Policy guide

2026-11-04 · Claude Opus (`claude-opus-5-5`) · screenshot and product-brief review. Claude received only fictional demo screenshots and a plain brief, not private repository source. The original critique follows below.

## Disposition

Implemented the evidence, density, visual simplification, search, product-context, bookmark, historical-revision, and mobile-navigation recommendations. Browser verification covered the interactions that static screenshots could not establish.

Two recommendations needed qualification: selecting mobile records already scrolled to detail, so the claim that selection did nothing was an unverified screenshot inference; added explicit return controls and verified direct-link loading. “Passes this check” could imply certainty the examples do not establish, so the example labels use “Submitted wording” and “Alternative wording.” Reviewer action messages are revision-scoped; the stored free-text events do not safely associate every reason with an individual check.

The suggested eight-row desktop target was not treated as a requirement: rows retain legible campaign names, feedback, timestamps, and earlier-revision warnings. The new list is substantially denser than the original cards.

## Original critique

I read `brief.md` and the four screenshots: `decisions-desktop.png`, `decisions-mobile.png`, `policies-desktop.png` and `policies-mobile.png`. I had no way to list the folder, so I found them by guessing filenames. I didn't modify anything or click the UI. **Observed** means visible in the screenshots or stated in the brief. **Suggest** is my recommendation.

## Page verdicts

**Decision log: keep it, but it's mostly packaging around thin evidence.** It has a distinct job worth its navigation slot: showing what was decided on which exact revision, and why. The Review desk handles open work.
- **Observed:** The why is the weakest part. Check outcomes are hidden behind a small native triangle ("▸ Checks recorded for revision 2"). Reviewer dismissals aren't shown at all. "Copy approved" appears four times for one record: tab, pill, card feedback and the detail panel's "Recorded feedback".
- **Observed:** Three records fill the whole desktop list. Each card is about 190px tall, with an icon tile, a pill, a revision label, a chevron and a status link.

**Policy guide: keep it. The content is the best thing in either page; the chrome around it is generic.** "When this check applies", "What still needs judgment" and the side-by-side example are specific and useful, not vague AI prose.
- **Observed:** The list codes each item three times: a category label above the title, an icon and a chevron. The detail header repeats "Regulatory reference".
- **Observed:** The title wraps to an orphaned "rate" even though there's about 400px of free space. The "Text review" tag adds nothing.
- **Observed:** The loudest element is the purple "New submission" button, which (per the brief) opens a blank form.

**Both pages look generic in the same ways:**
- Grey taglines under each page heading.
- Pills with coloured dots.
- Every section boxed in a bordered card.
- Labels and timestamps at roughly 10–11px in low-contrast grey on black.
- Duplicated counts: "3" tab and "3 records"; "6" and "6 checks in this policy pack".
- Two disclaimers per page: an inline note plus a footer.

The black/purple sidebar and Manrope typeface are fine.

## Ranked changes

**1. Show the evidence in the decision record by default**
- **Evidence:** The checks are collapsed in the detail panel. Dismissals with reasons exist in case history but aren't shown (brief). Recorded feedback just repeats the outcome ("Copy approved").
- **Consequence:** To defend a decision, someone has to open the current case and dig through its history. That's the extra lookup the tool is meant to remove.
- **Fix:** List the checks open, one compact row each: check name, result, and the reviewer's dismissal reason if there is one. Each check name links to its guide item using the existing hash URLs. Show feedback only when it says more than the outcome.
- **Remove:** The disclosure triangle, and the "Recorded feedback: Copy approved" block when it only repeats the outcome.

**2. Turn the cards into rows and make the superseded state stand out**
- **Evidence:** "Newer revision 2 exists" is small purple text at the same weight and position as "Current revision". Status is shown three ways at once: icon tile, pill colour and pill text.
- **Consequence:** Out-of-date approvals are easy to miss, which is the riskiest misreading on this page. It's also slow to scan once there are more than a handful of records.
- **Fix:** Use one roughly 56–64px row per record: outcome, campaign, publisher, revision, date and a short feedback snippet. Mark older records "Superseded by rev 2" and mute the row. "Current" is the default and needs no label.
- **Remove:** The icon tiles, chevrons, "Current revision" text, the "Newest decisions first" text (it isn't a control), the Refresh button in the header (or move it beside the count), and the inline explanatory note (merge it with the footer disclaimer).

**3. Give each decision its own URL and fix mobile list/detail on both pages**
- **Evidence:** On phone, the decision detail appears below all records and the note, about 1,100px down. Selecting a record changes nothing on screen. The guide's phone list is a clipped scroll box inside the page scroll: the fourth item is cut off mid-label, and the selected item is hidden. Decisions have no bookmark link, while guide items already have hash URLs (brief).
- **Consequence:** Phone users can't tell what they selected, and the clipped guide list hides two of the six checks. Desktop users can't send a colleague a link to the exact decision, so there's more back-and-forth.
- **Fix:** Give each decision a hash URL, the same pattern the guide uses. On phone, selecting a record jumps to its detail with a "Back to list" link. Let the guide's six-item list render at full height on phone.
- **Remove:** The fixed height on the guide list at phone width.

**4. Simplify the policy guide list and header**
- **Evidence:** The category label, icon and chevron repeat on all six items. The "Regulatory reference" label appears again in the detail header. The "Text review" tag. The title wraps too early.
- **Consequence:** The page looks weak and template-built, and six short titles are slower to scan than they should be.
- **Fix:** Group the list under three small headings (Product reference, Regulatory, Company policy), with titles only. Widen the detail title's maximum width. Use symmetric example labels, such as "Flagged" and "Passes this check" instead of "Needs attention" and "Example wording or context". Raise the "What still needs judgment" body text and the source citation to the main body size and contrast.
- **Remove:** The per-item labels and icons, the chevrons, the "Text review" tag, and the duplicate "6 checks" count.

**5. Extend guide search to the example wording and "Before you submit" bullets**
- **Evidence:** Search covers titles, descriptions, scope and source, but not examples or preparation bullets (brief).
- **Consequence:** Writers search using phrases from their own copy ("Apply today", "12 months") and get nothing, even though the answer is on the page.
- **Fix:** Index those two fields. Update the placeholder to something like "Search checks or paste wording".

**6. Demote "New submission" on the guide**
- **Evidence:** It's the only filled purple button on the page, and it opens a blank form (brief).
- **Consequence:** The main call to action on a reference page throws away the user's context, and it pulls attention from the content.
- **Fix:** Make it secondary. Either carry the current product filter into the form, or remove it, since the Review desk already covers this.
- **Remove:** The tagline under each page heading on both pages. Also, "Skip to content" is visible over the logo in the desktop guide screenshot. That's probably a focus state caught in the capture, but worth checking that it hides when not focused.

## Acceptance checks for the top three

1. With any decision selected, every recorded check shows its result without a click. Any dismissal shows the reviewer's reason. Each check name opens the matching guide hash. No record shows "Copy approved" as both the outcome and the feedback.
2. At 1440×900, at least eight records fit above the fold. A superseded record is recognisable in a greyscale screenshot without reading small text. Status appears once per row.
3. Pasting a decision URL into a new tab opens that exact record. At 390px wide, selecting a record shows its detail with no manual scrolling. All six guide items are visible without a nested scroll area.

**Not verifiable from these screenshots:** the historical-record notice inside the detail panel (the selected record is the current one), hover and focus states, and whether the desktop detail panel stays in place while scrolling.


---

## Follow-up review (after changes)

I read only the six files you named. Everything below comes from the static screenshots plus the behaviour you've confirmed.

**Decision log: earns its slot now.** Its job is clearly separate from the Review desk: it shows what was decided on which revision, with the evidence.
- The selected historical record has an amber "Earlier revision" notice, and its row is labelled "Earlier revision (current: 2)".
- The checks are open by default as linked rows with results.
- Feedback only appears when it adds something. The Rev. 2 approval has no "Copy approved" echo.
- The taglines, icon tiles, chevrons and "Current revision" labels are gone, and the duplicate count is removed.

**Policy guide: earns its slot.**
- The list is grouped under three headings with plain titles, and the full list shows on phone.
- The title fits on one line, the "Text review" tag is gone, and "New submission" is now secondary.
- "What still needs judgment" is at body size.
- The "Submitted / Alternative wording" labels work fine.

**Generic look:** Mostly fixed. Both pages now look restrained and content-led rather than template-built. Two things still lean generic:
- **Dotted status pills.** The same pill appears in the list row and again in the detail header. One plain coloured word in the row would do.
- **Row height.** Decision rows are about 105–130px tall, so roughly six fit above the fold at 1440×900. That misses the earlier "eight records" target. It doesn't matter with three records, but it will once the log grows.

**Must-fix:** None visible. Optional polish, in order:
1. **Superseded rows.** Only the small amber text marks a superseded row. Lightly muting the whole row would make it stand out at a glance, including in greyscale.
2. **Mobile guide header.** "New submission" and the avatar sit on their own right-aligned row under the heading. Putting the button inline with the title, or in the menu, would free up that row.
3. **Repeated revision number.** The decision detail shows the revision in the header ("Revision 1"), in the notice and in the row. You could drop it from the header when the notice is shown.
4. **"Complete asset."** This label under the reviewed copy is unclear. Something like "Scope: complete ad" would read better.
5. **Source citation size.** The citation in "Source behind this check" is still smaller and greyer than body text, and it's the line a reviewer would quote.
6. **Mobile focus ring.** After jumping to a decision on phone, the "Decision record" heading has a purple focus ring. Moving focus there is right. Just check that the ring only appears for keyboard users, not on tap. I can't tell which from a screenshot.
