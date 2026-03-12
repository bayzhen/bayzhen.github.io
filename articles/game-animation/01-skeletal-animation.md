---
layout: article
title: "Bones, Joints, and Skinning"
description: "How a mesh of triangles learns to move — skeletal animation from the inside out"
lang: en
level: intermediate
tags: ["Game Animation", "Skeletal Animation", "English Reading"]
series: game-animation
series_title: "Game Animation Programming: English Reading"
title_suffix: "Game Animation Programming: English Reading"
order: 1
next:
  title: "Animation State Machines"
  url: "02-state-machines.html"
---

A character stands on screen. She looks alive — breathing, blinking, shifting her weight. But underneath the surface, she is just 8,000 triangles wrapped around an invisible puppet. That puppet is a skeleton, and understanding how it works is the first step to game animation programming.

## The Skeleton Hierarchy

A game skeleton is a tree of bones. Every tree has a root. In most game engines, the root bone sits at the character's pelvis. From the pelvis, two chains grow downward to the feet. Another chain grows upward through the spine to the head. The spine branches into two arms, each ending at the fingertips.

This is a parent-child hierarchy. When a parent bone rotates, all its children follow. Rotate the upper arm, and the forearm, hand, and fingers move together. Rotate the spine, and the entire upper body turns. This simple rule — children inherit their parent's transform — drives all skeletal animation.

> **Word Notes**
> - *hierarchy* /ˈhaɪərɑːrki/ — 层级结构。"The bone hierarchy defines how movement propagates through the skeleton."
> - *inherit* /ɪnˈherɪt/ — 继承。"Child bones inherit the rotation and position of their parent."

## How Many Bones?

Real game characters need surprisingly many bones. The default mannequin in Unreal Engine has about 70 bones. That covers the major joints: spine, neck, arms, legs, hands, and feet. But a production character in a AAA game often uses 200 or more bones. Extra bones control the face, the tongue, individual fingers, and even the muscles under the skin. More bones mean finer control, but also higher CPU cost.

## Skinning: Binding Mesh to Bone

A skeleton alone is invisible. Players see the mesh — thousands of vertices forming the character's surface. Skinning is the process of attaching each vertex to one or more bones. Each attachment has a weight between 0 and 1. A vertex on the forearm might have 80% weight on the forearm bone and 20% on the upper arm bone. When the forearm bone rotates, the vertex follows mostly the forearm, but the upper arm gently pulls it too. This blending creates smooth deformation at joints like elbows and knees.

> **Word Notes**
> - *vertex* /ˈvɜːrteks/ — 顶点（复数 vertices）。"Each vertex stores a position, a normal, and up to four bone weights."
> - *deformation* /ˌdiːfɔːrˈmeɪʃən/ — 变形。"Good skinning weights produce natural deformation at the elbow."

## Linear Blend Skinning and Its Flaw

The standard algorithm is called Linear Blend Skinning (LBS). For each vertex, the engine computes a weighted average of the bone transforms. LBS is fast and simple. Every game engine supports it. But it has a famous flaw.

Twist a forearm 180 degrees in LBS. The mesh between the two bones collapses inward, creating a shape that looks like a crushed candy wrapper. This artifact is called the candy-wrapper effect. It happens because linearly averaging rotation matrices does not preserve volume. The mesh loses its thickness at extreme twists.

## Dual Quaternion Skinning

Dual Quaternion Skinning (DQS) solves the candy-wrapper problem. Instead of averaging matrices, it averages dual quaternions — a mathematical structure that naturally preserves rigid-body properties. A forearm twisted 180 degrees under DQS keeps its round shape. The cost is slightly more math per vertex. Many modern games use DQS for the arms and legs, and keep LBS for areas that rarely twist.

> **Word Notes**
> - *quaternion* /kwəˈtɜːrniən/ — 四元数。"Quaternions represent rotations without gimbal lock."
> - *artifact* /ˈɑːrtɪfækt/ — 瑕疵，伪影。"The candy-wrapper artifact appears when twisting exceeds 90 degrees."

## Forward Kinematics: The Animation Pipeline

How does each bone know where to go? The most common method is forward kinematics (FK). An animator records a rotation value for every bone at every keyframe. At runtime, the engine starts at the root bone, applies its rotation, then walks down the hierarchy. Each child bone applies its own rotation on top of its parent's. By the time the engine reaches the fingertips, it has multiplied a chain of transforms from root to leaf. This top-down walk is called the forward kinematics pass, and it runs every single frame.

FK is the foundation. But it is not the only tool. Inverse kinematics, blend trees, and state machines build on top of it. Those are topics for the articles ahead.

*A character with 200 bones, 8,000 vertices, and one frame of animation is already solving thousands of matrix multiplications — sixty times per second, without a single visible bone.*
