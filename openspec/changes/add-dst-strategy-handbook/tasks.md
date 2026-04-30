## 1. Source Research

- [x] 1.1 Identify current reliable sources for Don't Starve Together mechanics, prioritizing official Klei updates/forums, official Wiki pages, and actively maintained community references.
- [x] 1.2 Record the current game/version context and a short source note for patch-sensitive topics.
- [x] 1.3 Verify facts needed for character roles, seasonal hazards, Boss preparation, caves/ruins progression, farming/cooking, crafting requirements, and major drops before drafting those sections.

## 2. Series Structure

- [x] 2.1 Create `articles/dst-strategy-handbook/`.
- [x] 2.2 Create `articles/dst-strategy-handbook/index.md` with `layout: series-index`, `series_id: dst-strategy-handbook`, Chinese title/description, chapter index, and quick lookup entry points.
- [x] 2.3 Add `dst-strategy-handbook` to `_data/series.yml` with a Chinese title, description, and order value.
- [x] 2.4 Define previous/next navigation ordering for all planned articles.

## 3. Article Drafting

- [x] 3.1 Create `01-first-week.md` covering first-week priorities, light, tools, exploration, map reading, and early mistakes.
- [x] 3.2 Create `02-base-and-logistics.md` covering base location, fire safety, storage, core machines, resource routes, and relocation decisions.
- [x] 3.3 Create `03-food-health-sanity.md` covering hunger, health, sanity, cooking, spoilage, emergency recovery, and practical recipes.
- [x] 3.4 Create `04-seasonal-planning.md` covering autumn setup, winter survival, spring rain/lightning, summer overheating/wildfire, and seasonal transition checklists.
- [x] 3.5 Create `05-characters-and-team-roles.md` covering role selection, team division, beginner-friendly picks, and coordination patterns.
- [x] 3.6 Create `06-combat-and-boss-prep.md` covering armor, weapons, kiting basics, healing inventory, Boss readiness, and fight triage.
- [x] 3.7 Create `07-caves-ruins-and-progression.md` covering cave entry timing, light, depth worms, ruins preparation, ancient science, and retreat rules.
- [x] 3.8 Create `08-farming-cooking-and-economy.md` covering farm planning, crock pot usage, resource loops, renewable resources, and stockpile targets.
- [x] 3.9 Create `09-crisis-playbook.md` covering death recovery, base fires, starvation, sanity collapse, hound waves, seasonal panic, and team wipe recovery.
- [x] 3.10 Create `10-late-game-loop.md` covering late-game goals, world maintenance, recurring Boss cycles, megabase planning, and when to reset or regenerate.

## 4. Handbook Consistency

- [x] 4.1 Ensure each article starts with `结论速查` and includes practical tables or checklists.
- [x] 4.2 Add `常见错误`, `相关条目`, and `版本与资料备注` sections where relevant.
- [x] 4.3 Add cross-links between related handbook articles after all files exist.
- [x] 4.4 Keep volatile numbers and patch-sensitive claims isolated in tables or clearly named sections.

## 5. Verification

- [ ] 5.1 Run the local Jekyll build command used by this project and fix rendering/front matter issues.
- [x] 5.2 Check generated article URLs and previous/next links for the series.
- [x] 5.3 Verify `_data/series.yml` renders the new series in the public series list.
- [x] 5.4 Run `openspec validate add-dst-strategy-handbook --strict` and fix any OpenSpec validation issues.
