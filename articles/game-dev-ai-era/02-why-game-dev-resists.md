---
layout: article
title: "Why Game Dev Resists Automation"
description: "The pipeline problem, context limits, and why games are not like songs"
level: intermediate
tags: ["Game Dev", "AI", "English", "Reading"]
series: game-dev-ai-era
series_title: "Game Dev in the AI Era: English Reading"
order: 2
prev:
  title: "The AI Tool Explosion"
  url: "01-ai-tool-explosion.html"
next:
  title: "Efficiency Without Lower Barriers"
  url: "03-efficiency-not-barriers.html"
---

A song takes three minutes to evaluate. A game takes three years to build. That difference changes everything.

## The Pipeline Problem

Game development is not a single creative act — it's a long assembly line. Art, design, programming, audio, animation, UI, networking, testing — each discipline feeds into the next. A character needs a concept, then a 3D model, then rigging, then animations, then gameplay logic, then integration into the world, then balancing, then bug fixes. Remove any link in this chain and the whole thing breaks. AI can help with individual links, but no model today can manage the entire pipeline.

> **Word Notes**
> - *assembly line* — 流水线，装配线。"Game development works like a long assembly line."
> - *rigging* /ˈrɪɡɪŋ/ — （3D角色的）骨骼绑定。"After modeling, the character needs rigging before it can be animated."
> - *balancing* — （游戏）数值平衡调整。"Balancing a game's difficulty takes weeks of playtesting."

## Deep Customization

Games are among the most customized software products in existence. Every game has its own rules, its own systems, its own edge cases. A combat system in one game shares almost nothing with a combat system in another. This means the codebase quickly grows beyond what any language model can hold in its context window. You can't paste an entire game into a prompt. And even if you could, the model wouldn't understand the thousands of implicit decisions that shaped the code — why this variable exists, why that function takes an unusual parameter, why the networking layer handles state in a specific way.

> **Word Notes**
> - *edge cases* — 边界情况，极端情况。"Every game has unique edge cases that require manual handling."
> - *implicit* /ɪmˈplɪsɪt/ — 隐含的，不明确表达的。"There are thousands of implicit decisions baked into a codebase."

## The Data Problem

Modern games require massive amounts of configured data — item tables, level layouts, skill trees, dialogue graphs, spawn rules. One person, even with AI assistance, hits a ceiling on how much data they can produce and verify in a day. AI can generate data, but someone still needs to check every entry against the game's design intent. That verification step is where human judgment remains irreplaceable.

## Key Takeaways

- Game development is a long, multi-discipline pipeline — not a single output
- Deep customization means every game's codebase exceeds LLM context limits
- Massive data configuration still requires human verification
- AI can assist individual steps, but cannot orchestrate the full chain

*AI can paint one wall. Building the house is a different story entirely.*
