# Homepage refinement: compact, purple, rounded

Sam accepted the black timeline direction as better, then explicitly requested: slightly brighter dark surfaces; purple instead of orange; a much smaller combined top section; a simple user dropdown containing the role switch and useful other actions; rounded corners; more vivid colors. His final steering removes all four hero/metric tiles and shortens the timeline. This supersedes v2 palette, corners, header size, metric strip, and exposed role toggle. The real-data launch horizon and homepage-only scope remain.

Tokens: canvas #0b0b0f, sidebar #0d0d12, panel #121218, controls #1a1a23, border #2b2b38, text #f4f3fa, muted #aaa8b8, accent #b899ff. Ready #b899ff, needs info #ffc76b, changes requested #6cbfff, approved #63e0aa. These are recommended implementation colors, not sampled from source artwork. Use purple primary actions with dark text for contrast. No broad flat gray blocks or unnecessary gradients.

Final desktop layout: main padding 24–28px; one combined header with a 26–28px Review desk heading, existing search/product controls, New submission, and the user dropdown. Remove the duplicate breadcrumb/topbar, marketing eyebrow, and tagline. There are no hero or metric tiles above the graph; counts remain on the timeline lanes. Keep search/product scope clear within this single header. Mobile wraps controls cleanly and keeps 16px input fonts.

User dropdown is a demo identity, not real authentication. Keep its trigger compact (one user icon; current role in its accessible label). Menu offers a labelled Reviewer/Submitter control, New submission and Offer library links, and a concise fictional-workspace note. No fake profile settings, notifications, account logout, or actions that are not implemented. Use a proper disclosure with accessible focus, Escape/outside close and visible selected role.

Radii: panels 14px, controls 8–10px, avatar circular, nav selection 8px. Keep intentional alignment and the path mark. Shorten the graph row with timeline lanes at a 56px minimum height. Reduce chart title/signal size slightly and make its colors share shell tokens. Preserve real target geometry, keyboard links, detail inspector, empty states, filtering, saved view, and both roles.

Ownership: Claude shell worker owns dashboard-shell.tsx and dashboard-shell.module.css only. Claude header worker owns review-queue.tsx and review-dashboard.module.css only, keeping all existing behavior. Root owns review-pipeline.module.css and final integration/check/deploy. Pure data helpers remain unchanged.

