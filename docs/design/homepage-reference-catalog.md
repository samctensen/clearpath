# Homepage reference catalog

Inspected November 3, 2026 (Pacific). Sam supplied three X accounts and requested a dark, sleek dashboard homepage. These observations come from the actual posts viewed in the browser, not inferred from profile bios. This is a representative sample, not an exhaustive account archive. Images remain the authors' work and are reference material only; no designer artwork is shipped in ClearPath.

**Expanded after feedback:** [Browse the local visual archive](references/index.html): 53 downloaded images and video poster frames from 31 posts, with original post and media URLs in [sources.json](references/expanded/sources.json). [Detailed findings from nine additional images](reference-findings-expanded.md) distinguish direct visual observations from implementation recommendations. Poster frames establish composition, not the quality of motion or interaction.

Sam rejected the initial gray-panel/donut treatment. The authoritative implementation direction is now [the compact purple review desk, combined header, and shorter launch horizon without metric tiles](homepage-direction-v4.md). The original observations below remain useful research, not an endorsement of the rejected composition.

| Author / inspected work | What the work does well | Translation into ClearPath |
| --- | --- | --- |
| [Yuri Gokoryan: spend/model instruments](https://x.com/yurygok/status/2117166760168202268) | Radial ticks and precise labels make a metric feel tangible. Graphite surfaces, inset controls, fine borders, and restrained blue encode a clear hierarchy. | A substantial review-status instrument with exact counts, semantic color, and clickable labels. Keep the graphic tied to the queue's actual status distribution. |
| [Yuri: Device watch](https://x.com/yurygok/status/2116097244218757500) | One focal illustration explains the risk, while controls stay quiet and specific. Dark inset areas create depth without floating every element. | Spend visual emphasis on the status graphic; pair it with the next real review action. Avoid generic stock art or decorative “AI” imagery. |
| [Maxim Kuznetsov: subscriptions dashboard](https://x.com/disarto_max/status/2117352562710245759) | A compact navigation rail, fine separation between panels, warm highlights, and a large chart establish a coherent work surface. The plan-mix ring has a readable legend. | A charcoal shell, a restrained warm accent, one larger graphic, and a compact next-work panel above a dense but readable queue. No fake time series or revenue numbers. |
| [Adeeb: STRAIT dashboard](https://x.com/adeebrq/status/2109079189236400244) and [dark version](https://x.com/adeebrq/status/2109443129929789733) | A clear visual center explains the operational domain. Fine marks, dark negative space, and sparse orange highlights create a monitoring-console feel. | The homepage should communicate the state of the review workload at a glance. Use subtle instrument detail around real data, not a decorative map, 3D scene, or simulated monitoring feed. |

Local visual references: [Yuri instruments](references/yuri-models.jpg), [Yuri device watch](references/yuri-device-watch.jpg), [Maxim dashboard](references/maxim-subscriptions.jpg), [Adeeb dark dashboard](references/adeeb-strait-dark.jpg).

## Design choices

Use the references' hierarchy, precision, and purposeful graphics; do not reproduce a screen. The chart is a current snapshot. Our six demo cases do not supply historical throughput, approval velocity, or time saved. `updatedAt` is not waiting age. Copy approval is not publication clearance.

The inferred interview value is product intuition plus accuracy: a polished first impression that also helps someone select the next review, with numbers that reconcile to the actual list. This is our product judgment, not an additional requirement supplied by PromptArmor.

## Additional instrument references inspected

| Work | Observed visual mechanism | ClearPath decision |
| --- | --- | --- |
| Maxim, [Agent runtime](https://x.com/disarto_max/status/2112584075706081679), [poster](references/expanded/disarto_max-2112584075706081679-poster-1.jpg) | An isometric unit is selected in orange; its label corresponds to concrete rows underneath. A single action closes the composition. | A timeline marker inspects an actual submission in a persistent detail strip, then opens that review. Selection connects the graphic to a record. |
| Maxim, [Consensus round](https://x.com/disarto_max/status/2114761790261489721), [poster](references/expanded/disarto_max-2114761790261489721-poster-1.jpg) | Fine network edges and discrete state points form a domain-specific instrument. One node receives the accent while most linework stays neutral. | Keep fine time rules quiet and reserve the accent for today, the earliest target, and the inspected submission. Do not copy network edges that imply nonexistent relationships. |
| Maxim, [Ground station](https://x.com/disarto_max/status/2113679847801471131), [poster](references/expanded/disarto_max-2113679847801471131-poster-1.jpg) | A large orbital view is paired with a precise next-event countdown and matching per-object timelines. | Pair the actual earliest open target and calendar-day distance with a target-date plot; show the same dated records in the review queue. No simulated live feed. |
| Maxim, [Key hierarchy](https://x.com/disarto_max/status/2114443306658623671), [poster](references/expanded/disarto_max-2114443306658623671-poster-1.jpg) | Three labelled planes explain a real hierarchy; the selected level and action share an orange signal. | Repeat one path/selection motif in brand, navigation, markers and controls. Avoid decorative 3D when it cannot encode a real review relationship. |

The larger sample supports a sharper composition, not additional dashboard widgets. The product should lead with actual review work. Reference assets stay in documentation and are excluded from the deployment bundle.
