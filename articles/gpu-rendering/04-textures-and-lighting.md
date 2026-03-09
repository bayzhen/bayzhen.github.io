---
layout: article
title: "Textures and Lighting"
description: "How GPUs create visual realism on screen"
level: intermediate
tags: ["GPU", "Rendering", "English", "Reading"]
series: gpu-rendering
series_title: "GPU Rendering: English Reading"
order: 4
prev:
  title: "Shaders"
  url: "03-shaders.html"
next:
  title: "Modern Rendering"
  url: "05-modern-rendering.html"
---

A perfectly shaded sphere with no texture looks like a plastic ball. Add a rust texture and a warm light, and suddenly it looks like an old iron cannonball sitting in a museum. Textures and lighting are what transform geometry into something believable.

## Texture Mapping

A texture is simply an image that wraps around a 3D model. The GPU maps each point on the model's surface to a coordinate on the texture image using UV coordinates — a 2D coordinate system where U is horizontal and V is vertical. When the fragment shader runs, it "samples" the texture at the right UV position to get the color for that pixel.

But textures do more than provide color. Normal maps store surface detail (bumps and grooves) without adding geometry. Roughness maps control how shiny or matte a surface appears. These extra maps feed into the lighting calculation, creating rich material variety from simple flat meshes.

> **Word Notes**
> - *UV coordinates* — UV 坐标（将 2D 纹理映射到 3D 模型表面的坐标系）。"UV coordinates tell the GPU which part of the texture to apply."
> - *normal map* — 法线贴图（存储表面凹凸细节的纹理）。"Normal maps fake geometric detail using per-pixel surface directions."
> - *matte* /mæt/ — 哑光的，无光泽的。"A roughness map controls whether a surface looks shiny or matte."

## How Lighting Works

Lighting in real-time rendering is an approximation. Real light bounces infinitely between surfaces; GPUs cannot simulate every bounce. Instead, we use lighting models — mathematical shortcuts that look convincing enough.

The most common approach breaks light into components. Diffuse lighting scatters evenly across a surface — it's what makes you see the shape of an object. Specular lighting creates bright highlights where light reflects directly toward the camera. Ambient lighting is a flat base layer that prevents unlit areas from going pure black.

> **Word Notes**
> - *approximation* /əˌprɑːksɪˈmeɪʃn/ — 近似。"Real-time lighting is an approximation, not a simulation."
> - *diffuse* /dɪˈfjuːs/ — 漫反射的。"Diffuse lighting reveals the shape of an object."
> - *specular* /ˈspekjʊlər/ — 镜面反射的。"Specular highlights create that bright spot on a shiny surface."

## PBR: The Modern Standard

Physically Based Rendering — PBR — replaced older ad hoc models by grounding material properties in real physics. Every surface is described by just a few parameters: base color, metallic value, and roughness. Because these values correspond to real-world measurements, artists can create materials that look correct under any lighting condition without manual tweaking.

> **Word Notes**
> - *ad hoc* /ˌæd ˈhɑːk/ — 临时的，特设的。"PBR replaced older ad hoc lighting models."
> - *tweaking* /ˈtwiːkɪŋ/ — 微调。"PBR materials look right without manual tweaking."

## Key Takeaways

- Textures provide color, surface detail, and material properties through multiple map types
- Lighting models approximate real physics using diffuse, specular, and ambient components
- PBR unifies material authoring with physically grounded parameters

*Textures and light make things look real. But modern games demand even more — millions of lights, global illumination, reflections. How do we scale? That's the topic of our final article.*
