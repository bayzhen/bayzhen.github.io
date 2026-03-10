---
layout: article
title: "Deploying ML Models in Live Games"
description: "Engineering trade-offs when shipping neural networks inside a frame-synchronized game client"
level: intermediate
tags: ["Game Dev", "English", "Reading"]
series: nn-frame-sync
series_title: "Neural Networks in Frame-Sync Games: English Reading"
order: 5
prev:
  title: "From Imitation to Reinforcement Learning"
  url: "04-reinforcement-learning.html"
---

Training a great model is only half the battle. Shipping it inside a live game — where it must run on millions of devices, inside a frame-sync loop, without crashing or lagging — is a different kind of challenge entirely. This article explores the engineering trade-offs that shape real-world deployment.

## Not All AI Runs Inside Frame Sync

A common misconception is that all game AI must be deterministic. In fact, only the AI that runs as part of the shared simulation needs determinism. Consider a football game: you control one player, and 20 others are AI-driven. Those 20 must be deterministic because every client simulates them. But other AI features — like a coaching suggestion system or a post-match analytics engine — can run freely with floating-point models because their results are not part of the synchronized simulation.

This means a single game may use multiple inference engines side by side: integer quantized models for frame-sync AI, and standard ONNX Runtime for everything else.

> **Word Notes**
> - *misconception* /ˌmɪskənˈsepʃn/ — 误解。"A common misconception is that more layers always mean better accuracy."
> - *side by side* — 并行地，同时。"The two systems run side by side without interference."

## Model Versioning and Updates

When you update a model, every client must switch to the new version at the same frame. If one client runs model v2 while another still runs v1, the AI players will make different decisions and the game desyncs. This is why some studios embed model weights directly in the game code — it guarantees that code version and model version are always in lockstep.

A more elegant approach is to store weights in a binary resource file, versioned alongside the game build. The client loads the model at startup, verifies a checksum, and refuses to enter a match if the checksum does not match the server's expected value.

> **Word Notes**
> - *desync* /diːˈsɪŋk/ — 不同步（游戏术语）。"A floating-point mismatch caused a desync in frame 3,400."
> - *lockstep* /ˈlɑːkstep/ — 同步一致。"Code and data must advance in lockstep."

## Performance Budgets on Mobile

A frame-sync game running at 60 FPS gives you roughly 16 milliseconds per frame — and the AI budget is a fraction of that. On a low-end phone, running 20 neural network inferences per frame could blow the budget entirely. Practical solutions include:

- **Staggering inference**: not every AI player needs a new decision every frame. Update 5 players per frame in rotation.
- **Model tiers**: use knowledge distillation to create smaller models for weaker devices, with a runtime benchmark at first launch to select the right tier.
- **Fallback actions**: if inference takes too long, emit a safe default action (hold position, continue current movement) rather than stalling the simulation.

> **Word Notes**
> - *stagger* /ˈstæɡər/ — 错开，交错安排。"Stagger the API calls to avoid overwhelming the server."
> - *knowledge distillation* — 知识蒸馏。Training a small "student" model to mimic a large "teacher" model's behavior.

## Key Takeaways

- Only AI inside the frame-sync loop needs determinism; other features can use standard float inference
- Model versioning must be airtight — a version mismatch between clients causes desync
- Mobile performance demands creative budgeting: staggered updates, model tiers, and fallback actions

*The best model in the world is worthless if it cannot survive the chaos of a million phones running your game.*
