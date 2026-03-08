---
layout: article
title: "Inside unreal-mcp"
description: "Architecture deep dive into chongdashu/unreal-mcp — Python server, TCP bridge, and C++ plugin"
level: intermediate
tags: ["MCP", "Architecture", "English", "Reading"]
series: unreal-engine-mcp
series_title: "Unreal Engine MCP: English Reading"
order: 3
prev:
  title: "The MCP Landscape"
  url: "02-mcp-landscape.html"
next:
  title: "Reflection as the Bridge"
  url: "04-reflection-bridge.html"
---

The chongdashu/unreal-mcp project has a clean three-layer architecture. Understanding how these layers connect reveals the fundamental challenge of bridging AI to a game engine.

## The Three Layers

The system works like a relay chain. At the top sits a **Python MCP Server** that speaks the Model Context Protocol. It receives tool calls from the AI model — "create an actor," "set a property," "get the scene hierarchy" — and translates them into structured JSON commands.

In the middle is a **TCP connection**. The Python server sends JSON messages over a raw TCP socket to a listener inside Unreal Engine. This is the bridge between two worlds: Python's flexible scripting environment and Unreal's C++ runtime.

At the bottom is a **C++ Editor Plugin** running inside Unreal Engine. It parses incoming JSON commands, maps them to Unreal Editor API calls, executes the operations, and sends results back over the same TCP connection.

> **Word Notes**
> - *relay* /ˈriːleɪ/ — 接力，中继。"The system works like a relay chain passing messages between layers."
> - *parse* /pɑːrz/ — 解析。"The plugin parses incoming JSON commands into structured data."
> - *bridge* /brɪdʒ/ — 桥梁（这里指连接两个不同系统）。"TCP is the bridge between Python and Unreal."

## How a Command Flows

When you ask Claude to "create a cube at position (0, 0, 100)," here is what happens:

1. Claude selects the `create_actor` tool and fills in the parameters
2. The Python MCP server receives the tool call and builds a JSON message
3. The message travels over TCP to the Unreal plugin
4. The plugin calls `UEditorLevelLibrary` to spawn a static mesh actor
5. The plugin sets the actor's location using `SetActorLocation`
6. A success response flows back through TCP to Python to Claude

The entire round trip typically completes in under a second. The user sees Claude report: "Done. I created a cube at (0, 0, 100)."

> **Word Notes**
> - *spawn* /spɔːn/ — 生成（游戏开发术语，指在场景中创建对象）。"The plugin spawns a static mesh actor in the scene."
> - *round trip* — 往返（指请求发出到收到响应的完整过程）。"The entire round trip completes in under a second."

## Design Trade-offs

This architecture is pragmatic. Python is easy to extend — adding a new MCP tool means writing a few lines of Python. TCP is fast and lightweight. But the C++ plugin is the bottleneck. Every new capability requires C++ code compiled into the plugin. You cannot dynamically discover what the engine can do; someone must manually write each binding.

This is where Unreal's reflection system enters the picture. It offers a way to generalize these bindings — but current implementations only scratch the surface.

> **Word Notes**
> - *pragmatic* /præɡˈmætɪk/ — 务实的。"This architecture is pragmatic rather than elegant."
> - *bottleneck* /ˈbɑːtlnek/ — 瓶颈。"The C++ plugin is the bottleneck for adding new features."

*Three layers, one goal: let AI touch the engine.*
