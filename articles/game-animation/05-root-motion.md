---
layout: article
title: "Root Motion and Animation-Driven Movement"
description: "When the animation moves the character, not the code — root motion's trade-offs between realism and responsiveness"
lang: en
level: intermediate
tags: ["Game Animation", "Root Motion", "English Reading"]
series: game-animation
series_title: "Game Animation Programming: English Reading"
title_suffix: "Game Animation Programming: English Reading"
order: 5
prev:
  title: "Inverse Kinematics"
  url: "04-inverse-kinematics.html"
next:
  title: "Motion Matching"
  url: "06-motion-matching.html"
---

A knight in heavy armor swings a greatsword. His feet dig into the ground. His body lurches forward with the weight of the blade. You feel every kilogram. This is root motion — and it changes who is in control of movement: the animator, not the programmer.

## Two Ways to Move a Character

Most games use one of two approaches.

In **code-driven movement**, game logic controls the character's position. The code sets velocity to 5 meters per second, and the animation system plays a walk cycle on top. The character slides across the ground like a puppet on rails. The animation is cosmetic — it does not actually move anything.

In **animation-driven movement** (root motion), the animation clip itself contains displacement data. The root bone — usually the hip or pelvis — moves forward by 0.83 meters over 30 frames. The engine extracts that translation and applies it to the character's world position. The animation is not decoration. It is the movement.

> **Word Notes**
> - *lurch* /lɜːrtʃ/ -- 踉跄，突然前倾。"The character lurches forward during the heavy attack animation."
> - *cosmetic* /kɒzˈmetɪk/ -- 装饰性的，表面的。"The walk animation is purely cosmetic — it doesn't affect physics."

## Why Root Motion Prevents Foot Sliding

Foot sliding is the most common animation artifact in games. It happens when the character's speed does not match the animation's step length. A walk cycle designed for 1.2 m/s looks perfect at that speed. But if the code pushes the character at 1.5 m/s, the feet appear to slide forward on the ground. At 0.9 m/s, the feet drag backward.

Root motion solves this automatically. The character moves exactly as fast as the animation dictates. If the walk cycle covers 0.6 meters per step, that is precisely how far the character moves per step. No sliding. No mismatch. The feet plant exactly where the animator intended.

## The Trade-Off: Realism vs. Responsiveness

Root motion is not free. It introduces a fundamental tension between physical believability and player control.

**Souls-like games** embrace root motion fully. In Dark Souls, when you press the attack button, the character commits to the full swing animation. The root bone carries you forward 1.5 meters over 40 frames. You cannot cancel. You cannot redirect. This commitment creates weight and consequence — every action feels deliberate and dangerous.

**First-person shooters** avoid root motion almost entirely. Players expect instant response. Press left, move left — now. A 200-millisecond animation wind-up before movement begins feels sluggish and broken. Call of Duty runs at code-driven speeds where the character reaches full velocity within 2-3 frames.

> **Word Notes**
> - *deliberate* /dɪˈlɪbərət/ -- 深思熟虑的，故意的。"Every attack in Dark Souls feels deliberate and weighty."
> - *sluggish* /ˈslʌɡɪʃ/ -- 迟缓的，反应慢的。"Root motion can make fast-paced games feel sluggish."

## Root Motion in Unreal Engine

Unreal Engine provides built-in root motion support. When you import a skeletal mesh animation, the engine can extract the root bone's translation and rotation from the clip. In the Animation Blueprint, you enable root motion on the AnimMontage or animation sequence. Each frame, the engine reads the delta position and delta rotation from the root bone, zeroes out the bone's local movement, and applies that delta to the character's capsule component instead.

The key setting is `Root Motion Mode` on the Character Movement Component. Set it to `Root Motion From Montages Only` for special attacks, or `Root Motion From Everything` for full animation-driven locomotion. The movement component then uses the extracted root displacement instead of its own velocity calculations.

## Blending Two Worlds

Most modern games do not choose one approach exclusively. They blend both. A character might use code-driven movement for basic locomotion — walking, running, strafing — where responsiveness matters most. But when the player triggers a special action — a dodge roll, a heavy attack, a climbing animation — the system switches to root motion for that specific clip.

> **Word Notes**
> - *locomotion* /ˌloʊkəˈmoʊʃn/ -- 移动，运动方式。"The locomotion system handles walking, running, and sprinting."
> - *strafe* /streɪf/ -- 横向移动。"FPS characters strafe left and right while aiming forward."

This hybrid approach gives designers the best of both worlds. The blend weight can even transition smoothly: 80% code-driven during the run, ramping to 100% root motion as the attack begins, then back to code-driven when recovery ends. The player feels snappy controls during navigation and weighty impact during combat.

The choice is never purely technical. It is a game design decision that shapes how your game feels in the player's hands.

*The best animation systems do not ask "code or animation?" — they ask "which one should be in control right now?"*
