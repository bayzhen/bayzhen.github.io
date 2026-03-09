---
layout: article
title: "UE Rendering Architecture"
description: "How Unreal organizes its renderer: RHI, scene proxies, and the render thread"
level: intermediate
tags: ["GPU", "Rendering", "Unreal Engine", "English", "Reading"]
series: gpu-rendering
series_title: "GPU Rendering: English Reading"
order: 6
prev:
  title: "Modern Rendering"
  url: "05-modern-rendering.html"
next:
  title: "UE Materials"
  url: "07-ue-materials.html"
---

Unreal Engine renders some of the most visually stunning games in the world. But beneath the surface, its renderer is not one monolithic system — it is a carefully layered architecture where each layer has a clear job.

## The Render Hardware Interface

At the bottom sits the RHI — the Render Hardware Interface. Unreal supports DirectX 11, DirectX 12, Vulkan, Metal, and more. Rather than writing rendering code for each API separately, UE wraps them all behind the RHI. When the engine creates a texture or submits a draw call, it talks to the RHI, which translates that request into the correct API call for the current platform.

This abstraction means the same game can ship on PC, console, and mobile without rewriting its rendering logic.

> **Word Notes**
> - *monolithic* /ˌmɑːnəˈlɪθɪk/ — 整体式的，庞大且不可分割的。"The renderer is not one monolithic system."
> - *abstraction* /æbˈstrækʃn/ — 抽象层。"The RHI abstraction lets one codebase target multiple graphics APIs."

## Scene Proxies: The Bridge

Unreal separates the game thread from the render thread. Game objects (actors, components) live on the game thread. The renderer cannot touch them directly — that would cause race conditions. Instead, each renderable component creates a scene proxy: a lightweight, render-thread-safe copy of the data the renderer needs.

When you move an actor in the game world, the game thread updates the actor, then sends the new transform to the scene proxy. The render thread picks it up on its next frame. This decoupling lets both threads run in parallel without blocking each other.

> **Word Notes**
> - *race condition* — 竞态条件（多线程同时访问共享数据导致的错误）。"Scene proxies prevent race conditions between threads."
> - *decoupling* /diːˈkʌplɪŋ/ — 解耦。"Decoupling the game thread from the render thread lets both run in parallel."
> - *lightweight* /ˈlaɪtweɪt/ — 轻量级的。"A scene proxy is a lightweight copy of render-relevant data."

## The Render Thread

The render thread is where the actual rendering work is orchestrated. It traverses the scene, decides what is visible (through frustum and occlusion culling), sorts objects by material and distance, builds render passes, and submits draw commands to the RHI. In UE5, much of this work is further parallelized across task threads.

A typical UE frame looks like this: the game thread runs ahead by one or two frames, preparing scene proxy updates. The render thread consumes those updates, builds command lists, and hands them to the GPU. The GPU executes while the CPU is already working on the next frame.

> **Word Notes**
> - *traverses* /trəˈvɜːrsɪz/ — 遍历。"The render thread traverses the scene to find visible objects."
> - *frustum culling* — 视锥体剔除（丢弃摄像机视野外的物体）。"Frustum culling removes objects outside the camera's view."
> - *occlusion culling* — 遮挡剔除（丢弃被其他物体完全遮挡的物体）。"Occlusion culling skips objects hidden behind walls."

## Key Takeaways

- The RHI abstracts away platform-specific graphics APIs
- Scene proxies safely bridge the game thread and the render thread
- Game thread, render thread, and GPU overlap work across frames for maximum throughput

*The architecture keeps things organized. But what about the millions of material variations artists create? That's the material system — up next.*
