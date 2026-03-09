---
layout: article
title: "Shaders"
description: "The programmable heart of every modern GPU"
level: intermediate
tags: ["GPU", "Rendering", "English", "Reading"]
series: gpu-rendering
series_title: "GPU Rendering: English Reading"
order: 3
prev:
  title: "The Rendering Pipeline"
  url: "02-the-rendering-pipeline.html"
next:
  title: "Textures and Lighting"
  url: "04-textures-and-lighting.html"
---

In the early days, GPUs were hardwired. You fed them triangles and got pixels back, with no way to customize what happened in between. Then came shaders — small programs that run directly on the GPU — and everything changed.

## What Is a Shader?

A shader is a program you write that the GPU executes for every vertex or every fragment in parallel. You don't loop over pixels yourself; the GPU handles that. You just define what happens to one element, and the GPU applies your logic to millions of them simultaneously. This model is what makes GPUs so powerful for rendering.

> **Word Notes**
> - *hardwired* /ˈhɑːrdwaɪərd/ — 硬连线的，固定功能的。"Early GPUs were hardwired — no custom programs allowed."
> - *simultaneously* /ˌsaɪməlˈteɪniəsli/ — 同时地。"The GPU runs your shader on millions of elements simultaneously."

## Vertex Shaders

A vertex shader runs once per vertex. Its primary job is to transform vertex positions from 3D world space to 2D screen space. But it can do much more — skeletal animation, wind effects on foliage, terrain displacement. Anything that moves or deforms geometry happens here.

For example, a simple ocean wave effect works by having the vertex shader offset each vertex's height based on a sine wave and the current time. No new geometry is created; the existing mesh simply bends.

> **Word Notes**
> - *skeletal animation* — 骨骼动画。"Vertex shaders drive skeletal animation by moving vertices based on bone transforms."
> - *displacement* /dɪsˈpleɪsmənt/ — 位移，置换。"Terrain displacement adds geometric detail using height data."
> - *foliage* /ˈfoʊliɪdʒ/ — 植被，树叶。"Wind effects on foliage make forests look alive."

## Fragment Shaders

A fragment shader (also called a pixel shader) runs once per fragment. It determines the final color of each pixel. This is where you implement lighting models, sample textures, blend colors, and create effects like fog, bloom, or cel-shading.

The fragment shader is usually the most expensive stage. A complex material might sample five or six textures, calculate multiple light sources, and apply post-processing — all per pixel, all at 60 fps.

> **Word Notes**
> - *cel-shading* — 卡通渲染（模仿手绘动画的渲染风格）。"Cel-shading gives 3D models a hand-drawn look."
> - *bloom* /bluːm/ — 泛光效果（明亮区域向外溢出光芒）。"Bloom makes bright lights glow and bleed into surrounding pixels."

## Beyond Two: Geometry and Compute

Modern GPUs also support geometry shaders (which can create or destroy triangles on the fly) and compute shaders (general-purpose programs that aren't tied to rendering at all). Compute shaders power particle simulations, physics calculations, and even AI inference on the GPU.

## Key Takeaways

- Shaders are small programs that run in parallel on the GPU
- Vertex shaders transform geometry; fragment shaders determine color
- The shader model turned GPUs from fixed hardware into programmable processors

*Now you control what the GPU does. But the richest visual detail comes from textures and light. Let's look at those next.*
