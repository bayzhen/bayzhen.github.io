---
layout: article
title: "Lumen and Nanite"
description: "UE5's breakthrough systems for global illumination and virtual geometry"
level: advanced
tags: ["GPU", "Rendering", "Unreal Engine", "English", "Reading"]
series: gpu-rendering
series_title: "GPU Rendering: English Reading"
order: 8
prev:
  title: "UE Materials"
  url: "07-ue-materials.html"
next:
  title: "UE Rendering Optimization"
  url: "09-ue-rendering-optimization.html"
---

For years, game developers faced two painful tradeoffs: bake your lighting and wait hours for results, or use dynamic lights and accept inferior quality. Build detailed meshes and manage LODs by hand, or simplify your art. Unreal Engine 5 introduced two systems that challenge both compromises.

## Lumen: Dynamic Global Illumination

Lumen is UE5's fully dynamic global illumination and reflection system. Move a wall, change a light color, open a door — the lighting updates in real time. No lightmap baking required.

How does it work? Lumen uses a hybrid approach. It builds a simplified representation of the scene using signed distance fields and mesh cards — small flat surfaces that approximate how light bounces off objects. For screen-space detail, it traces rays against this representation. For distant lighting, it falls back to screen-space techniques and radiance caching.

The result is not physically perfect — true path tracing would be far more expensive. But Lumen is good enough that most players cannot tell the difference, and it gives artists instant feedback when they iterate on a scene.

> **Word Notes**
> - *tradeoff* /ˈtreɪdɒf/ — 权衡取舍。"Developers faced painful tradeoffs between quality and performance."
> - *signed distance field* (SDF) — 有符号距离场（存储空间中每个点到最近表面距离的数据结构）。"Lumen uses signed distance fields to trace light efficiently."
> - *iterate* /ˈɪtəreɪt/ — 迭代。"Artists can iterate on lighting in real time."

## Nanite: Virtual Geometry

Nanite is a virtual geometry system. Import a film-quality mesh with millions of triangles, and Nanite handles the rest. It streams triangle data on demand, automatically selecting the right level of detail for each pixel on screen. Close-up surfaces show full detail; distant surfaces simplify transparently. There are no traditional LOD meshes to author.

Under the hood, Nanite organizes geometry into a hierarchy of clusters. During rendering, it performs per-cluster visibility tests on the GPU, only drawing clusters that are actually visible and at a detail level appropriate for their screen size. This software rasterizer runs alongside the hardware rasterizer — small triangles are rasterized in software for efficiency, while larger ones use the standard pipeline.

> **Word Notes**
> - *cluster* /ˈklʌstər/ — 簇（一组三角形的集合）。"Nanite organizes geometry into a hierarchy of clusters."
> - *on demand* — 按需。"Nanite streams triangle data on demand."
> - *transparently* /trænsˈpærəntli/ — 透明地（用户无感知地）。"Distant surfaces simplify transparently — the player never notices."

## Working Together

Lumen and Nanite complement each other. Nanite feeds Lumen the geometric data it needs for accurate light bounces. Lumen lights the massive geometry Nanite delivers without requiring pre-baked data. Together, they let artists focus on creative work instead of technical workarounds.

> **Word Notes**
> - *complement* /ˈkɑːmplɪment/ — 互补。"Lumen and Nanite complement each other in the rendering pipeline."

## Key Takeaways

- Lumen provides real-time global illumination using SDFs, mesh cards, and ray tracing
- Nanite streams film-quality geometry with automatic, per-pixel level of detail
- Both systems remove traditional manual workflows: no more baking lights or authoring LODs

*These systems are powerful but not free. Every millisecond counts. Next: how to find and fix rendering bottlenecks in UE.*
