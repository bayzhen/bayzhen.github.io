---
description: 创建英文抄写学习文章，面向CET-6水平读者，对复杂词汇和句式进行注释
triggers:
  - keywords: [english, 英文, 抄写, handwriting, CET, 学习文章, english article]
---

# English Article Writing Skill

This skill creates English articles optimized for handwriting practice by CET-6 level learners. Articles must be concise, engaging, and annotated for difficult vocabulary and grammar.

## Target Audience

CET-6 (Band 6) readers: upper-intermediate English learners who can handle most everyday vocabulary but may struggle with:
- Low-frequency academic or technical words
- Idiomatic expressions and phrasal verbs
- Complex sentence structures (e.g., inverted sentences, absolute constructions)

## Article Structure

```
# [Engaging Title]

[Hook sentence — 1-2 lines that make the reader curious]

## [Section Title]

[Body paragraphs — 3-5 sentences each, short and punchy]

> **Word Notes**
> - *word* /phonetic/ — Chinese meaning. Example sentence.

[Continue sections...]

## Key Takeaways

- [Point 1]
- [Point 2]
- [Point 3]
```

## Writing Rules

### Length
- Total: 300–500 words (ideal for one handwriting session)
- Each paragraph: 3–5 sentences
- No filler content; every sentence must earn its place

### Language Level
- Baseline: CET-6 vocabulary (approx. 5,000–6,000 words)
- Use simple, direct sentences as the default
- Vary sentence length for rhythm — mix short punchy sentences with longer ones
- Active voice preferred; passive voice only when necessary

### Annotations
Annotate a word or phrase when **any** of these apply:
- It is below CET-6 frequency but important for the topic
- It is a phrasal verb or idiom that may confuse readers
- The sentence structure is non-standard or inverted

**Annotation format** (use a blockquote after the paragraph):

```
> **Word Notes**
> - *resilience* /rɪˈzɪliəns/ — 韧性，恢复力。"She showed great resilience after the setback."
> - *give it a shot* — 试一试（口语）。"Why not give it a shot?"
```

Annotate **3–6 items per article** maximum. Do not over-annotate common words.

### Tone & Style
- Conversational but intelligent — like a smart friend explaining something
- Open with a hook: a surprising fact, a question, or a vivid scenario
- End with a memorable line or call to reflection
- No jargon dumps; introduce technical terms one at a time

## Output Format

Produce the article as a Markdown file ready to paste into the blog. Include front matter if creating a Jekyll article page:

```yaml
---
layout: article
title: "Article Title"
description: "One-line description"
level: intermediate
tags: ["English", "Reading"]
series: english-reading        # adjust if part of a series
series_title: "English Reading Practice"
order: 1
---
```

Then the article body, with Word Notes blockquotes inline after each paragraph that needs them.

## Example Opening

**Topic:** Why habits matter

> Most people want to change their lives. Few actually do. The gap between wanting and doing comes down to one thing: habits.
>
> A habit is a behavior that runs on autopilot. Your brain builds habits to save energy — once a routine is learned, it stops thinking and just executes.
>
> > **Word Notes**
> > - *autopilot* /ˈɔːtəʊˌpaɪlət/ — 自动驾驶；此处比喻"无意识地自动运行"。
> > - *execute* /ˈeksɪkjuːt/ — 执行，完成（动作）。常见于技术和行为科学语境。

## Checklist Before Delivering

- [ ] Word count is 300–500
- [ ] Opening sentence is a strong hook
- [ ] Complex words are annotated (3–6 items)
- [ ] No paragraph exceeds 5 sentences
- [ ] Ends with a memorable closing line
- [ ] Tone is engaging, not textbook-dry
