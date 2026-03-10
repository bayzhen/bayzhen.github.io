---
layout: article
title: "Physics World: Collision and Rigid Bodies"
description: "Raycasts, collision shapes, rigid bodies, ragdolls, and destructibles in the physics subsystem"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 8
prev:
  title: "Vehicle Physics Simulation"
  url: "07-vehicle-physics.html"
next:
  title: "Client Gameplay: Storyboards and Input"
  url: "09-client-gameplay.html"
---

Can a bullet pass through that wall? Will the character land on the ledge or fall into the void? Physics answers these questions every frame. In this engine, the physics subsystem is a layered hierarchy of interfaces, each adding capabilities on top of the last.

## The Body Hierarchy

At the base is `IPhysicsSpaceBody` — anything that can exist inside a physics space. It knows how to `EnterSpace()` and `LeaveSpace()`. One level up, `IPhysicsCollidableBody` adds collision filtering and contact events. At the top, `IPhysicsDynamicRB` provides mass, velocity, forces, and damping — the full dynamic rigid body interface.

Concrete classes branch from here. `RigidBodyComponent` is what you attach to a game entity — you create it with a shape, apply impulses, toggle gravity. `RagdollComponent` loads a ragdoll resource and simulates a limp character. `PhysicsStaticSceneBody` represents immovable geometry like terrain and buildings.

> **Word Notes**
> - *rigid body* — 刚体，物理模拟中不可变形的物体。"A rigid body has mass, velocity, and responds to forces."
> - *ragdoll* /ˈræɡdɒl/ — 布娃娃物理，用关节连接的刚体模拟角色倒地。"When a character dies, the skeleton switches to ragdoll simulation."

## Queries: Raycast, Sweep, and Overlap

The `PhysicsSpaceComponent` is the physics world manager. It provides three types of spatial queries. **Raycast** fires a ray and returns the first (or all) hit points — perfect for bullet traces and line-of-sight checks. **Sweep** moves a shape along a path, useful for checking if a character can fit through a gap. **Overlap** tests whether a shape at a given position intersects any physics body.

Each query accepts a collision filter so you can ignore certain object types — for example, querying only terrain, or skipping triggers.

> **Word Notes**
> - *raycast* — 射线检测，从一个点沿方向发射一条线来检测碰撞。"A raycast from the gun barrel tells you what the bullet hits."
> - *sweep* — 扫掠测试，沿路径移动一个形状来检测碰撞。"A capsule sweep checks if the character can walk through a doorway."

## Shapes and Materials

Collision shapes are defined through `PhysicsShapeWrapper`. You can create boxes, spheres, capsules, convex hulls, or load mesh-based shapes from a resource file. Each shape can have a `PhysicsMaterialConfig` that defines static friction, dynamic friction, and restitution (bounciness). `ConstraintComponent` links two rigid bodies together with joints — fixed, spherical, or revolute.

## Key Takeaways

- The physics body hierarchy adds capabilities layer by layer: space → collision → dynamics
- Three query types (raycast, sweep, overlap) let gameplay code probe the physics world
- Shapes, materials, and constraints give fine-grained control over how objects collide and connect

*Physics is the silent referee — enforcing the rules so the game world feels real.*
