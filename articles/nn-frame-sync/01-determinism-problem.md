---
layout: article
title: "The Determinism Problem"
description: "Why frame-synchronized games cannot tolerate even the tiniest floating-point difference"
level: intermediate
tags: ["Game Dev", "English", "Reading"]
series: nn-frame-sync
series_title: "Neural Networks in Frame-Sync Games: English Reading"
order: 1
next:
  title: "Integer Quantization to the Rescue"
  url: "02-integer-quantization.html"
---

Imagine a football game where you control one player, but ten teammates move on their own. Now imagine that on your phone, your striker runs left — but on your opponent's phone, the same striker runs right. The match is broken. This is the determinism problem, and it haunts every frame-synchronized multiplayer game.

## How Frame Sync Works

In a frame-sync architecture, the server does not simulate the game world. Instead, it collects player inputs and broadcasts them to every client. Each client then runs the exact same simulation locally — physics, collisions, AI decisions, everything. If every client starts from the same state and processes the same inputs, they should arrive at the same result. The keyword here is "should."

> **Word Notes**
> - *determinism* /dɪˈtɜːrmɪnɪzəm/ — 确定性。In computing, producing identical output from identical input every time.
> - *haunt* /hɔːnt/ — 困扰，萦绕。"Memory leaks haunt poorly written code."

## Where Neural Networks Break Things

Traditional game AI uses rule-based logic: if-else trees, state machines, utility scores. These are built on integer math and boolean conditions — perfectly deterministic. But neural networks rely on floating-point matrix multiplication, and here is the trap: floating-point arithmetic is not guaranteed to produce identical results across different hardware.

An iPhone's ARM chip and an Android's Snapdragon may compute `0.1 + 0.2` slightly differently due to rounding rules, FMA instructions, or SIMD implementations. For a single calculation, the difference might be in the fifteenth decimal place. But in a game running at 60 frames per second, with 20 AI players each making decisions every frame, those tiny errors compound. Within seconds, one client's AI midfielder has drifted a meter from where the other client thinks he is. Within minutes, one client registers a goal that the other never saw.

> **Word Notes**
> - *compound* /kəmˈpaʊnd/ — 累积，加剧。"Small errors compound over time into major bugs."
> - *FMA (fused multiply-add)* — 融合乘加指令。A CPU instruction that computes `a×b+c` in one step, skipping intermediate rounding.

## The Real Constraint

The problem is not that neural networks are slow or inaccurate. The problem is that 20 AI-controlled players must behave identically on every device, every frame, with zero tolerance for deviation. Traditional model formats like ONNX do not guarantee this. So game developers must find another way.

## Key Takeaways

- Frame-sync games require all clients to produce bit-identical simulation results
- Floating-point math varies across CPU architectures, breaking determinism
- 20 AI players × 60 FPS × accumulated drift = desynchronization disaster

*When your game's correctness depends on the fifteenth decimal place, you need a different kind of math.*
