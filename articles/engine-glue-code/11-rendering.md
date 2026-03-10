---
layout: article
title: "Rendering: Models, Particles, and Lights"
description: "How the engine exposes visual components — meshes, particle effects, and light sources — to Python"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 11
prev:
  title: "World, Level, and Area"
  url: "10-world-level-area.html"
next:
  title: "Skeleton and Animation"
  url: "12-skeleton-animation.html"
---

What the player sees on screen starts as data: vertex buffers, textures, shader parameters, light positions. The rendering glue code turns these low-level resources into Pythonic components that gameplay programmers can control without thinking about GPU pipelines.

## Models and Meshes

`ModelComponent` extends `IPrimitiveComponent` and represents a static mesh in the scene. It offers `ApplyCustomMaterial(path)` to swap materials at runtime — useful for highlighting objects or showing damage states. `GetVertices()` and `GetIndices()` expose the raw geometry as Python lists, enabling runtime mesh analysis. Properties like `LodFadingTime` and `Distance` control how the model transitions between LOD levels.

For terrain, `TerrainComponent` handles streamed heightmap rendering with `GeometryFactor` for tessellation control and `MaxLoadingDistance` for streaming radius. You can even split terrain geometry with a polygon using `SplitGeometry()` — handy for crater effects.

> **Word Notes**
> - *tessellation* /ˌtesəˈleɪʃən/ — 曲面细分，将大三角形拆分为更小的三角形以增加细节。"Higher tessellation gives smoother terrain at the cost of performance."
> - *LOD (Level of Detail)* — 细节层次。"LOD fading smoothly transitions between mesh resolutions."

## Particle Systems

`ParticleComponent` manages visual effects — fire, smoke, sparks, magic spells. It has a full lifecycle: `Activate()`, `Deactivate()`, `Pause()`, `Seek()`. You can attach parameters with `AddParameter()` to control behavior from scripts. The `Finished` event fires when a one-shot effect completes, letting gameplay code chain effects or trigger follow-up logic.

The `MRender` module provides global post-processing effects: `GrayToPercent()` fades the screen to grayscale, `MotionBlurToPercent()` adds motion blur, and `SetScreenColor()` tints the entire screen — all animated over time.

> **Word Notes**
> - *one-shot* — 一次性的，播放一次后自动停止。"Explosion particles are one-shot effects that clean up after finishing."
> - *post-processing* — 后处理，在渲染完成后对整个画面应用的效果。"Post-processing effects like bloom and color grading run on the full screen."

## Lights and Reflections

`PointLightComponent` emits light in all directions with `Range`, `Color`, and `Intensity` properties. `SpotLightComponent` adds `InnerAngle` and `OutAngle` for cone-shaped illumination. `ReflectionProbeComponent` captures the scene for PBR reflections. The `MLighting` module provides light baking and ray-tracing control at the global level.

## Key Takeaways

- `ModelComponent` and `TerrainComponent` handle mesh rendering with LOD and material swapping
- `ParticleComponent` manages visual effects with a full lifecycle and scriptable parameters
- Light components (point, spot) and `MRender` provide local and global visual control

*Rendering is where data becomes art — and the glue code is the artist's brush.*
