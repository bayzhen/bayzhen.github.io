---
layout: article
title: "Where It Breaks"
description: "Latency, token waste, and the reflection trap — why MCP struggles with Unreal Engine"
level: intermediate
tags: ["MCP", "Unreal Engine", "English", "Reading"]
series: ai-gamedev
series_title: "AI-Accelerated Game Dev: English Reading"
order: 4
prev:
  title: "How AI Talks to an Engine"
  url: "03-how-it-works.html"
next:
  title: "The Wrong Target"
  url: "05-wrong-target.html"
---

The demos look great. But the deeper I looked, the more problems I found. These are not bugs to fix — they are structural mismatches between how AI works and how Unreal Engine is built.

## The Reflection Trap

Unreal's reflection system is powerful. It exposes class hierarchies, property types, metadata, and editor-visible fields at runtime. In theory, this lets an AI inspect any object and understand its structure. In practice, it creates a wall of data.

A single actor might expose hundreds of properties across its component hierarchy. The AI receives all of this as text — consuming thousands of tokens just to understand one object. It then needs multiple round trips to find and modify the right property. A human developer with engine experience does the same thing in one line of code.

> **Word Notes**
> - *hierarchy* /ˈhaɪərɑːrki/ — 层次结构。"Unreal exposes deep class hierarchies through reflection."
> - *consuming* /kənˈsuːmɪŋ/ — 消耗。"Inspecting one object consumes thousands of tokens."
> - *structural* /ˈstrʌktʃərəl/ — 结构性的。"These are structural mismatches, not simple bugs."

## The Latency Mismatch

An LLM takes seconds to respond. A game engine runs at sixty frames per second — roughly sixteen milliseconds per frame. This is not a gap that optimization can close. It is a fundamental mismatch.

Any workflow that requires the AI to make real-time decisions inside a running engine is fighting physics. MCP tools that read and write runtime state sound powerful in theory, but the round-trip latency makes them impractical for anything beyond static, editor-time operations.

> **Word Notes**
> - *latency* /ˈleɪtənsi/ — 延迟。"Round-trip latency makes real-time AI control impractical."
> - *fundamental* /ˌfʌndəˈmentl/ — 根本的。"This is a fundamental mismatch, not a temporary limitation."
> - *impractical* /ɪmˈpræktɪkl/ — 不切实际的。"Real-time AI decisions become impractical at engine frame rates."

## The Missing Pieces

Current MCP implementations cannot access runtime game state. They cannot observe a character's velocity, read a health bar value, or inspect the physics simulation. They operate only in the editor, on static scenes, at rest.

There is also no cross-engine abstraction. A tool built for Unreal does not work with Unity or Godot. Each engine requires its own plugin, its own command set, its own maintenance burden. The "universal" in universal protocol does not extend to the engine layer.

> **Word Notes**
> - *abstraction* /æbˈstrækʃn/ — 抽象。"There is no cross-engine abstraction for AI tools."
> - *simulation* /ˌsɪmjuˈleɪʃn/ — 模拟。"AI cannot inspect the physics simulation at runtime."

The pattern is clear: MCP works for simple, static editor tasks. Anything more ambitious runs into walls. But is this MCP's fault — or the engine's?

*The tools aren't broken. They're aimed at the wrong target.*
