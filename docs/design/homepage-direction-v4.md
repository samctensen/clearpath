# Neutral dark review desk

The neutral palette and shell remain current. The chart has since been replaced by the [review map](review-map-handoff.md); see that brief for current interactions and motion.

Sam rejected the tinted gray and lavender palette and explicitly requested darker neutral gray, deeper purple, and a candid Claude critique. [Claude’s screenshot-based review](claude-homepage-critique-v4.md) identified excessive technical decoration, repetition, widespread purple, and an oversized Up next panel.

Use zero-chroma neutrals: canvas/sidebar #090909, panels #101010, raised controls #181818, borders #262626, primary text #ededed, secondary text #999999. Purple has two jobs: #6d28d9 fill with white text (7.1:1 contrast), #7c3aed hover, and #9865f5 for legible small links/focus/lines (5.0:1 on panels). Status colors remain distinct on dots and markers; table status text is neutral.

Keep the single header, rounded corners, icon-only role menu, real target-date timeline and queue. Remove decorative eyebrows, numeric lane/list indices, daily minor ticks, dimension bracket, duplicate earliest-date footer, and decorative non-clickable arrow. Use compact inline lane counts. Up next fits its contents and shows when its three entries are a subset of actionable work; View queue clears the status filter. Keep per-record dates because launch dates can differ.

Preserve useful scope communication when search/product filters are active, and preserve overdue information. Retain automated-check limitations and revision-specific approval semantics, with less promotional copy. This is a targeted refinement; backend, data contracts and other routes are unchanged.

Validation: production build/TypeScript and diff checks passed. Browser verified status filtering, View queue resetting that filter, and the resulting six-case queue. Primary color contrast was computed directly from sRGB values. Mobile width remains 390px with no page overflow; resizing the plot now re-centers the earliest target so markers remain discoverable after orientation changes.
