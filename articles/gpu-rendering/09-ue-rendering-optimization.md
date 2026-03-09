---
layout: article
title: "UE Rendering Optimization"
description: "Draw calls, culling, profiling, and making frames fit in 16ms"
level: advanced
tags: ["GPU", "Rendering", "Unreal Engine", "English", "Reading"]
series: gpu-rendering
series_title: "GPU Rendering: English Reading"
order: 9
prev:
  title: "Lumen and Nanite"
  url: "08-lumen-and-nanite.html"
---

A beautiful scene means nothing if it runs at fifteen frames per second. At 60 fps, every frame must complete in 16.67 milliseconds. At 30 fps, you get 33ms. Rendering optimization is the art of fitting your visual ambitions inside that budget.

## Finding the Bottleneck

The first rule of optimization: measure before you guess. Unreal provides several profiling tools. The `stat gpu` console command shows how long each render pass takes — base pass, shadow depths, lighting, translucency, post-processing. The GPU Visualizer breaks the frame into a timeline. Unreal Insights captures detailed traces for offline analysis.

Is the frame GPU-bound or CPU-bound? If the render thread is idle while the GPU runs, you are GPU-bound — reduce shader complexity or pixel count. If the GPU finishes early but the game thread is slow, the bottleneck is elsewhere.

> **Word Notes**
> - *profiling* /ˈproʊfaɪlɪŋ/ — 性能分析。"Profiling tells you where each millisecond is spent."
> - *GPU-bound* — GPU 瓶颈（GPU 是帧率限制因素）。"If the GPU takes longest, the frame is GPU-bound."
> - *translucency* /trænˈsluːsənsi/ — 半透明（渲染半透明物体的开销通常很大）。"Translucency is one of the most expensive render passes."

## Draw Calls and Batching

A draw call is a command from the CPU telling the GPU to render something. Each draw call has overhead: the driver validates state, uploads data, and dispatches work. Too many draw calls — thousands of tiny meshes each with a unique material — and the CPU cannot feed the GPU fast enough.

Solutions include mesh merging (combining nearby static meshes into one), instanced rendering (drawing many copies of the same mesh in one call), and Nanite (which manages its own draw submission internally). Reducing material variety also helps, because each unique material may require a separate draw call.

> **Word Notes**
> - *overhead* /ˈoʊvərhed/ — 额外开销。"Each draw call carries CPU overhead."
> - *dispatches* /dɪˈspætʃɪz/ — 调度，分派。"The driver dispatches work to the GPU."
> - *instanced rendering* — 实例化渲染（一次绘制同一网格的多个副本）。"Instanced rendering draws a thousand trees in a single call."

## Culling: Don't Render What You Can't See

The fastest pixel is the one you never draw. Frustum culling removes objects outside the camera view. Occlusion culling removes objects hidden behind walls. Nanite performs per-cluster culling on the GPU. Distance culling hides objects too far away to matter.

UE also offers precomputed visibility volumes for indoor scenes — the engine precalculates which cells can see which objects, eliminating runtime occlusion queries entirely.

> **Word Notes**
> - *precomputed* /ˌpriːkəmˈpjuːtɪd/ — 预计算的。"Precomputed visibility removes runtime occlusion cost."

## Resolution and Scalability

When nothing else works, reduce the number of pixels. Dynamic resolution scaling lowers the render resolution when the frame budget is tight, then raises it when there is headroom. UE's scalability settings let you tune shadow quality, post-processing, foliage density, and view distance per platform — shipping the same game at high quality on PC and acceptable quality on mobile.

## Key Takeaways

- Always profile first — `stat gpu`, GPU Visualizer, and Unreal Insights are your best friends
- Reduce draw calls through batching, instancing, and material consolidation
- Cull aggressively: frustum, occlusion, distance, and precomputed visibility
- Dynamic resolution scaling is your safety net when the frame budget is tight

*Sixteen milliseconds. That's all you get. Measure, cut, and iterate — until every frame earns its place on screen.*
