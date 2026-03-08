---
layout: article
title: "The Wrong Target"
description: "Plot twist — maybe MCP isn't the problem. Maybe Unreal Engine was never designed for AI."
level: intermediate
tags: ["Game Engine", "AI", "English", "Reading"]
series: ai-gamedev
series_title: "AI-Accelerated Game Dev: English Reading"
order: 5
prev:
  title: "Where It Breaks"
  url: "04-where-it-breaks.html"
next:
  title: "The Real Ceiling"
  url: "06-the-real-ceiling.html"
---

We spent two articles watching MCP struggle against Unreal Engine. The natural conclusion is that MCP needs improvement. But what if we are blaming the wrong thing? What if the problem is the engine itself?

## Why Unreal Resists AI

Unreal Engine was designed for human developers using a GUI. Its architecture reflects this: state is scattered across subsystems, the primary interface is visual (the editor), and most operations require navigating deep menus or writing C++ code that must be compiled. The reflection system was built for editor tooling and serialization, not for external AI consumption.

When we bolt MCP onto Unreal, we are asking a GUI-first system to behave like an API-first system. No wonder it feels clumsy.

> **Word Notes**
> - *scattered* /ˈskætərd/ — 分散的。"Engine state is scattered across many subsystems."
> - *bolt onto* — 硬加上去，附加。"We are bolting MCP onto a system not designed for it."
> - *clumsy* /ˈklʌmzi/ — 笨拙的。"The integration feels clumsy because the engine resists it."

## What an AI-Native Engine Would Look Like

Imagine an engine designed from the ground up for AI interaction. It would be **API-first** — every operation available as a function call, no GUI required. Its state would be **text-serializable** — the entire scene exportable as a readable document. It would be **script-first** — changes made through hot-reloadable scripts, not compiled C++. And it would offer **structured observability** — every frame's state, every physics step, queryable through a clean interface.

The workflow would flow naturally: human describes intent, AI writes a script, the engine executes it, AI reads the resulting state, and the cycle repeats. No protocol adapters. No TCP bridges. No plugin bottlenecks.

> **Word Notes**
> - *observability* /əbˌzɜːrvəˈbɪləti/ — 可观测性。"Structured observability lets AI read engine state cleanly."
> - *hot-reloadable* — 可热重载的。"Scripts should be hot-reloadable without restarting the engine."
> - *adapter* /əˈdæptər/ — 适配器。"An AI-native engine needs no protocol adapters."

## But What Could It Build?

Here is where the excitement meets a harder question. An AI-native engine with perfect tool integration could handle asset placement, lighting, script generation, and level layout. But could it build a game that *feels* right?

The simple games — visual novels, card games, turn-based strategy — are fully describable in text. An AI could build these end-to-end. But action games, platformers, shooters — these depend on something harder to specify. They depend on "game feel": the weight of a jump, the snap of a weapon, the rhythm of combat.

Can AI handle game feel? That depends on a question we haven't asked yet.

> **Word Notes**
> - *end-to-end* — 端到端，完整地。"AI could build simple games end-to-end."
> - *specify* /ˈspesɪfaɪ/ — 明确说明。"Game feel is harder to specify than game logic."

*The engine is not the bottleneck. Something deeper is.*
