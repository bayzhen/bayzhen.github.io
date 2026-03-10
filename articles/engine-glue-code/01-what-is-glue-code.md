---
layout: article
title: "What Is Glue Code?"
description: "Why game engines need a scripting bridge and what it looks like in practice"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 1
next:
  title: "The Stub Pattern: .py Meets .pyi"
  url: "02-stub-pattern.html"
---

Imagine you are building a house. The architect draws the blueprints in one language — precise structural engineering. But the interior designer works in a completely different vocabulary — colors, textures, moods. Somebody has to translate between the two. In game development, that translator is called **glue code**.

## The Two-Language Problem

Game engines like Unreal and Unity are written in C++ because it offers the raw speed needed for physics, rendering, and thousands of entities updating every frame. But writing gameplay logic in C++ is slow and painful. Every change requires a full recompile, which can take minutes. One misplaced pointer can crash the entire application.

> **Word Notes**
> - *raw speed* — 原始速度，指未经优化封装的底层性能。"C++ gives you raw speed at the cost of complexity."
> - *recompile* /ˌriːkəmˈpaɪl/ — 重新编译。"A full recompile of the engine takes over ten minutes."

That is why most engines embed a scripting language — Python, Lua, or C# — for gameplay code. Scripts are easier to write, safer to run, and can often be reloaded without restarting the engine. The catch? The scripting language cannot directly call C++ functions. It does not know what a `Vector3` is or how to move an entity.

## Enter the Glue

Glue code sits between the two worlds. For every C++ class or function the engine wants to expose, a corresponding Python wrapper is generated. In one production engine, this produces hundreds of stub files — one for each engine class. A C++ entity with methods like `Attach()`, `Detach()`, and properties like `Transform` becomes a Python class you can use as naturally as any other Python object.

> **Word Notes**
> - *stub* /stʌb/ — 存根，占位代码。"The stub file contains method signatures but no real implementation."
> - *marshal* /ˈmɑːrʃəl/ — 编排，整理数据以跨越边界传输。"The binding layer marshals Python floats into C++ float values."

## Why It Matters

Without glue code, gameplay programmers would be stuck in C++ — or the engine would need to be rewritten in a scripting language, sacrificing performance. Glue code is the invisible bridge that lets a small team iterate quickly on game logic while the engine handles the heavy lifting underneath.

## Key Takeaways

- Game engines use C++ for performance but scripting languages for productivity
- Glue code translates between the two, wrapping C++ classes as Python objects
- Every major engine has some form of this pattern — some use auto-generated stubs

*The best bridges are the ones you cross without noticing.*
