---
description: 创建英文抄写学习文章，面向CET-6读者，含词汇注释
triggers:
  - keywords: [english, 英文, 抄写, handwriting, CET, 学习文章, english article]
---

# English Article Writing Skill

This skill creates a **dedicated topic series** of English reading articles for CET-6 level learners. Each invocation with a topic produces a full series folder (3–5 articles) — not a single article dumped into a generic folder.

## Series-Per-Topic Design

When the user provides a topic (e.g., "生化危机9", "Elden Ring", "Taylor Swift"):

1. **Derive a URL-safe slug** from the topic (e.g., "生化危机9" → `resident-evil-9`)
2. **Add a series entry** to `_data/series.yml`:
   ```yaml
   - id: {slug}
     title: "{Topic}: English Reading"
     description: "Explore {topic} through English articles — CET-6 level, with vocabulary annotations"
     order: {next available}
   ```
3. **Create `articles/{slug}/index.md`** using `layout: series-index` with a proper intro body (see template below)
4. **Generate 3–5 articles** as `articles/{slug}/01-{angle}.md` … `articles/{slug}/05-{angle}.md`
   - Each article covers a **different angle** of the topic
   - Proper `prev`/`next` navigation between articles

### Example Angles for Different Topics

| Topic | Angles |
|-------|--------|
| Resident Evil 9 | franchise history / survival horror design / RE9 new direction / characters / legacy |
| Elden Ring | open world design / lore and mythology / boss design / player freedom |
| Taylor Swift | career evolution / songwriting craft / cultural impact / fan community |

## File Naming Convention

```
articles/{slug}/
├── index.md
├── 01-{first-angle}.md
├── 02-{second-angle}.md
├── 03-{third-angle}.md
├── 04-{fourth-angle}.md   # optional
└── 05-{fifth-angle}.md    # optional
```

## Index Page Template (`layout: series-index`)

```yaml
---
layout: series-index
title: "{Topic}: English Reading"
description: "{One-line description}"
series_id: {slug}
lang: en
---

## About This Series

[2–3 sentences: what the topic is, why it's interesting, who this series is for]

## What You'll Find

[Brief overview of the angles covered, one bullet per article]

## How to Use This Series

Each article is 300–500 words — short enough to copy out by hand in one sitting. Difficult words are annotated inline. Read straight through, or jump to any article that interests you.

Start with [{01 title}](01-{slug}.html).
```

## Article Front Matter

```yaml
---
layout: article
title: "Article Title"
description: "One-line description"
level: intermediate
tags: ["{Topic}", "English", "Reading"]
series: {slug}
series_title: "{Topic}: English Reading"
order: {n}
prev:
  title: "{Previous article title}"
  url: "{nn}-{prev-slug}.html"
next:
  title: "{Next article title}"
  url: "{nn}-{next-slug}.html"
---
```

- First article: omit `prev`
- Last article: omit `next`

## Article Writing Rules

### Length
- Total: 300–500 words (one handwriting session)
- Each paragraph: 3–5 sentences
- No filler; every sentence must earn its place

### Language Level
- Baseline: CET-6 vocabulary (~5,000–6,000 words)
- Simple, direct sentences as default
- Vary sentence length for rhythm — mix short punchy sentences with longer ones
- Active voice preferred; passive only when necessary

### Annotations
Annotate a word or phrase when **any** of these apply:
- Below CET-6 frequency but important for the topic
- A phrasal verb or idiom that may confuse readers
- A non-standard or inverted sentence structure

**Annotation format** (blockquote after the paragraph):

```
> **Word Notes**
> - *resilience* /rɪˈzɪliəns/ — 韧性，恢复力。"She showed great resilience after the setback."
> - *give it a shot* — 试一试（口语）。"Why not give it a shot?"
```

Annotate **3–6 items per article** maximum.

### Structure

```
[Hook sentence — 1-2 lines that make the reader curious]

## [Section Title]

[Body paragraph — 3-5 sentences]

> **Word Notes**
> - *word* /phonetic/ — Chinese meaning. Example.

[Continue sections...]

## Key Takeaways

- [Point 1]
- [Point 2]
- [Point 3]

*[Closing memorable line]*
```

### Tone & Style
- Conversational but intelligent — like a smart friend explaining something
- Open with a hook: a surprising fact, a question, or a vivid scenario
- End with a memorable line or call to reflection
- No jargon dumps; introduce technical terms one at a time

## Checklist Before Delivering

- [ ] Series entry added to `_data/series.yml`
- [ ] `articles/{slug}/index.md` created with intro body
- [ ] 3–5 articles created, each covering a distinct angle
- [ ] Each article: 300–500 words, CET-6 level, 3–6 annotations
- [ ] `prev`/`next` links correct across all articles (first has no prev, last has no next)
- [ ] Opening sentence of each article is a strong hook
- [ ] Tone is engaging, not textbook-dry
