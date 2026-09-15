## 1. Image Quality

- [x] 1.1 Generate and compare three identity-preserving hero enhancement candidates, rejecting any candidate with visible facial reconstruction
- [x] 1.2 Re-encode all nine source photos as high-quality metadata-free WebP assets with conservative sharpening and original dimensions
- [x] 1.3 Generate a smaller responsive WebP candidate for every photo and verify formats, dimensions, metadata, and total size

## 2. Responsive Delivery

- [x] 2.1 Add accurate intrinsic dimensions, `srcset`, and layout-specific `sizes` to every invitation photo
- [x] 2.2 Preserve eager loading for each full-page hero and lazy loading for all below-fold and overview images

## 3. Visual and Mobile Polish

- [x] 3.1 Refine overview photo contrast and theme-specific photo treatment without obscuring faces or labels
- [x] 3.2 Refine cinematic, editorial, and oriental hero composition on desktop and mobile
- [x] 3.3 Add scroll-direction-aware mobile navigation that restores on upward scrolling, top-of-page, and focus

## 4. Save the Date

- [x] 4.1 Add a privacy-safe all-day iCalendar file for 2026-10-06 with the known morning note
- [x] 4.2 Add accessible calendar download links to all three full invitation pages

## 5. Verification

- [x] 5.1 Validate OpenSpec, asset paths, HTML image attributes, calendar syntax, metadata removal, and diff hygiene
- [x] 5.2 Run the Jekyll build and inspect desktop and mobile renders for clarity, cropping, readability, navigation behavior, and overflow

## 6. Editorial Hero Framing

- [x] 6.1 Match the editorial hero frame to the source photo's 2:3 portrait ratio on desktop and mobile
- [x] 6.2 Verify 2048×1000, 1440×900, and 390×844 editorial renders show the complete couple without horizontal overflow
