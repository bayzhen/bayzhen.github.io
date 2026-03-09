---
layout: article
title: "Modern Rendering"
description: "Deferred shading, ray tracing, and what comes next"
level: advanced
tags: ["GPU", "Rendering", "English", "Reading"]
series: gpu-rendering
series_title: "GPU Rendering: English Reading"
order: 5
prev:
  title: "Textures and Lighting"
  url: "04-textures-and-lighting.html"
next:
  title: "UE Rendering Architecture"
  url: "06-ue-rendering-architecture.html"
---

The classic rendering pipeline — one pass, light everything at once — worked fine when games had a dozen lights. Modern scenes have hundreds or thousands. That old approach hit a wall, and the industry had to rethink how rendering works.

## The Forward Rendering Problem

In forward rendering, every object is shaded with every light in a single pass. If you have 100 objects and 50 lights, the GPU evaluates 5,000 object-light combinations. Most of those calculations are wasted on pixels that end up hidden behind other objects. As scenes grew more complex, forward rendering became a bottleneck.

> **Word Notes**
> - *bottleneck* /ˈbɑːtlnek/ — 瓶颈。"Forward rendering became a bottleneck as scene complexity grew."
> - *evaluate* /ɪˈvæljueɪt/ — 计算，评估。"The GPU evaluates thousands of object-light combinations."

## Deferred Rendering

Deferred rendering solves this by splitting the work into two passes. The first pass — the geometry pass — renders every object but only stores surface data: position, normal, color, roughness. This data goes into a set of textures called the G-buffer. No lighting is calculated yet.

The second pass — the lighting pass — reads from the G-buffer and applies lights only to visible pixels. Hidden surfaces were already eliminated in the geometry pass, so no computation is wasted. Adding more lights now costs proportional to the number of pixels they affect, not the total number of objects.

> **Word Notes**
> - *deferred* /dɪˈfɜːrd/ — 延迟的。"Deferred rendering delays lighting to a second pass."
> - *G-buffer* — 几何缓冲区（存储几何阶段输出数据的纹理集合）。"The G-buffer stores position, normal, and material data for every visible pixel."
> - *proportional* /prəˈpɔːrʃənl/ — 成比例的。"Light cost is proportional to the pixels each light touches."

## Ray Tracing: The Old Dream Made Real

Ray tracing simulates how light actually travels. For each pixel, the GPU shoots a ray into the scene. If the ray hits a surface, it bounces — picking up color, shadow, and reflection information along the way. This produces physically accurate reflections, soft shadows, and global illumination that rasterization can only approximate.

For decades, ray tracing was too expensive for real time. NVIDIA's RTX hardware, introduced in 2018, added dedicated ray tracing cores that accelerate ray-scene intersection tests. Today, most AAA games use a hybrid approach: rasterization for primary visibility, ray tracing for select effects like reflections and shadows.

> **Word Notes**
> - *intersection* /ˌɪntərˈsekʃn/ — 交叉，相交（光线与场景几何体的交点检测）。"RT cores accelerate ray-scene intersection tests."
> - *hybrid* /ˈhaɪbrɪd/ — 混合的。"Modern games use a hybrid of rasterization and ray tracing."

## What Comes Next

The frontier keeps moving. Nanite in Unreal Engine 5 streams billions of triangles with no visible pop-in. Lumen provides real-time global illumination without baking. Neural rendering uses machine learning to generate pixels directly. Each generation pushes the boundary between real-time and offline quality closer together.

## Key Takeaways

- Deferred rendering decouples geometry from lighting, scaling to hundreds of lights efficiently
- Ray tracing produces physically accurate effects but relies on dedicated hardware
- The future blends rasterization, ray tracing, and neural techniques

*Now you know how GPUs render in general. Let's see how one of the world's most powerful engines puts it all together.*
