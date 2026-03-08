---
layout: article
title: "Reflection as the Bridge"
description: "How Unreal Engine's reflection system enables AI-driven property editing through FindPropertyByName and FProperty"
level: intermediate
tags: ["Reflection", "Unreal Engine", "English", "Reading"]
series: unreal-engine-mcp
series_title: "Unreal Engine MCP: English Reading"
order: 4
prev:
  title: "Inside unreal-mcp"
  url: "03-inside-unreal-mcp.html"
next:
  title: "What's Missing"
  url: "05-whats-missing.html"
---

Unreal Engine knows more about itself than most software. Its reflection system — the `UPROPERTY`, `UFUNCTION`, and `UCLASS` macros that Unreal developers use every day — creates a runtime database of every exposed class, property, and function. MCP projects use this to let AI set object properties without hardcoding every possible field.

## How SetObjectProperty Works

The most interesting function in unreal-mcp's C++ plugin is `SetObjectProperty`. When the AI says "set the cube's mobility to movable," the plugin doesn't use a switch statement with hundreds of cases. Instead, it does something elegant:

1. **Find the object** by name or path in the current level
2. **Call `FindPropertyByName`** to look up the property in the object's UClass metadata
3. **Use `CastField`** to determine the property's type — is it a `FFloatProperty`, `FBoolProperty`, `FStrProperty`, or something else?
4. **Write the value** using the appropriate typed setter

This means the same function can set a float, a boolean, a string, or an enum — without knowing at compile time which property the AI will target.

> **Word Notes**
> - *metadata* /ˈmetədeɪtə/ — 元数据，描述数据的数据。"UClass metadata describes every property and function at runtime."
> - *elegant* /ˈelɪɡənt/ — 优雅的，精巧的。"The approach is elegant because one function handles many types."
> - *compile time* — 编译时。"The plugin doesn't know at compile time which property the AI will choose."

## What Reflection Enables

This approach is powerful because it is generic. You don't need a separate MCP tool for "set location," "set rotation," "set material," and "set visibility." One tool — `set_object_property` — handles all of them, as long as the property is exposed to reflection.

For an AI agent, this is transformative. Instead of memorizing dozens of specialized commands, the model can learn one pattern: find the object, name the property, provide the value. The reflection system handles the rest.

> **Word Notes**
> - *generic* /dʒəˈnerɪk/ — 通用的。"The approach is generic — it works for any reflected property."
> - *transformative* /trænsˈfɔːrmətɪv/ — 变革性的。"For AI agents, generic property access is transformative."

## What Reflection Doesn't Do (Yet)

Current implementations can set properties, but they cannot fully discover them. There is no tool that says: "Given this actor, list every property it has, their types, and their current values." The AI must already know the property name to set it.

Similarly, `UFUNCTION` reflection is largely untapped. Unreal exposes function signatures at runtime — parameter names, types, return values — but no MCP project yet offers a generic "call any reflected function" tool. The bridge exists in the engine. It just hasn't been crossed.

> **Word Notes**
> - *untapped* /ʌnˈtæpt/ — 未开发的，未利用的。"UFUNCTION reflection is largely untapped by current MCP projects."
> - *signatures* /ˈsɪɡnətʃərz/ — 签名（这里指函数签名：函数名、参数、返回值）。"Unreal exposes function signatures at runtime."

*The engine already knows itself. The question is whether we let AI ask.*
