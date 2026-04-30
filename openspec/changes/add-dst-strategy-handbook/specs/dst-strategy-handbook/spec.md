## ADDED Requirements

### Requirement: Series registration and entry point
The site SHALL provide a Chinese Don't Starve Together strategy handbook series with a stable series id `dst-strategy-handbook`, a series landing page, and registration in the site's series metadata.

#### Scenario: Reader opens the handbook entry point
- **WHEN** a reader navigates to `articles/dst-strategy-handbook/`
- **THEN** the page presents the handbook title, purpose, chapter index, quick lookup sections, and reading guidance in Chinese

#### Scenario: Series appears in site discovery
- **WHEN** the site renders its article series list from `_data/series.yml`
- **THEN** the Don't Starve Together strategy handbook appears with a Chinese title and concise description

### Requirement: Quick lookup handbook structure
The handbook SHALL organize strategy content for fast reference, using consistent headings, tables, checklists, and cross-links rather than long unstructured essays.

#### Scenario: Reader needs an immediate answer
- **WHEN** a reader opens a strategy article for a specific problem such as winter preparation, food recovery, or Boss readiness
- **THEN** the article starts with actionable recommendations before deeper explanation

#### Scenario: Reader scans repeated article patterns
- **WHEN** a reader moves between handbook articles
- **THEN** recurring sections such as "结论速查", "优先级", "常见错误", and "相关条目" use consistent names and placement

### Requirement: Coverage of practical DST strategy domains
The handbook SHALL cover the core survival and progression domains needed for practical Don't Starve Together play, from early survival through long-term world management.

#### Scenario: New player follows the series
- **WHEN** a newer player reads the opening chapters in order
- **THEN** the content explains first-week survival, base placement, food, sanity, health, tools, light, and seasonal preparation

#### Scenario: Experienced player jumps to a topic
- **WHEN** an experienced player uses the handbook as a reference
- **THEN** the series includes focused entries for character roles, combat preparation, Boss planning, caves/ruins, farming/cooking, crisis recovery, and late-game loops

### Requirement: Patch-sensitive source verification
The handbook SHALL identify facts that are likely to change with game updates and verify them against current sources before article implementation or meaningful revision.

#### Scenario: Article includes patch-sensitive mechanics
- **WHEN** an article states character abilities, item values, Boss drops, crafting requirements, farming behavior, or recent mechanics
- **THEN** the author verifies those details against current reliable sources and records the source basis in the article or implementation notes

#### Scenario: A fact cannot be confirmed
- **WHEN** a patch-sensitive recommendation cannot be verified confidently
- **THEN** the article labels the recommendation as an assumption, avoids exact unstable numbers, or defers the claim until verification is available

### Requirement: Navigation and cross-reference consistency
The handbook SHALL support both linear reading and topic jumping through series metadata, previous/next links, and internal cross-references between related topics.

#### Scenario: Reader follows the planned path
- **WHEN** a reader finishes an article
- **THEN** the page offers navigation to the next relevant article in the handbook sequence

#### Scenario: Reader needs adjacent context
- **WHEN** an article references a related topic such as "食物恢复", "冬季准备", or "Boss 战前清单"
- **THEN** it links to the relevant handbook article when that article exists

### Requirement: Content maintainability
The handbook SHALL separate durable strategy principles from volatile patch details so future updates can revise affected sections without rewriting the whole series.

#### Scenario: Game update changes a mechanic
- **WHEN** a future patch changes a role, recipe, drop, or progression step
- **THEN** the affected article can be updated in a localized section or table without changing unrelated strategy guidance
