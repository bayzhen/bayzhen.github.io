---
layout: article
title: "Do We Actually Need MCP?"
description: "A contrarian reflection — why text might be a better interface than MCP for AI-engine interaction"
level: intermediate
tags: ["MCP", "Unreal Engine", "English", "Reading"]
series: unreal-engine-mcp
series_title: "Unreal Engine MCP: English Reading"
order: 6
prev:
  title: "What's Missing"
  url: "05-whats-missing.html"
---

The previous article ended with optimism: "The pieces exist. Someone just needs to assemble them." I tried to be that someone. Then I stopped. Not because the engineering was too hard, but because I started questioning whether MCP is the right direction at all.

## The Latency Problem

An LLM takes seconds to respond. A game engine runs at 60 frames per second — roughly 16 milliseconds per frame. This is not a gap that optimization can close. It is a fundamental mismatch. Any workflow that requires the AI to make real-time decisions inside a running engine is fighting physics. MCP tools that read and write runtime state sound powerful in theory, but the round-trip latency makes them impractical for anything beyond static, editor-time operations.

> **Word Notes**
> - *fundamental* /ˌfʌndəˈmentl/ — 根本的，基本的。"This is a fundamental mismatch, not a temporary limitation."
> - *round-trip* — 往返。"The round-trip latency between AI and engine is too high for real-time use."
> - *impractical* /ɪmˈpræktɪkl/ — 不切实际的。"Real-time AI control becomes impractical at engine frame rates."

## The Reflection Trap

Unreal's reflection system is massive. Thousands of classes, tens of thousands of properties. When an AI inspects an object through MCP, it receives a wall of metadata — consuming tokens, requiring multiple round trips, and still lacking the context to know which properties actually matter. A human developer with engine experience can set a property in one line of code. The AI, working through MCP, might need five tool calls and three thousand tokens to achieve the same result.

> **Word Notes**
> - *massive* /ˈmæsɪv/ — 巨大的，大规模的。"The reflection system is massive — thousands of classes."
> - *metadata* /ˈmetədeɪtə/ — 元数据，描述数据的数据。"The AI receives a wall of metadata it must parse."
> - *consuming* /kənˈsuːmɪŋ/ — 消耗。"Each inspection consumes tokens and time."

## Text Is the Better Interface

Here is what actually works well: export the engine state as text — a log file, a JSON dump, a scene description. Hand it to the AI. Let it analyze, reason, and generate code or a script. Feed that script back into the engine. Collect the output. Repeat.

This pipeline is simple, debuggable, and plays to the AI's real strength: reading and writing text. No custom protocol needed. No tool definitions. No round-trip overhead per property. The AI thinks in bulk, then acts in bulk.

> **Word Notes**
> - *pipeline* /ˈpaɪplaɪn/ — 管线，流水线。"This text-based pipeline is simpler and more reliable."
> - *debuggable* /diːˈbʌɡəbl/ — 可调试的。"A text pipeline is debuggable — you can read every step."
> - *in bulk* — 批量地。"The AI thinks in bulk, then acts in bulk."

## What MCP Gets Wrong

MCP tries to give the AI hands. But the AI's advantage is its brain. The most productive workflow is not AI reaching into the engine one property at a time — it is AI reading a rich context, understanding the problem, and producing a complete solution. Code generation, not remote control.

The irony is that we already have this workflow. It is called "using an AI coding assistant." The engine's own scripting system — Blueprints, Python, C++ — is already the best interface between human intent and engine behavior. The AI just needs to write better scripts, not operate a remote control panel.

> **Word Notes**
> - *irony* /ˈaɪrəni/ — 讽刺，反讽。"The irony is that the best solution already exists."
> - *intent* /ɪnˈtent/ — 意图。"Scripting bridges human intent and engine behavior."

Not everything that can be built should be built. Sometimes the right answer is a simpler tool — or no tool at all.

*The AI doesn't need hands. It needs better eyes and a good pen.*
