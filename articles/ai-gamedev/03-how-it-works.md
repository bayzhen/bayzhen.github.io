---
layout: article
title: "How AI Talks to an Engine"
description: "Architecture deep dive — three layers connecting AI to Unreal Engine"
level: intermediate
tags: ["MCP", "Unreal Engine", "English", "Reading"]
series: ai-gamedev
series_title: "AI-Accelerated Game Dev: English Reading"
order: 3
prev:
  title: "MCP: A Promising Answer"
  url: "02-mcp-promise.html"
next:
  title: "Where It Breaks"
  url: "04-where-it-breaks.html"
---

When an AI model says "create a red cube at position (100, 200, 0)," what actually happens? The answer involves three layers, each with its own language and constraints.

## The Three-Layer Architecture

The typical Unreal MCP setup has three components. First, a **Python MCP Server** that speaks the MCP protocol and translates AI requests into structured commands. Second, a **TCP connection** that carries those commands as JSON messages. Third, a **C++ Editor Plugin** running inside Unreal that receives the commands and executes the actual engine operations.

The flow looks like this: the AI calls a tool on the MCP server. The server serializes the request into JSON and sends it over TCP. The plugin deserializes the message, maps it to an engine function, executes it, and sends the result back through the same channel.

> **Word Notes**
> - *serializes* /ˈsɪriəlaɪzɪz/ — 序列化，将数据转换为可传输格式。"The server serializes the request into JSON."
> - *deserializes* /diːˈsɪriəlaɪzɪz/ — 反序列化。"The plugin deserializes the message back into a function call."
> - *constraints* /kənˈstreɪnts/ — 约束，限制。"Each layer has its own language and constraints."

## A Command Walkthrough

Let's trace a real command. The user asks: "Create a cube at position (100, 200, 0)." The AI selects the `spawn_actor` tool and fills in the parameters: class name, location, rotation. The MCP server packs this into a JSON message and sends it to the editor plugin. The plugin calls `UWorld::SpawnActor`, sets the transform, and returns the new actor's name and ID. The AI receives confirmation: "StaticMeshActor_42 created at (100, 200, 0)."

Each step is straightforward. The architecture is clean. But notice the trade-offs.

> **Word Notes**
> - *trace* /treɪs/ — 追踪。"Let's trace a real command through the system."
> - *confirmation* /ˌkɑːnfərˈmeɪʃn/ — 确认。"The AI receives confirmation that the actor was created."

## The Trade-Offs

Python is easy to extend. Adding a new MCP tool means writing a new Python function — no recompilation, no engine restart. This is why most projects choose Python for the server layer. But the C++ plugin is a bottleneck. Every new engine operation requires modifying, recompiling, and reloading the plugin. The plugin must be maintained alongside engine upgrades, and it must handle edge cases that the Python layer never sees.

This means the tool surface grows quickly on the Python side but slowly on the C++ side. The AI can only do what the plugin explicitly supports. Everything else fails silently or returns an error.

> **Word Notes**
> - *bottleneck* /ˈbɑːtlnek/ — 瓶颈。"The C++ plugin is a bottleneck for adding new capabilities."
> - *recompilation* /ˌriːkɑːmpɪˈleɪʃn/ — 重新编译。"Adding engine operations requires recompilation of the plugin."

*The architecture is elegant. The demos work. So where does it go wrong?*
