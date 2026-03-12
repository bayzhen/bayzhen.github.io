---
layout: article
title: "Inverse Kinematics"
description: "Feet that touch the ground and hands that grip ledges — how IK solvers fix the gap between animation and physics"
lang: en
level: intermediate
tags: ["Game Animation", "Inverse Kinematics", "English Reading"]
series: game-animation
series_title: "Game Animation Programming: English Reading"
title_suffix: "Game Animation Programming: English Reading"
order: 4
prev:
  title: "Blend Trees and Layered Animation"
  url: "03-blend-trees.html"
next:
  title: "Root Motion and Animation-Driven Movement"
  url: "05-root-motion.html"
---

A knight walks across a rocky hillside. His left foot lands on a raised stone, and his right foot settles into a lower groove. The animation clip was recorded on a flat floor. Yet somehow, both feet touch the terrain perfectly. This is inverse kinematics at work — a solver that bends joints in real time so that hands reach, feet plant, and heads turn toward exactly the right spot.

## Forward vs Inverse

In forward kinematics (FK), you rotate each joint manually from root to tip. Rotate the shoulder 30 degrees, then the elbow 45 degrees, then the wrist 10 degrees — and the hand ends up somewhere in space. FK is simple, but controlling the final hand position is hard. You must guess and adjust.

Inverse kinematics (IK) works the other way. You specify where the hand should be, and a solver calculates the angles for every joint in the chain. The animator says "put the hand here," and the math figures out the shoulder, elbow, and wrist rotations automatically.

> **Word Notes**
> - *inverse* /ɪnˈvɜːrs/ — 逆向的，相反的。"IK is the inverse of the forward kinematics process."
> - *terrain* /təˈreɪn/ — 地形。"The game generates procedural terrain with hills and valleys."

## Two-Bone IK: The Simplest Case

A human arm has three key points: shoulder, elbow, and hand. This forms a two-bone chain — upper arm and forearm. Given the shoulder position and the target hand position, geometry alone can solve the elbow angle. The math uses the law of cosines, just like a triangle problem in high school.

Two-bone IK is fast. It runs in constant time with no iteration. Most games use it for arms and legs. A leg chain maps to hip, knee, and ankle — the same triangle, the same math, applied 60 times per second.

## CCD and FABRIK: Longer Chains

Spines, tails, and tentacles have more than two bones. These need iterative solvers. Two popular algorithms handle this.

Cyclic Coordinate Descent (CCD) starts from the last joint and works backward. It rotates each joint to point toward the target. Then it repeats the cycle. After 5 to 10 iterations, the end effector is usually close enough. CCD is simple to implement, but chains can curl unnaturally.

FABRIK (Forward And Backward Reaching Inverse Kinematics) takes a different approach. It moves joints as points in space rather than rotating them. First, it drags the chain forward from the tip to the target. Then it drags backward from the root to its fixed position. Each pass adjusts bone lengths to stay correct. FABRIK produces smoother results and converges faster — often in 3 to 5 iterations.

> **Word Notes**
> - *iteration* /ˌɪtəˈreɪʃn/ — 迭代。"The solver reaches an acceptable result after just 4 iterations."
> - *converge* /kənˈvɜːrdʒ/ — 收敛，趋近。"FABRIK converges faster than CCD for most chain lengths."

## Foot IK: Walking on Uneven Ground

Pre-made walk animations assume flat ground. On a slope or staircase, feet slide through surfaces or float above them. Foot IK fixes this in three steps. First, cast a ray downward from each foot to find the ground height. Second, move the foot bone to that height using two-bone IK on the leg chain. Third, rotate the foot bone to match the surface normal so the sole lies flat against the slope.

Without foot IK, a character walking uphill looks like it is skating. With foot IK, each step adapts to the geometry beneath it.

## Hand IK and Look-At IK

Hand IK lets characters interact with the world dynamically. A soldier grips a rifle with both hands. When the rifle tilts, IK adjusts the left hand to stay on the barrel. A climber reaches for a ledge — IK stretches the arm to meet the grab point exactly.

Look-at IK is even simpler. It rotates the head bone (and sometimes 2 or 3 neck bones) so the character's eyes face a target. In third-person games, this target is often the camera direction. In cutscenes, characters look at whoever is speaking. The solver applies angle constraints so the head never rotates beyond 80 degrees — no owl necks allowed.

> **Word Notes**
> - *constraint* /kənˈstreɪnt/ — 约束，限制。"Joint constraints prevent the elbow from bending backward."
> - *effector* /ɪˈfektər/ — 效应器，末端执行器。"The end effector is the last bone in an IK chain, usually a hand or foot."

*The best animation is not the one that was recorded perfectly — it is the one that adapts to a world the animator never saw.*
