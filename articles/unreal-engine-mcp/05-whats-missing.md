---
layout: article
title: "What's Missing"
description: "Gaps in current UE MCP implementations — property discovery, runtime state, and cross-engine abstraction"
level: intermediate
tags: ["MCP", "Unreal Engine", "English", "Reading"]
series: unreal-engine-mcp
series_title: "Unreal Engine MCP: English Reading"
order: 5
prev:
  title: "Reflection as the Bridge"
  url: "04-reflection-bridge.html"
next:
  title: "Do We Actually Need MCP?"
  url: "06-do-we-need-mcp.html"
---

Current Unreal Engine MCP projects are impressive proofs of concept. They demonstrate that AI can create actors, set properties, and manipulate scenes. But there are significant gaps between what exists today and what would make this technology truly useful in production.

## No Full Property Discovery

As discussed in the previous article, the AI can set a property if it knows the name. But it cannot ask: "What properties does this actor have?" Without a discovery mechanism, the AI operates blindly — guessing property names based on training data rather than inspecting the actual object. A truly capable system would let the AI enumerate every UPROPERTY on a class, see their types and current values, and make informed decisions.

> **Word Notes**
> - *enumerate* /ɪˈnuːməreɪt/ — 列举，枚举。"The AI should be able to enumerate every property on a class."
> - *mechanism* /ˈmekənɪzəm/ — 机制。"Without a discovery mechanism, the AI operates blindly."

## No Runtime State

Every existing project focuses on editor-time operations. You can place actors and configure scenes, but you cannot inspect or control a running game. There is no tool to query the position of a character during gameplay, read a health variable in real time, or pause execution to examine state. For game developers — who spend most of their time iterating on runtime behavior — this is a critical limitation.

> **Word Notes**
> - *iterating* /ˈɪtəreɪtɪŋ/ — 迭代，反复修改。"Developers spend most of their time iterating on runtime behavior."
> - *critical* /ˈkrɪtɪkl/ — 关键的，至关重要的。"This is a critical limitation for practical use."

## No Cross-Engine Abstraction

Each project is tightly coupled to Unreal Engine. There is no abstraction layer that would let the same AI tools work with Unity, Godot, or a proprietary engine. If the game industry is going to adopt AI-assisted development broadly, it needs a common interface — not one custom integration per engine.

This is arguably the biggest opportunity. Unreal's reflection system, Unity's serialization, and Godot's GDExtension all expose metadata about their objects at runtime. A well-designed abstraction could map these different systems to a single set of MCP tools.

> **Word Notes**
> - *tightly coupled* — 紧耦合的，指两个系统之间依赖关系很强。"Each project is tightly coupled to one specific engine."
> - *proprietary* /prəˈpraɪəteri/ — 专有的，私有的。"A proprietary engine is one owned by a specific company."
> - *abstraction* /æbˈstrækʃn/ — 抽象层。"A common abstraction layer would unify different engines."

## The Opportunity

The gap between current implementations and a production-ready system is real. But the foundation is solid. Unreal Engine's reflection system already contains most of the information an AI would need — property names, types, hierarchies, function signatures. What's missing is code to surface it through MCP safely and completely.

For someone with deep engine experience, this is not a research problem. It is an engineering problem — and that makes it solvable.

*The pieces exist. Someone just needs to assemble them.*
