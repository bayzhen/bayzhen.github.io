---
layout: article
title: "Motion Matching"
description: "The end of state machines? How motion matching searches thousands of animation frames to find the perfect next pose"
lang: en
level: intermediate
tags: ["Game Animation", "Motion Matching", "English Reading"]
series: game-animation
series_title: "Game Animation Programming: English Reading"
title_suffix: "Game Animation Programming: English Reading"
order: 6
prev:
  title: "Root Motion and Animation-Driven Movement"
  url: "05-root-motion.html"
---

In 2016, a small animation team at Ubisoft walked onto the GDC stage and broke a decade of tradition. They showed a medieval combat game called For Honor, where every sword swing and dodge looked handcrafted. But there was no state machine. No transition graph. No blend tree. The system simply searched a database and picked the best frame. They called it motion matching, and it changed how the industry thinks about character animation.

## The Problem with State Machines

Traditional animation uses a state machine. Walk connects to run. Run connects to jump. Jump connects to land. An animator must define every transition by hand. A character with 50 states and 200 transitions becomes a nightmare to maintain. Adding one new move means wiring it to dozens of existing states. For Honor had hundreds of combat moves. Building a state machine for that would have taken years.

> **Word Notes**
> - *medieval* /ˌmiːdiˈiːvəl/ — 中世纪的。"For Honor features medieval knights, samurai, and Vikings."
> - *wire* /waɪər/ — 连接，串联。"Wiring a new state to the existing graph took three days of work."

## How Motion Matching Works

The idea is surprisingly simple. First, capture a large database of motion. For Honor recorded about 10 hours of mocap data per character class. Each frame in the database stores a pose — the position and velocity of every bone — plus a short trajectory showing where the character was heading.

Every game frame, the system asks one question: which frame in the database best matches what is happening right now? It compares the character's current pose and the player's desired trajectory against every candidate in the database. A cost function measures the difference. The frame with the lowest cost wins. The character jumps to that frame and plays forward from there.

The cost function typically weighs three things: how close the candidate's bone positions are to the current pose, how well the candidate's trajectory matches the player's input, and how similar the bone velocities are. Each factor gets a tunable weight. Ubisoft's original system evaluated roughly 50,000 candidate frames per character per game frame.

> **Word Notes**
> - *mocap* /ˈmoʊkæp/ — 动作捕捉（motion capture 的缩写）。"The studio recorded 10 hours of mocap for each fighter."
> - *trajectory* /trəˈdʒektəri/ — 轨迹。"The cost function penalizes candidates whose trajectory diverges from the player's input."

## No More Manual Transitions

This is the revolutionary part. The system handles transitions automatically. If the player is running and suddenly turns left, the cost function will find a frame where the character is mid-turn. The blending is just a short crossfade — typically 4 to 8 frames — between the current pose and the new match. No animator needs to define a "run to turn left" transition. The database already contains it.

## Scaling Up: The Last of Us Part II

Naughty Dog pushed motion matching further. The Last of Us Part II shipped with over 12,000 individual animation clips. Characters could stumble over debris, squeeze through gaps, and react to injuries — all driven by database search. The team combined motion matching with procedural adjustments. If a character's hand was near a wall, the system blended in a touch animation. The result felt organic, not robotic.

> **Word Notes**
> - *debris* /dəˈbriː/ — 碎片，残骸。"Characters stumble over debris scattered across the battlefield."
> - *organic* /ɔːrˈɡænɪk/ — 自然的，有机的。"Motion matching produces organic movement without manual state wiring."

## The Cost: Memory and CPU

Motion matching is not free. Storing thousands of clips in memory is expensive. A single character with 10 hours of mocap at 30 FPS generates over one million frames. Each frame stores dozens of bone transforms. Compression helps — Ubisoft used aggressive data reduction to fit everything into about 50 MB per character. But with 8 characters on screen, that is 400 MB of animation data alone.

CPU cost is the other concern. Searching 50,000 frames every tick sounds brutal. In practice, developers use acceleration structures like KD-trees to prune the search space. Ubisoft reported that motion matching cost about 1 ms per character on a 2016 console. Modern hardware handles it more easily.

## Unreal Engine 5 and the Future

Epic Games added experimental motion matching to Unreal Engine 5. Their implementation uses a feature called Pose Search. Developers tag their animation databases with metadata, and the engine builds a search index at cook time. This brings motion matching to teams that cannot afford to build the technology from scratch.

The next frontier is neural networks. Research systems like Phase-Functioned Neural Networks (PFNN) replace the database entirely. Instead of searching, a neural network generates the next pose directly from the character's state and phase. The network learns from the same mocap data but compresses it into model weights — just a few megabytes instead of hundreds. The trade-off is control: neural networks are harder to debug when a character does something unexpected.

> **Word Notes**
> - *prune* /pruːn/ — 剪枝，裁剪。"KD-trees prune the search space from 50,000 candidates to a few hundred."
> - *frontier* /frʌnˈtɪr/ — 前沿。"Neural animation sits at the frontier of game technology."

*For fifty years, animators told characters where to go. Motion matching lets the motion speak for itself.*
