---
layout: article
title: "MCP: A Promising Answer"
description: "The Model Context Protocol and the teams already using it with game engines"
level: beginner
tags: ["MCP", "AI", "English", "Reading"]
series: ai-gamedev
series_title: "AI-Accelerated Game Dev: English Reading"
order: 2
prev:
  title: "The Dream"
  url: "01-the-dream.html"
next:
  title: "How AI Talks to an Engine"
  url: "03-how-it-works.html"
---

AI models are powerful thinkers, but they are blind. They cannot see your screen, click a button, or move an object in a 3D viewport. To do anything in the real world, they need tools. The Model Context Protocol — MCP — is how those tools are defined and delivered.

## What MCP Is

MCP provides a universal structure for connecting AI to external tools. An MCP server exposes a set of tools, each with a name, a description, and a schema defining its inputs and outputs. The AI reads the tool list, picks the right one, fills in the parameters, and sends the request. The server executes the action and returns a result. Think of it as a REST API, but designed specifically for AI models.

> **Word Notes**
> - *universal* /ˌjuːnɪˈvɜːrsl/ — 通用的。"MCP provides a universal structure for AI-tool connections."
> - *schema* /ˈskiːmə/ — 模式，结构定义。"Each tool has a schema defining its inputs and outputs."
> - *protocol* /ˈproʊtəkɔːl/ — 协议。"The Model Context Protocol standardizes how AI talks to tools."

## The Landscape

The community moved fast. The most popular project, **unreal-mcp**, has over 1,500 stars on GitHub and offers tools for actor spawning, material editing, and scene queries. **ChiR24's MCP server** provides 36 specialized tools covering everything from blueprint manipulation to editor automation. Other projects target Unity, Godot, and custom engines.

A common pattern emerges: Python MCP servers communicate over TCP with C++ editor plugins. The Python side is easy to extend — add a new function and the AI can call it immediately. The C++ side handles the actual engine operations.

> **Word Notes**
> - *manipulation* /məˌnɪpjuˈleɪʃn/ — 操作，处理。"Blueprint manipulation lets AI modify game logic visually."
> - *emerges* /ɪˈmɜːrdʒɪz/ — 出现，浮现。"A common pattern emerges across these projects."
> - *automation* /ˌɔːtəˈmeɪʃn/ — 自动化。"Editor automation saves repetitive manual work."

## Reasons for Optimism

People are already doing real work with these tools. They spawn actors by describing what they want. They adjust lighting by asking the AI to "make the scene warmer." They query the scene graph to understand level structure. The demos are impressive. The iteration speed is remarkable.

If you stop here, the story is exciting: MCP works, the tools exist, the future is bright. But we should look deeper. How exactly does the AI communicate with an engine as complex as Unreal? What happens under the hood?

> **Word Notes**
> - *iteration* /ˌɪtəˈreɪʃn/ — 迭代。"The iteration speed with AI tools is remarkable."

*The tools exist. People are using them. But how do they actually work?*
