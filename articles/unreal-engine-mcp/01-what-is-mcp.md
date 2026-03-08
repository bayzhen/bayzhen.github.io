---
layout: article
title: "What Is MCP?"
description: "The Model Context Protocol explained — why AI models need a structured way to talk to game engines"
level: beginner
tags: ["MCP", "AI", "English", "Reading"]
series: unreal-engine-mcp
series_title: "Unreal Engine MCP: English Reading"
order: 1
next:
  title: "The MCP Landscape"
  url: "02-mcp-landscape.html"
---

Large language models are powerful thinkers — but they are blind. They cannot see your screen, click a button, or move an object in a 3D scene. To do anything in the real world, they need tools. The Model Context Protocol, or MCP, is how those tools are defined and delivered.

## The Problem

Imagine you ask an AI to "place a red cube at position (100, 200, 0) in Unreal Engine." The model understands what you want. It can even write the C++ code to do it. But it has no way to execute that code. It cannot reach into the editor, find the right menu, or call the right API. There is a gap between understanding and action.

Before MCP, developers closed this gap with custom integrations — one-off scripts, bespoke plugins, or fragile HTTP endpoints. Every tool required its own protocol. Nothing was standardized.

> **Word Notes**
> - *bespoke* /bɪˈspoʊk/ — 定制的，专门设计的。"Each team built bespoke integrations that only they understood."
> - *fragile* /ˈfrædʒəl/ — 脆弱的，易碎的。"Fragile endpoints break when the API changes."
> - *standardized* /ˈstændərdaɪzd/ — 标准化的。"Nothing was standardized across different tools."

## The Solution

MCP provides a universal structure. An MCP server exposes a set of tools — each with a name, a description, and a schema defining its inputs and outputs. The AI model reads the tool list, decides which tool to call, fills in the parameters, and sends the request. The server executes the action and returns a result.

This is similar to how a web browser calls a REST API, but designed specifically for AI. The model doesn't need to know the internal implementation. It only needs to know what tools are available and what parameters they accept.

> **Word Notes**
> - *expose* /ɪkˈspoʊz/ — 暴露，公开（接口）。"The server exposes a set of tools for the AI to use."
> - *schema* /ˈskiːmə/ — 模式，结构定义。"Each tool has a schema defining its inputs and outputs."

## Why Game Engines Need This

Game engines are among the most complex software systems ever built. Unreal Engine has thousands of classes and a deeply interconnected editor. An AI that can reliably interact with this system — spawning actors, adjusting materials, querying the scene graph — would transform how games are made.

But reliability requires structure. MCP gives the AI a contract: here are the tools, here are the rules, here is how you call them.

> **Word Notes**
> - *reliably* /rɪˈlaɪəbli/ — 可靠地。"An AI that can reliably interact with the engine."
> - *contract* /ˈkɑːntrækt/ — 契约，约定。"MCP gives the AI a contract for how to interact."

*The model can think. MCP lets it act.*
