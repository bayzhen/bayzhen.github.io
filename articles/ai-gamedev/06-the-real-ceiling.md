---
layout: article
title: "The Real Ceiling"
description: "AI's limit in game dev isn't tools or engines — it's how deeply we've formalized game design knowledge"
level: intermediate
tags: ["Game Design", "AI", "English", "Reading"]
series: ai-gamedev
series_title: "AI-Accelerated Game Dev: English Reading"
order: 6
prev:
  title: "The Wrong Target"
  url: "05-wrong-target.html"
next:
  title: "A Practical Path Forward"
  url: "07-practical-path.html"
---

We have traveled a long arc. AI can build games — the dream is real. MCP provides the tools — the protocol works. But Unreal Engine resists — the target is wrong. An AI-native engine would help — but even then, something limits what AI can build. That something is us.

## What AI Can Fully Handle

Games that text can completely describe are within AI's reach today. A visual novel is dialogue trees and branching logic. A card game is rules, states, and transitions. Turn-based strategy is math: unit stats, movement costs, combat formulas. These games are fully formalizable, and an AI can build them end-to-end.

> **Word Notes**
> - *formalizable* /ˈfɔːrməlaɪzəbl/ — 可形式化的。"Turn-based games are fully formalizable as math."
> - *transitions* /trænˈzɪʃnz/ — 转换，过渡。"A card game is rules, states, and transitions."
> - *branching* /ˈbræntʃɪŋ/ — 分支的。"Visual novels are dialogue trees with branching logic."

## The Game Feel Problem

"Game feel" seems to resist formalization. The weight of a jump, the responsiveness of a dodge, the satisfaction of landing a hit — these feel like artistic intuition, not math. But look closer.

Jump weight is an input curve mapping button hold time to vertical velocity. Dodge responsiveness is animation cancel frames plus input buffer windows. Hit satisfaction is screen shake amplitude, hit-stop duration, particle velocity, and sound envelope timing. Every component of game feel is ultimately a mathematical parameter. We know this because game designers already tune these numbers — they just do it by hand, guided by experience and instinct.

> **Word Notes**
> - *responsiveness* /rɪˈspɑːnsɪvnəs/ — 响应性。"Dodge responsiveness is measured in frames and milliseconds."
> - *amplitude* /ˈæmplɪtuːd/ — 振幅。"Screen shake amplitude affects how impactful a hit feels."
> - *envelope* /ˈenvəloʊp/ — 包络（波形）。"Sound envelope timing shapes how we perceive each hit."

## The Historical Analogy

Color was once purely artistic intuition. A painter "just knew" which colors worked together. Then came CIE color spaces, perceptual models, and color science. We formalized the intuition into math, and now algorithms handle color correction, palette generation, and accessibility testing.

Game feel is in the same historical stage. We know every component is math — input curves, physics parameters, animation blending weights, audio timing. But we have not yet built the unified models that connect these parameters to player experience. We lack the equivalent of a "perceptual model" for game feel.

> **Word Notes**
> - *perceptual* /pərˈseptʃuəl/ — 感知的。"We lack a perceptual model for game feel."
> - *unified* /ˈjuːnɪfaɪd/ — 统一的。"We haven't built unified models connecting parameters to experience."

## The Core Thesis

AI's ceiling in game development is not set by tools, protocols, or engines. It is set by **how deeply we have formalized game design knowledge**. The tools are ready. The AI is ready. What is missing is the formal language to describe what makes a game feel right.

The real work ahead is not building better MCP servers or AI-native engines — it is building formal models of game feel, player aesthetics, and interactive experience. When we can describe "game feel" as precisely as we describe color, AI will be able to build any game we can imagine.

The engine is not the bottleneck. Our understanding is.

*AI's limit is not its tools. It is the depth of our knowledge.*
