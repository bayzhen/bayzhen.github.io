## Context

The first handbook implementation created useful topic pages, but the information architecture does not fully match the user's primary use case. The user wants an in-game reference: current season/day first, detailed systems second.

## Goals / Non-Goals

**Goals:**

- Make the series landing page behave like a dispatch table.
- Add a day/season cheatsheet as the first article in the series.
- Add dedicated cooking, farming, and character/special-system reference pages.
- Keep existing topic articles; use them as deeper explanations.

**Non-Goals:**

- No JavaScript search/filter UI.
- No exhaustive item encyclopedia.
- No exact full recipe database; link to wiki.gg for complete and patch-sensitive values.

## Decisions

### D1: Add a `00` quick reference before existing article 01

The current `01-first-week` article is useful but too narrative for active play. A `00` page can serve as the real manual entry: choose day range -> read actions/avoidances -> jump to details.

### D2: Use system pages for cooking/farming/characters

Cooking, farming, and character systems have enough internal rules to deserve their own pages. Keeping them inside broad food/role pages makes lookup slower.

### D3: Avoid pretending to be a complete numeric database

Exact recipes, character skill trees, crop details, and patch changes should be checked against wiki.gg/Klei. The handbook should give practical decision rules and link to authoritative pages for exhaustive data.

## Risks / Trade-offs

- [Risk] More pages can make navigation noisier -> Mitigation: index groups pages into "按天数查" and "按系统查".
- [Risk] System details can become outdated -> Mitigation: keep exact volatile data in small tables and add source links.
