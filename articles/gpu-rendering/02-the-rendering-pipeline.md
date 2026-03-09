---
layout: article
title: "The Rendering Pipeline"
description: "How vertices become pixels, step by step"
level: intermediate
tags: ["GPU", "Rendering", "English", "Reading"]
series: gpu-rendering
series_title: "GPU Rendering: English Reading"
order: 2
prev:
  title: "Why GPUs Exist"
  url: "01-why-gpus-exist.html"
next:
  title: "Shaders"
  url: "03-shaders.html"
---

A 3D model starts as nothing but numbers — positions in space. By the time it reaches your screen, it is a grid of colored pixels. The rendering pipeline is the assembly line that makes this transformation happen, stage by stage.

## Stage 1: Vertex Processing

Everything begins with vertices. A vertex is a point in 3D space, defined by coordinates like (x, y, z). A triangle mesh — the basic building block of 3D models — is made of thousands of these vertices connected into triangles. In the vertex stage, the GPU transforms each vertex from model space into screen space using matrix multiplication. It also applies camera perspective, so objects farther away appear smaller.

> **Word Notes**
> - *vertex* /ˈvɜːrteks/ (pl. *vertices*) — 顶点。"A vertex is a point in 3D space."
> - *mesh* /meʃ/ — 网格（3D 模型的三角面集合）。"A triangle mesh is the building block of 3D models."
> - *matrix multiplication* — 矩阵乘法。"The GPU uses matrix multiplication to transform vertices."

## Stage 2: Rasterization

Once vertices are in screen space, the GPU must figure out which pixels each triangle covers. This process is called rasterization. The GPU takes each triangle, projects it onto the 2D screen, and generates fragments — potential pixel values. A single triangle might produce hundreds or thousands of fragments, depending on its screen size.

> **Word Notes**
> - *rasterization* /ˌræstəraɪˈzeɪʃn/ — 光栅化（将几何图形转为像素的过程）。"Rasterization determines which pixels a triangle covers."
> - *fragment* /ˈfræɡmənt/ — 片段（光栅化产生的潜在像素值）。"Each fragment is a candidate for a final pixel color."

## Stage 3: Fragment Processing

Each fragment now needs a color. The fragment stage calculates lighting, applies textures, and determines the final color value. This is where most of the visual magic happens — shadows, reflections, material properties all come together here. Fragments that fail the depth test (because another object is closer to the camera) are discarded.

> **Word Notes**
> - *depth test* — 深度测试（判断哪个片段离摄像机最近）。"Fragments that fail the depth test are discarded."
> - *discarded* /dɪˈskɑːrdɪd/ — 丢弃。"Hidden fragments are discarded to save processing time."

## Stage 4: Output

Surviving fragments are written to the framebuffer — a block of memory that holds the final image. The display reads from this buffer sixty or more times per second, producing the smooth motion you see on screen.

## Key Takeaways

- The pipeline flows: vertices → rasterization → fragments → pixels
- Each stage is massively parallel — millions of vertices and fragments processed simultaneously
- The depth test ensures only the closest surfaces are visible

*Vertices in, pixels out. But who tells the GPU what to do at each stage? That's where shaders come in.*
