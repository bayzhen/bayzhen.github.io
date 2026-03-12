---
layout: article
title: "Animation State Machines"
description: "Idle, walk, run, jump — how finite state machines orchestrate character animation transitions"
lang: en
level: intermediate
tags: ["Game Animation", "State Machines", "English Reading"]
series: game-animation
series_title: "Game Animation Programming: English Reading"
title_suffix: "Game Animation Programming: English Reading"
order: 2
prev:
  title: "Bones, Joints, and Skinning"
  url: "01-skeletal-animation.html"
next:
  title: "Blend Trees and Layered Animation"
  url: "03-blend-trees.html"
---

A warrior stands in a dungeon. She breathes slowly, sword at rest. You press the joystick forward. Her legs begin to move. You push harder. She breaks into a run. You hit the jump button. She leaps into the air. Every one of these transitions — idle to walk, walk to run, run to jump — is controlled by a finite state machine.

## States Are Animation Clips

A finite state machine, or FSM, is a graph of nodes and arrows. Each node is a **state**, and each arrow is a **transition**. In animation, each state maps to an animation clip. The idle state plays a breathing loop. The walk state plays a walking cycle. The jump state plays a launch-and-land sequence. At any given frame, the character is in exactly one state.

The transitions between states are governed by rules. These rules check game variables. For example: if `speed > 0.1`, transition from idle to walk. If `speed > 4.5`, transition from walk to run. If `isGrounded == false`, transition to the jump state. The FSM evaluates these conditions every frame and switches states when a rule fires.

> **Word Notes**
> - *orchestrate* /ˈɔːrkɪstreɪt/ — 精心编排，协调。"The director orchestrates every scene in the film."
> - *govern* /ˈɡʌvərn/ — 控制，决定。"Physical laws govern the motion of planets."

## Cross-Fade Blending

Without blending, state transitions look terrible. The character snaps from one pose to another in a single frame. Players notice this instantly. The solution is **cross-fade blending**: when a transition triggers, the engine plays both the old clip and the new clip simultaneously, gradually shifting weight from old to new over a short window — typically 0.15 to 0.3 seconds.

During a 0.2-second cross-fade from walk to run, the engine blends the bone transforms. At frame 1, the weight is 90% walk, 10% run. By the final frame, it is 0% walk, 100% run. This produces a smooth, natural-looking transition that hides the boundary between two separate animation clips.

## AnimGraph: Blueprints for Animation

Unreal Engine provides a visual tool called **AnimGraph**, part of its Animation Blueprint system. Designers drag states onto a canvas, draw transition arrows, and set conditions — all without writing code. Unity offers a similar system called the Animator Controller. These tools make FSMs accessible to artists and designers, not just programmers.

In a typical AnimGraph, you might see 8 to 12 states for a player character: idle, walk, run, sprint, jump, fall, land, crouch, attack, hit, die, and a special "any state" node that allows certain transitions (like death) to trigger from anywhere.

> **Word Notes**
> - *simultaneously* /ˌsaɪməlˈteɪniəsli/ — 同时地。"The engine updates physics and animation simultaneously."
> - *accessible* /əkˈsesəbl/ — 易于使用的，可接触的。"Good documentation makes complex tools accessible."

## The State Explosion Problem

Simple characters work well with FSMs. But real games are not simple. A fighting game character might have 6 attack types, each with a grounded and aerial version. Add directional variants — forward-attack, back-attack — and you reach 24 attack states. Now multiply by 3 weapon types. That is 72 states, just for attacks. Include movement, defense, and special abilities, and you face hundreds of states connected by thousands of transition arrows. This is **state explosion**, and it makes the FSM impossible to read, debug, or maintain.

## Hierarchical State Machines

Modern engines solve state explosion with **hierarchical state machines**, or HFSMs. The idea is nesting: a top-level FSM has broad states like "Locomotion," "Combat," and "Interaction." Each broad state contains its own sub-FSM. The Locomotion state might hold idle, walk, run, and sprint as sub-states. The Combat state holds attack, block, and dodge.

This hierarchy reduces visual complexity dramatically. Instead of one graph with 200 nodes, you get a top-level graph with 5 nodes, each containing a sub-graph of 10 to 15 nodes. Unreal Engine supports this through **conduits** and **state aliases**. Unity achieves it with **sub-state machines** inside the Animator Controller.

> **Word Notes**
> - *hierarchy* /ˈhaɪərɑːrki/ — 层级结构。"A company hierarchy defines who reports to whom."
> - *conduit* /ˈkɑːnduɪt/ — 管道，通道。"The API serves as a conduit between the frontend and the database."

*A well-designed state machine does not just play animations — it gives a character the illusion of life.*
