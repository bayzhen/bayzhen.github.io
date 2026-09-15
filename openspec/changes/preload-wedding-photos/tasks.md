## 1. Early Image Discovery

- [x] 1.1 Add preload hints for all nine small WebP photos with appropriate first-screen priority.
- [x] 1.2 Update the wedding asset cache version while preserving existing responsive image sources.

## 2. High-Resolution Cache Warmup

- [x] 2.1 Add a narrative-ordered high-resolution image list and a two-request preload queue to the existing game script.
- [x] 2.2 Start high-resolution warmup after the initial page load with idle and timer fallbacks, non-blocking error handling, and observable state.

## 3. Verification and Delivery

- [x] 3.1 Validate syntax, all small/full photo mappings, preload hints, failure fallback, OpenSpec artifacts, and clean diffs.
- [x] 3.2 Verify zero-interaction preload requests, request ordering/concurrency, cache reuse during the full game, responsive layout, and a production Jekyll build.
- [ ] 3.3 Commit, push, verify GitHub Pages assets, and sync/archive the completed change.
