# Independent behavior review

Read `docs/build-spec.md`, `packages/contracts/mod.ts`, and `packages/checks/catalog.ts`. Write independent scenarios before reading the engine or its tests. Own only `packages/checks/holdout.test.ts` and `docs/handoffs/holdout-report.md`; do not modify implementation, contracts, dependencies, or other workers' files.

Check the promised behavior of all six rules, especially new copy, APR directionality, ordinary negations, missing context, promotion duration, and the banner exception. Assert exact excerpts really match their offsets. Include a few unambiguous adversarial cases and avoid demanding unrestricted natural-language understanding. Run using `./node_modules/.bin/deno test --allow-read packages/checks/holdout.test.ts`. Implementation is in flight; an initial placeholder failure is expected. Report reproducible material failures with expected/actual behavior. You may inspect implementation after establishing test cases to explain defects, but leave fixes to its owner.

This is the PromptArmor take-home, a fictional financial marketing copy-review workbench. Accuracy and honest uncertainty matter more than maximal flagging. No network, secrets, or production data are needed. Root integrates and commits.
