---
layout: article
title: "The Latency Problem"
description: "Why 100 milliseconds feels like eternity — how network delay shapes every decision in multiplayer game design"
lang: en
level: intermediate
tags: ["Multiplayer Netcode", "Latency", "English Reading"]
series: multiplayer-netcode
series_title: "Multiplayer Netcode: English Reading"
title_suffix: "Multiplayer Netcode: English Reading"
order: 1
next:
  title: "Client-Server Architecture"
  url: "02-client-server.html"
---

You press the fire button. Nothing happens. A tenth of a second later, your character finally shoots — but the enemy has already moved behind a wall. You die. You blame the game. But the real enemy is physics itself: the speed of light.

## The Speed of Light Is Not Fast Enough

Light travels at 300,000 kilometers per second. That sounds impossibly fast. But the internet does not use straight lines. Fiber-optic cables follow coastlines, cross ocean floors, and pass through routing equipment. A signal from New York to Tokyo must travel roughly 15,000 kilometers of cable. That takes about 67 milliseconds — one way. A round trip takes at least 134 milliseconds, and real-world routing adds more. You cannot fix this with better hardware. This is a law of physics.

> **Word Notes**
> - *latency* /ˈleɪtənsi/ — 延迟。"High latency makes online games feel unresponsive."
> - *fiber-optic* /ˈfaɪbər ˈɒptɪk/ — 光纤的。"Fiber-optic cables carry data as pulses of light."

## Ping and Round-Trip Time

When gamers say "my ping is 80," they mean the round-trip time (RTT). Your computer sends a tiny packet to the server. The server echoes it back. The time for this full journey is your ping. If your ping is 80 ms, your input reaches the server after 40 ms, and the server's response returns 40 ms later. Every action you take is at least 80 ms old by the time you see the result.

## Why 16 Milliseconds Matters

Most competitive games run at 60 frames per second. Each frame lasts about 16.7 milliseconds. If your ping is 100 ms, the server has already processed six frames before your input arrives. Your opponent has moved, turned, or fired during those six frames. You are always playing in the past.

> **Word Notes**
> - *round-trip* /ˈraʊnd trɪp/ — 往返。"The round-trip delay determines how fresh your game state is."
> - *perceive* /pərˈsiːv/ — 感知，察觉。"Humans can perceive input lag as short as 100 milliseconds."

## The Human Threshold

Research shows that most people begin to notice input delay at around 100 milliseconds. Below 50 ms, actions feel instant. Between 50 and 100 ms, trained players sense something is off. Above 150 ms, everyone feels it. This is why competitive shooters demand low ping — the margin between hitting and missing is often less than one frame.

## Different Games, Different Tolerances

Not all genres suffer equally. A fast-paced first-person shooter needs ping below 50 ms. At 100 ms, aiming becomes frustrating. A real-time strategy game can tolerate 150 to 200 ms because players issue commands to units, not pixel-precise shots. A turn-based game like chess does not care about latency at all — you can play with a 2-second delay and never notice.

This tolerance spectrum drives architecture decisions. Shooters invest heavily in client-side prediction and lag compensation. Strategy games batch commands into lockstep turns. Card games simply wait for the server.

> **Word Notes**
> - *threshold* /ˈθreʃhoʊld/ — 阈值，临界点。"The pain threshold for FPS players is about 50 ms."
> - *compensate* /ˈkɒmpənseɪt/ — 补偿。"Lag compensation lets the server rewind time to validate a shot."

## The Fundamental Impossibility

Here is the uncomfortable truth: real-time synchronization across the internet is physically impossible. When a player in Seoul and a player in London both press a button at the exact same instant, neither can know about the other's action for at least 70 ms. For those 70 ms, each player's game world is a guess. Every multiplayer game you have ever played is an elaborate illusion — a carefully constructed lie that hides the gap between what happened and what you see.

The rest of this series is about how engineers build that illusion.

*In a world where light is too slow, every online game is a magic trick performed at 60 frames per second.*
