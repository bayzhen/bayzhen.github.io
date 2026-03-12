---
layout: article
title: "Blend Trees and Layered Animation"
description: "Mixing walk and run, aiming while moving — how blend trees create fluid character motion from discrete clips"
lang: en
level: intermediate
tags: ["Game Animation", "Blend Trees", "English Reading"]
series: game-animation
series_title: "Game Animation Programming: English Reading"
title_suffix: "Game Animation Programming: English Reading"
order: 3
prev:
  title: "Animation State Machines"
  url: "02-state-machines.html"
next:
  title: "Inverse Kinematics"
  url: "04-inverse-kinematics.html"
---

A soldier sprints across a battlefield. Bullets fly overhead, so she raises her rifle and aims left — all without breaking stride. Her upper body rotates independently while her legs keep running. This seamless motion is not one animation clip. It is dozens of clips, blended together in real time by a system called a blend tree.

## The Problem with Hard Switches

A state machine can transition between "walk" and "run." But what happens at speed 4.5, halfway between a walk (speed 3) and a run (speed 6)? A hard switch looks unnatural. The character snaps from one gait to another. Players notice instantly. We need a way to mix two clips smoothly based on a continuous parameter.

## 1D Blend Spaces

A 1D blend space solves this. You place clips along a single axis — typically speed. Walk sits at 0.0, jog at 0.5, and run at 1.0. When the character moves at 70% of maximum speed, the engine computes a blend weight: 40% jog and 60% run. It then interpolates every bone's rotation between the two poses. The result is a motion that exists nowhere in the original data, yet looks perfectly natural.

> **Word Notes**
> - *interpolate* /ɪnˈtɜːrpəleɪt/ — 插值。"The engine interpolates between keyframes to produce smooth motion."
> - *gait* /ɡeɪt/ — 步态。"Each gait — walk, jog, sprint — requires a separate animation clip."

## 2D Blend Spaces

Locomotion is rarely one-dimensional. A character can move forward, backward, or sideways. A 2D blend space uses two axes: speed and direction. Imagine a grid with nine clips — forward-walk, forward-run, strafe-left-walk, strafe-left-run, and so on. Given a direction of 45 degrees and a speed of 0.8, the engine finds the three nearest clips and blends them using triangular interpolation. Unreal Engine calls this a "Blend Space" and displays it as a draggable 2D preview grid.

The math is straightforward. Each sample point has coordinates (direction, speed). The engine locates the triangle containing the current input and computes barycentric weights for the three vertices. These weights sum to 1.0 and determine how much each clip contributes to the final pose.

> **Word Notes**
> - *barycentric* /ˌbærɪˈsentrɪk/ — 重心的。"Barycentric coordinates describe a point's position inside a triangle."
> - *strafe* /streɪf/ — 横向移动。"FPS characters strafe left and right to dodge incoming fire."

## Additive Animation Layers

Blend trees handle locomotion well, but a shooter needs more. A character must aim a weapon while running. Playing a full-body aim animation would override the legs. The solution is additive layers.

An additive layer stores only the difference from a reference pose. For aiming, the reference is the character standing still and looking forward. The aim-up clip records how the spine and arms rotate when looking upward. At runtime, the engine adds this difference on top of whatever the base layer is doing. The legs run. The spine tilts. Both happen simultaneously.

## Layer Masks

Not every bone should receive every layer's output. A layer mask defines which bones a layer can affect. In a typical shooter setup, the base layer drives the full skeleton. The combat layer uses a mask that includes only the spine and everything above it — arms, hands, head. The legs remain untouched by the combat layer.

Unreal Engine implements this through "Layered Blend per Bone." You specify a bone name like "spine_01," and the engine applies the layer to that bone and all its children. This keeps leg motion clean while the upper body independently aims, reloads, or throws grenades.

> **Word Notes**
> - *override* /ˌoʊvərˈraɪd/ — 覆盖，取代。"The combat layer should not override the locomotion layer's leg poses."
> - *simultaneously* /ˌsaɪməlˈteɪniəsli/ — 同时地。"Both layers evaluate simultaneously each frame."

## Aim Offsets in Practice

An aim offset is a specialized 2D blend space. Its two axes are yaw (-90 to +90 degrees) and pitch (-90 to +90 degrees). Each sample point is a pose showing the character aiming in that direction. As the player moves the mouse, the engine blends between these poses additively. Combined with a running base layer and a spine-up mask, this gives the classic shooter look: legs sprint forward, torso twists to track a target, rifle follows the crosshair — all from about 15 discrete clips blended in real time.

*Fifteen clips, two blend axes, one layer mask — and the player sees a living, breathing soldier who can aim anywhere while running in any direction.*
