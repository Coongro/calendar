---
"@coongro/calendar": minor
---

Support overlapping events in Day / Week / ThreeDay views (fixes COONG-92).

- Events sharing a time slot now render side-by-side in proportional columns instead of stacking on top of each other. Clusters of concurrent events that exceed the view's column budget collapse the excess into a "+N" chip that opens a popover listing the full set.
- Public API additions (all optional, backward compatible): `DayColumnProps`, `WeekGridProps` and `ThreeDayGridProps` gain `maxColumns?` (clamp before the overflow chip) and `onClusterOverflowClick?` (consumer override; when omitted, the chip opens its own popover).
- New building blocks exported: `DayColumnCore` (shared per-day renderer consumed by the three grid views), `EventOverflowChip`, `MobileWeekMiniCard`, `layoutOverlappingEvents` (pure sweep-line + column packing algorithm).
- Bug fixes in `EventRepository`: normalize `start_at` / `end_at` from ISO strings in `update()` (previously only `create()` coerced, causing `value.toISOString is not a function` when editing events); remove the reject-on-overlap check in `create()` since overlapping events are now a supported use case.
