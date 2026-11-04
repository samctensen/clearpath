# Claude visual critique

Requested by Sam on November 3, 2026. Claude Opus inspected the actual v3 screenshot and scoped homepage sources. These are design judgments, not facts about the hiring team.

**Verdict:** The palette is only half the problem. What makes it look generated is a layer of "technical instrument" decoration on a page that has six records and one date: monospace eyebrow labels, index numbers, a dimension bracket, and the same date stated six times. Each item below says whether the screenshot proves it or I'm inferring it from source.

### What reads as template, by priority

1. **The same fact appears six times** (screenshot). "Nov 15 / 12 days" shows up in the big signal, its sub-note, the `NOV 15` tag, the `12 DAYS` bracket, the Up next footer and on every Up next row. Generated UIs pad thin data by repeating it.
   **Fix:** Keep the `12 days away` signal and the dashed target line. Delete the `.dim`/`.dimLabel` bracket (`review-pipeline.module.css:104-109`), the `targetNote` footer and the `cohortNote` paragraph.

2. **Monospace micro-labels that carry no information** (screenshot). `TARGET DATES × WORKFLOW`, the `01–04` lane indices, the `01–03` Up next numbers, `COMPLIANCE WORKSPACE`, and a full instruction sentence in mono in the chart footer. They're all 8.5–10.5px uppercase tracked text.
   **Fix:** Use mono only for data: axis ticks, dates and product codes. Remove the eyebrow and both index sequences. Set the footer in Manrope 12px, sentence case.

3. **Purple is on everything** (screenshot). I count about 18 purple elements: logo, wordmark, nav icon, button, eyebrow, "DAYS AWAY", today line and tag, bracket, target line, Ready markers, dots and text, the count badge, "Open review", and both ↗ icons. When everything has the accent, nothing stands out.
   **Fix:** Reserve purple for interactive and selected states, the target line, and the Ready status. Make the today line and tag `#6b6b6b`, the signal unit and count badge muted, and the wordmark's "Path" plain text color.

4. **Four equal-weight pastel statuses and colored status text** (screenshot). Lavender, amber, sky and mint at the same weight looks like a default palette, and colored text in table rows is a template tell.
   **Fix:** Put status text in `--dash-text`. Use the hue only on the 8px dot and the marker border, with muted hues (tokens below).

5. **Up next is stretched into empty space** (screenshot). About 260px of empty panel sits above its footer because `.overviewGrid` stretches it to the chart's height (`review-dashboard.module.css:26`). The ↗ in its header looks clickable but is a bare icon, not a link (source, `review-queue.tsx:75`). The lanes imply 4 reviewer actions but the list shows 3 with no "+1 more". That's an inference: I didn't read `lib/dashboard`.
   **Fix:** Add `align-items: start`, remove the ↗, and either list every actionable row or add a "+N more" link to the filtered queue.

6. **Big numbers and chart decoration on a one-day dataset** (screenshot). The 38px light "12", the 26px lane counts (which force "Needs / information" to wrap) and daily minor ticks all suggest dense data that isn't there. The plot itself is honest: all six submissions land on Nov 15.
   **Fix:** Make lane counts 15px/600, inline after the label. Drop the `.minor` daily ticks and keep the labeled axis.

7. **The grey is tinted blue** (source, consistent with the screenshot's cool cast). In every neutral the blue channel is highest (`#121218`, `#2b2b38`, `#aaa8b8`), which gives the page an indigo cast.

### Tokens

```css
/* neutral, zero chroma */
--dash-bg: #090909;
--dash-sidebar: #090909;
--dash-panel: #101010;
--dash-raised: #181818;
--dash-border: #262626;
--hz-rule: #1b1b1b;
--hz-axis: #3d3d3d;
--dash-text: #ececec;
--dash-muted: #8e8e8e;            /* ≈5.8:1 on panel, 5.4:1 on raised */

/* purple, split by job */
--dash-accent-fill: #5b34d6;      /* primary button, selected role pill, lane bar; #fff text ≈7.2:1 */
--dash-accent-fill-hover: #6741e0;
--dash-accent: #8f6cf2;           /* links, focus ring, target line, small text: ≈5.1:1 panel, 4.7:1 raised */

/* status, muted */
--dash-ready: #8f6cf2;
--dash-info: #d4a24c;
--dash-waiting: #6a9fd6;
--dash-approved: #57b98a;
```

Values hard-coded outside the tokens that also need updating:
- `.primary` and `.roleOptions [aria-pressed]`: use `background: var(--dash-accent-fill); color: #fff`, and swap `.primary:hover`'s `filter: brightness` for `--dash-accent-fill-hover`
- `::selection #b899ff59` → `#5b34d666`
- `.bandSelected #b899ff09` → `#5b34d614`
- `--hz-rule: #20202a` and `--hz-axis: #444455` in `review-pipeline.module.css:6-7` override the shell, so change them there too

`#5b34d6` is a saturated violet at about 52% lightness. It reads as deep purple next to the lavender `#b899ff`, which is 80% lightness. Don't use the fill color for text on near-black; it's only about 2.6:1.

### The four changes that help most, without another redesign

1. **Swap the tokens and split the purple.** This handles both of your complaints in about 20 lines.
2. **Remove the eyebrow, index numbers and mono footer text.** This is the biggest cut to the template look.
3. **State the date once.** Remove the bracket, `targetNote` and `cohortNote`.
4. **Fix Up next and the status text.** Add `align-items: start`, remove the fake ↗, add "+N more" if a cap exists, and make status text neutral with colored dots only.

The list, the real-data timeline, the header and the rounded corners all stay. Everything above is subtraction or token changes.
