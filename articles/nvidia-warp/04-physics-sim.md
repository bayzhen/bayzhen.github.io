---
layout: article
title: "Physics with warp.sim"
description: "Warp's built-in simulation module — rigid bodies, soft bodies, articulated robots, and how to set up a physics world in a few lines of Python."
level: intermediate
tags: ["NVIDIA Warp", "English", "Reading"]
series: nvidia-warp
series_title: "NVIDIA Warp: English Reading"
order: 4
prev:
  title: "Differentiable Simulation"
  url: "03-differentiable-simulation.html"
next:
  title: "Real-World Applications"
  url: "05-real-world-applications.html"
---

Most GPU frameworks give you the building blocks. Warp goes further — it gives you a complete physics world, ready to simulate.

## The warp.sim Module

`warp.sim` is Warp's built-in physics simulation library. It sits on top of the core kernel system and provides higher-level objects: bodies, joints, contacts, springs, and integrators. You describe a physical scene in Python, and `warp.sim` handles the time-stepping, collision detection, and constraint solving on the GPU.

This is not a toy physics engine. `warp.sim` can simulate thousands of articulated robots in parallel — all running simultaneously on a single GPU. This is exactly what reinforcement learning research demands.

> **Word Notes**
> - *integrator* /ˈɪntɪɡreɪtər/ — 积分器。An algorithm that advances a simulation forward in time, computing new positions and velocities each step.
> - *constraint* /kənˈstreɪnt/ — 约束条件。A rule that limits how objects can move, such as "this joint can only rotate 90 degrees."
> - *articulated* /ɑːrˈtɪkjuleɪtɪd/ — 关节式的。Describes a chain of rigid bodies connected by joints, like a robot arm or a human skeleton.

## What Can It Simulate?

`warp.sim` supports three broad categories of objects:

**Rigid bodies** are solid objects that do not deform. Boxes, spheres, and convex hulls bounce and collide. This is the foundation of most game and robotics simulations.

**Soft bodies** are deformable objects — cloth, rope, and volumetric elastic materials. Warp uses position-based dynamics (PBD) and extended PBD (XPBD) solvers that are stable and differentiable.

**Articulated robots** are chains of rigid bodies connected by joints — the bread and butter of robotics simulation. You can load a robot from a standard URDF or MJCF file and simulate it with joint drives, springs, and contact forces.

> **Word Notes**
> - *convex hull* — 凸包。The smallest convex shape that encloses a set of points. Used as a simplified collision shape.
> - *bread and butter* — 核心、最基本的部分（习语）。"Articulated simulation is the bread and butter of robotics research."
> - *URDF* — Unified Robot Description Format，统一机器人描述格式。An XML format for describing robot models, widely used in ROS.

## Parallel Environments

The real power of `warp.sim` for AI research is environment parallelism. In standard reinforcement learning, you run one simulation per training step. With Warp, you can run 4,096 simulations simultaneously on one GPU. Each environment is independent — different initial states, different actions, all stepping forward in parallel.

This transforms training throughput. A task that once required hours of simulation time can now complete in minutes. Warp's GPU-parallel environments are already used inside NVIDIA Isaac Gym and Isaac Lab for robot learning research.

## A Minimal Example

```python
import warp as wp
import warp.sim

builder = warp.sim.ModelBuilder()
builder.add_body(origin=wp.transform_identity())
builder.add_shape_sphere(body=0, radius=0.1)

model = builder.finalize(device="cuda")
state = model.state()
integrator = warp.sim.SemiImplicitIntegrator()
```

In a dozen lines, you have a physics world with a sphere, a state, and a time integrator, ready to step forward on the GPU.

## Key Takeaways

- `warp.sim` provides rigid bodies, soft bodies, and articulated robot simulation on the GPU.
- Thousands of parallel environments can run on a single GPU, accelerating RL training dramatically.
- Standard robot formats (URDF, MJCF) are supported out of the box.

*One GPU, four thousand robots, one training run — this is the scale that makes modern robotics AI possible.*
